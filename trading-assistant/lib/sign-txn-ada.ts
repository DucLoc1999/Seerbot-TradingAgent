'use client'

import { BlockFrostAPI } from "@blockfrost/blockfrost-js";
import { BlockfrostProvider, MeshTxBuilder, BrowserWallet, resolveSlotNo } from "@meshsdk/core";
import { bech32 } from 'bech32';
// import { Asset, BlockfrostAdapter, NetworkId } from "@minswap/sdk";
const { Asset, BlockfrostAdapter, NetworkId } = await import("@minswap/sdk");
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

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

type PoolAddress = {
  poolAddress: string;
  tokenA: string;
  tokenB: string;
}

// Initialize BlockFrost
const api_key = 'mainnetkLL9cHgKyVFcl1kdHHqzoZr8pqoMV41k'
const bf = new BlockFrostAPI({ projectId: api_key })

let _api: BlockFrostAPI | null = null;
function initBlockfrostAPI() {
    if (_api) return _api;
    const api_key = process.env.BLOCKFROST_API_KEY || 'mainnetkLL9cHgKyVFcl1kdHHqzoZr8pqoMV41k';
    return new BlockFrostAPI({
        projectId: api_key,
    })
}

// Initialize Adapters
let _adapter: any | null = null;
function initAdapter() {
    if (_adapter) return _adapter;
    const bf = initBlockfrostAPI();
    _adapter = new BlockfrostAdapter({
        networkId: NetworkId.MAINNET,
        blockFrost: bf,
    })
    return _adapter;
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

function hexToBech32(hex: string): string {
  const data = Buffer.from(hex, 'hex');
  const words = bech32.toWords(data);
  return bech32.encode('addr', words);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
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
    // Get pool information
    const poolInfo = await findPool(fromAsset, toAsset);
    if (!poolInfo) {
      throw new Error('Pool not found');
    }
    const { poolAddress, tokenA, tokenB } = poolInfo;

    // Get pool state
    const poolState = await getPoolState(poolAddress);
    
    // Calculate amount out using constant product formula (x * y = k)
    const amountIn = BigInt(amount);
    const reserveIn = tokenA === fromAsset ? BigInt(poolState.reserveIn) : BigInt(poolState.reserveOut);
    const reserveOut = tokenA === fromAsset ? BigInt(poolState.reserveOut) : BigInt(poolState.reserveIn);
    
    // Calculate amount out with 0.3% fee
    const amountInWithFee = amountIn * BigInt(997) / BigInt(1000);
    const amountOut = (amountInWithFee * reserveOut) / (reserveIn + amountInWithFee);
    
    // Calculate minimum amount out with slippage
    const amountOutMin = amountOut * BigInt(Math.floor((1 - slippage) * 1000)) / BigInt(1000);

    return { amountOut, amountOutMin };
  } catch (error) {
    console.error('Error calculating amount out:', error);
    throw error;
  }
}

