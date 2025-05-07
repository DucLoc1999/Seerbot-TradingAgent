'use client'

// import { BlockFrostAPI } from "@blockfrost/blockfrost-js";
// import * as CSL from '@emurgo/cardano-serialization-lib-asmjs';
const { BlockFrostAPI } = await import('@blockfrost/blockfrost-js');
const CSL = await import('@emurgo/cardano-serialization-lib-browser');

// Types
interface TokenBalance {
  asset: string;
  amount: number;
  decimals: number;
}

interface SwapParams {
  fromAsset: string;
  toAsset: string;
  amount: string;
  slippage: number;
  walletAddress: string;
}

// Initialize BlockFrost
const api_key = 'mainnetkLL9cHgKyVFcl1kdHHqzoZr8pqoMV41k'
const bf = new BlockFrostAPI({ projectId: api_key })

// Helper function to convert lovelace to ADA
function lovelaceToAda(lovelace: number): number {
  return lovelace / 1000000;
}

// Helper function to convert ADA to lovelace
function adaToLovelace(ada: number): number {
  return ada * 1000000;
}

async function checkBalance(address: string, assetString: string): Promise<number> {
  let res: number = 0
  const utxos = await bf.addressesUtxos(address)
  for (const utxo of utxos) {
    for (const amount of utxo.amount) {
      if (amount.unit === assetString) res += parseInt(amount.quantity)
    }
  }
  return res
}

async function getTokenDecimal(assetString: string): Promise<number> {
  if (assetString === 'lovelace') return 6
  const asset = await bf.assetsById(assetString)
  return asset.metadata?.decimals ?? 0;
}

async function getAmountOut(
  fromAsset: string,
  toAsset: string,
  amount: string,
  slippage: number
): Promise<{ amountOut: bigint, amountOutMin: bigint }> {
  try {
    // Get pool information from BlockFrost
    const poolAddress = await findPoolAddress(fromAsset, toAsset)
    if (!poolAddress) {
      throw new Error('Pool not found')
    }

    // Get pool state
    const poolState = await getPoolState(poolAddress)
    
    // Calculate amount out using constant product formula (x * y = k)
    const amountIn = BigInt(amount)
    const reserveIn = BigInt(poolState.reserveIn)
    const reserveOut = BigInt(poolState.reserveOut)
    
    // Calculate amount out with 0.3% fee
    const amountInWithFee = amountIn * BigInt(997) / BigInt(1000)
    const amountOut = (amountInWithFee * reserveOut) / (reserveIn + amountInWithFee)
    
    // Calculate minimum amount out with slippage
    const amountOutMin = amountOut * BigInt(Math.floor((1 - slippage) * 1000)) / BigInt(1000)

    return { amountOut, amountOutMin }
  } catch (error) {
    console.error('Error calculating amount out:', error)
    throw error
  }
}