// Helper functions
async function findPool(fromAsset: string, toAsset: string): Promise<PoolAddress | null> {
  // console.log('Adapter.api.addressesUtxos?', typeof adapter.api.addressesUtxos);
  // console.log('Adapter initialized?', adapter['client']);
  // console.log('Adapter.api?', adapter['api']); // This should NOT be undefined
  try {
      const poolv2 = await _adapter?.getV2PoolByPair(
          Asset.fromString(fromAsset),
          Asset.fromString(toAsset)
      );
      if (!poolv2) {
          console.log('Pool not found in V2. Searching in V1...');
          const folderPath = './v1pools';
          const files = readdirSync(folderPath);
          const pools = files
            .filter(file => file.endsWith('.json'))
            .map(file => {
              const content = readFileSync(join(folderPath, file), 'utf-8');
              return JSON.parse(content);
            }).flat();
          for (const pool of pools) {
              if (
                  (pool.assetA === fromAsset && pool.assetB === toAsset) || 
                  (pool.assetA === toAsset && pool.assetB === fromAsset)
              ) {
                  return {poolAddress: pool.address, tokenA: pool.assetA, tokenB: pool.assetB};
              }
          }
          throw new Error("Pool not found");
      }
  
      return {poolAddress: poolv2.address, tokenA: poolv2.assetA, tokenB: poolv2.assetB};
  } catch (error) {
      console.error('Failed to fetch liquidity pool:', error);
      return null;
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

// async function findPool(fromAsset: string, toAsset: string) {
//   const pools = 0
// }

export async function swapTokensWithLace(
  fromAsset: string,
  toAsset: string,
  amountIn: string,
  amountOutMin: string,
  walletAddress: string,
) {
  try {
    // Get wallet API
    const wallet = await BrowserWallet.enable('lace')
    const walletAddressBech32 = hexToBech32(walletAddress)
    const changeAddress = await wallet.getChangeAddress();
    
    // Check balance
    const balance = await wallet.getBalance()
    // if (BigInt(amountIn) > BigInt(balance)) {
    //   throw new Error("Insufficient balance")
    // }

    // Get pool information
    const poolInfo = await findPool(fromAsset, toAsset);
    if (!poolInfo) {
      throw new Error('Pool not found');
    }
    const { poolAddress, tokenA, tokenB } = poolInfo;

    // Get pool state
    const poolState = await getPoolState(poolAddress);

    // Create provider
    const provider = new BlockfrostProvider(api_key)

    // Create transaction builder
    const txBuilder = new MeshTxBuilder({
      fetcher: provider,
      verbose: true,
    });

    // Get UTXOs for the wallet
    const utxos = await wallet.getUtxos()

    // // Add inputs
    // for (const utxo of utxos) {
    //   if (!utxo.tx_hash || typeof utxo.tx_index !== 'number') continue;
    //   txBuilder.txIn(utxo.tx_hash, utxo.tx_index);
    // }

    // Add user output
    txBuilder.txOut(walletAddressBech32, [
      {
        unit: toAsset,
        quantity: amountOutMin,
      },
      ...(toAsset !== 'lovelace' ? [{
        unit: 'lovelace',
        quantity: '2000000' // 2 ADA minimum
      }] : [])
    ]);

    // Add pool output
    txBuilder.txOut(poolAddress, [
      {
        unit: fromAsset === 'lovelace' ? 'lovelace' : fromAsset,
        quantity: poolState.reserveIn,
      },
      {
        unit: toAsset === 'lovelace' ? 'lovelace' : toAsset,
        quantity: poolState.reserveOut,
      }
    ]);

    // Get current slot for TTL
    let minutes = 10; // add 10 minutes
    let nowDateTime = new Date();
    let dateTimeAdd5Min = new Date(nowDateTime.getTime() + minutes*60000);
    const slot = resolveSlotNo('mainnet', dateTimeAdd5Min.getTime());

    // Build transaction
    const unsignedTx = await txBuilder
      .txOut(poolAddress, [
        {
          unit: fromAsset === 'lovelace' ? 'lovelace' : fromAsset,
          quantity: poolState.reserveIn,
        },
        {
          unit: toAsset === 'lovelace' ? 'lovelace' : toAsset,
          quantity: poolState.reserveOut,
        }
      ])
      .changeAddress(changeAddress)
      .selectUtxosFrom(utxos)
      .invalidHereafter(Number(slot)) 
      .complete()

    // Sign transaction
    const signedTx = await wallet.signTx(unsignedTx);
    
    // Submit transaction
    const txHash = await wallet.submitTx(signedTx);
    
    console.log(`Swap transaction hash: ${txHash}`)
    return txHash
  } catch (error) {
    console.error('Error executing swap:', error)
    throw error
  }
}

// Export functions
export {
  checkBalance,
  getTokenDecimal,
  getAmountOut,
  type TokenBalance,
  type SwapParams,
  hexToBech32,
};