export async function swapTokensWithLace(
  fromAsset: string,
  toAsset: string,
  amountIn: string,
  amountOutMin: string,
  walletAddress: string,
) {
  try {
    // Check if Lace wallet is available
    if (!window.cardano?.lace) {
      throw new Error('Lace wallet is not installed')
    }

    // Get wallet API
    const lace = await window.cardano.lace.enable()
    
    // Check balance
    const balance = await checkBalance(walletAddress, fromAsset)
    if (BigInt(amountIn) > BigInt(balance)) {
      throw new Error("Insufficient balance")
    }

    // Get protocol parameters
    const protocolParams = await bf.epochsLatestParameters()
    if (!protocolParams.coins_per_utxo_size || !protocolParams.max_val_size) {
      throw new Error('Could not get protocol parameters')
    }

    // Get pool information
    const poolAddress = await findPoolAddress(fromAsset, toAsset)
    if (!poolAddress) {
      throw new Error('Pool not found for the specified token pair')
    }

    // Get pool state
    const poolState = await getPoolState(poolAddress)
    
    // Create transaction builder
    const txBuilder = CSL.TransactionBuilder.new(
      CSL.TransactionBuilderConfigBuilder.new()
        .fee_algo(
          CSL.LinearFee.new(
            CSL.BigNum.from_str(protocolParams.min_fee_a.toString()),
            CSL.BigNum.from_str(protocolParams.min_fee_b.toString())
          )
        )
        .pool_deposit(CSL.BigNum.from_str(protocolParams.pool_deposit))
        .key_deposit(CSL.BigNum.from_str(protocolParams.key_deposit))
        .coins_per_utxo_byte(CSL.BigNum.from_str(protocolParams.coins_per_utxo_size))
        .max_value_size(parseInt(protocolParams.max_val_size))
        .max_tx_size(protocolParams.max_tx_size)
        .build()
    )

    // Get UTXOs for the wallet
    const utxos = await bf.addressesUtxos(walletAddress)
    
    // Add inputs
    for (const utxo of utxos) {
      if (!utxo.tx_hash || typeof utxo.tx_index !== 'number') continue;
      
      const txInput = CSL.TransactionInput.new(
        CSL.TransactionHash.from_bytes(Buffer.from(utxo.tx_hash, 'hex')),
        utxo.tx_index
      )

      // Create value with both ADA and native tokens if present
      const value = CSL.Value.new(CSL.BigNum.from_str('0'))
      
      // Add ADA amount
      const adaAmount = utxo.amount.find(a => a.unit === 'lovelace')
      if (adaAmount) {
        value.set_coin(CSL.BigNum.from_str(adaAmount.quantity))
      }

      // Add native tokens if present
      for (const amount of utxo.amount) {
        if (amount.unit !== 'lovelace') {
          const assetName = CSL.AssetName.new(Buffer.from(amount.unit.slice(56), 'hex'))
          const policyId = CSL.ScriptHash.from_bytes(Buffer.from(amount.unit.slice(0, 56), 'hex'))
          const multiAsset = CSL.MultiAsset.new()
          const assets = CSL.Assets.new()
          assets.insert(assetName, CSL.BigNum.from_str(amount.quantity))
          multiAsset.insert(policyId, assets)
          value.set_multiasset(multiAsset)
        }
      }

      const inputsBuilder = CSL.TxInputsBuilder.new();
      const output = CSL.TransactionOutput.new(CSL.Address.from_bech32(walletAddress), value);
      const txUnspentOutput = CSL.TransactionUnspentOutput.new(txInput, output);
      inputsBuilder.add_regular_utxo(txUnspentOutput);
      txBuilder.set_inputs(inputsBuilder);
    }

    // Create output value with both ADA and native tokens
    const outputValue = CSL.Value.new(CSL.BigNum.from_str('0'))

    // Add ADA to output if it's the destination token
    if (toAsset === 'lovelace') {
      outputValue.set_coin(CSL.BigNum.from_str(amountOutMin))
    } else {
      // Add native token to output
      const assetName = CSL.AssetName.new(Buffer.from(toAsset.slice(56), 'hex'))
      const policyId = CSL.ScriptHash.from_bytes(Buffer.from(toAsset.slice(0, 56), 'hex'))
      const multiAsset = CSL.MultiAsset.new()
      const assets = CSL.Assets.new()
      assets.insert(assetName, CSL.BigNum.from_str(amountOutMin))
      multiAsset.insert(policyId, assets)
      outputValue.set_multiasset(multiAsset)

      // Add minimum ADA required for the output
      const minAda = CSL.BigNum.from_str('2000000') // 2 ADA minimum
      outputValue.set_coin(minAda)
    }

    // Add output
    const output = CSL.TransactionOutput.new(
      CSL.Address.from_bech32(walletAddress),
      outputValue
    )
    txBuilder.add_output(output)

    // Add pool output (returning tokens to the pool)
    const poolOutputValue = CSL.Value.new(CSL.BigNum.from_str('0'))
    
    // Add remaining ADA to pool
    const remainingAda = CSL.BigNum.from_str(poolState.reserveIn)
    poolOutputValue.set_coin(remainingAda)

    // Add remaining native tokens to pool
    if (toAsset !== 'lovelace') {
      const assetName = CSL.AssetName.new(Buffer.from(toAsset.slice(56), 'hex'))
      const policyId = CSL.ScriptHash.from_bytes(Buffer.from(toAsset.slice(0, 56), 'hex'))
      const multiAsset = CSL.MultiAsset.new()
      const assets = CSL.Assets.new()
      assets.insert(assetName, CSL.BigNum.from_str(poolState.reserveOut))
      multiAsset.insert(policyId, assets)
      poolOutputValue.set_multiasset(multiAsset)
    }

    const poolOutput = CSL.TransactionOutput.new(
      CSL.Address.from_bech32(poolAddress),
      poolOutputValue
    )
    txBuilder.add_output(poolOutput)

    // Set TTL (Time To Live)
    const slot = await bf.blocksLatest()
    if (!slot?.slot) throw new Error('Could not get current slot')
    txBuilder.set_ttl(slot.slot + 7200) // 2 hours from now

    // Build transaction
    const txBody = txBuilder.build()
    const tx = CSL.Transaction.new(
      txBody,
      CSL.TransactionWitnessSet.new()
    )

    // Helper function to convert bytes to hex
    function bytesToHex(bytes: Uint8Array): string {
      return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }

    // Sign transaction with Lace wallet
    const txHex = bytesToHex(tx.to_bytes());
    const signedTx = await lace.signTx(txHex, false);
    
    // Submit transaction
    const txHash = await bf.txSubmit(signedTx)
    
    console.log(`Swap transaction hash: ${txHash}`)
    return txHash
  } catch (error) {
    console.error('Error executing swap:', error)
    throw error
  }
}

// Helper functions
async function findPoolAddress(fromAsset: string, toAsset: string): Promise<string | null> {
  try {
    const pools = await bf.pools()
    
    for (const pool of pools) {
      const poolInfo = await bf.poolsById(pool)
      if (!poolInfo) continue
      
      const hasFromAsset = poolInfo.hex === fromAsset
      const hasToAsset = poolInfo.hex === toAsset
      
      if (hasFromAsset && hasToAsset) {
        return pool
      }
    }
    
    return null
  } catch (error) {
    console.error('Error finding pool:', error)
    return null
  }
}

async function getPoolState(poolAddress: string): Promise<{ reserveIn: string, reserveOut: string }> {
  try {
    const utxos = await bf.addressesUtxos(poolAddress)
    let reserveIn = '0'
    let reserveOut = '0'
    
    for (const utxo of utxos) {
      for (const amount of utxo.amount) {
        if (amount.unit === 'lovelace') {
          reserveIn = amount.quantity
        } else {
          reserveOut = amount.quantity
        }
      }
    }
    
    return { reserveIn, reserveOut }
  } catch (error) {
    console.error('Error getting pool state:', error)
    throw error
  }
}

// Export functions
export {
  checkBalance,
  getTokenDecimal,
  getAmountOut,
  type TokenBalance,
  type SwapParams
};
