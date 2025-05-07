import {
  ADA, Asset,
  BlockfrostAdapter,
  DexV2,
  NetworkId, 
  OrderV2,
  PoolV2,
  SwapExactInOptions,
  calculateSwapExactIn
} from "@minswap/sdk";
import { BlockFrostAPI } from "@blockfrost/blockfrost-js";
import * as CSL from '@emurgo/cardano-serialization-lib-browser';

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

interface SwapCalculation {
  amountOut: bigint;
  priceImpact: number;
  fee: bigint;
}

// Init BlockFrost
const api_key = 'mainnetkLL9cHgKyVFcl1kdHHqzoZr8pqoMV41k'
const api_url = 'https://cardano-mainnet.blockfrost.io/api/v0'
const bf = new BlockFrostAPI({ projectId: api_key, network: 'mainnet' })

// Constants
const mainnetId = NetworkId.MAINNET
const MIN: Asset = {
  policyId: "e16c2dc8ae937e8d3790c7fd7168d7b994621ba14ca11415f39fed72",
  tokenName: "4d494e",
};

// Functions
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

async function checkAllowance(
  walletAddress: string,
  tokenAddress: string,
  spenderAddress: string
): Promise<number> {
  try {
    const utxos = await bf.addressesUtxos(walletAddress)
    let allowance = 0
    
    for (const utxo of utxos) {
      for (const amount of utxo.amount) {
        if (amount.unit === tokenAddress) {
          allowance += parseInt(amount.quantity)
        }
      }
    }
    
    return allowance
  } catch (error) {
    console.error('Error checking allowance:', error)
    throw error
  }
}

async function approveToken(
  walletAddress: string,
  tokenAddress: string,
  spenderAddress: string,
  amount: string
): Promise<string> {
  try {
    // Create transaction using CSL
    const txBuilder = CSL.TransactionBuilder.new(
      CSL.TransactionBuilderConfigBuilder.new()
        .fee_algo(
          CSL.LinearFee.new(
            CSL.BigNum.from_str('44'),
            CSL.BigNum.from_str('155381')
          )
        )
        .pool_deposit(CSL.BigNum.from_str('500000000'))
        .key_deposit(CSL.BigNum.from_str('2000000'))
        .coins_per_utxo_byte(CSL.BigNum.from_str('4310'))
        .max_value_size(5000)
        .max_tx_size(16384)
        .build()
    )

    // Note: This is a simplified version. In a real implementation,
    // you would need to add proper transaction building logic here
    // including proper UTXO selection, witness creation, etc.

    return "Transaction hash will be returned here"
  } catch (error) {
    console.error('Error approving token:', error)
    throw error
  }
}

async function getAmountOut(
  fromAsset: string,
  toAsset: string,
  amount: string
): Promise<SwapCalculation> {
  try {
    const adapter = new BlockfrostAdapter({blockFrost: bf, networkId: mainnetId})
    const dex = new DexV2(adapter)

    const fromAssetObj = fromAsset === 'lovelace' ? ADA : {
      policyId: fromAsset.slice(0, 56),
      tokenName: fromAsset.slice(56)
    }

    const toAssetObj = toAsset === 'lovelace' ? ADA : {
      policyId: toAsset.slice(0, 56),
      tokenName: toAsset.slice(56)
    }

    const amountIn = BigInt(amount)

    const swapOptions: SwapExactInOptions = {
      assetIn: fromAssetObj,
      amountIn: amountIn,
      minimumAmountOut: BigInt(0) // We'll calculate this after getting the quote
    }

    const calculation = await calculateSwapExactIn(dex, swapOptions)

    return {
      amountOut: calculation.amountOut,
      priceImpact: calculation.priceImpact,
      fee: BigInt(0) // Fee is not returned by calculateSwapExactIn
    }
  } catch (error) {
    console.error('Error calculating amount out:', error)
    throw error
  }
}

async function executeSwapToken(params: SwapParams): Promise<string> {
  try {
    const { fromAsset, toAsset, amount, slippage, walletAddress } = params
    
    // Get the swap calculation
    const calculation = await getAmountOut(fromAsset, toAsset, amount)
    
    // Create transaction using CSL
    const txBuilder = CSL.TransactionBuilder.new(
      CSL.TransactionBuilderConfigBuilder.new()
        .fee_algo(
          CSL.LinearFee.new(
            CSL.BigNum.from_str('44'),
            CSL.BigNum.from_str('155381')
          )
        )
        .pool_deposit(CSL.BigNum.from_str('500000000'))
        .key_deposit(CSL.BigNum.from_str('2000000'))
        .coins_per_utxo_byte(CSL.BigNum.from_str('4310'))
        .max_value_size(5000)
        .max_tx_size(16384)
        .build()
    )

    // Note: This is a simplified version. In a real implementation,
    // you would need to add proper transaction building logic here
    // including proper UTXO selection, witness creation, etc.

    return "Transaction hash will be returned here"
  } catch (error) {
    console.error('Error executing swap:', error)
    throw error
  }
}

// Export all functions
export {
  checkBalance,
  getTokenDecimal,
  checkAllowance,
  approveToken,
  getAmountOut,
  executeSwapToken,
  type TokenBalance,
  type SwapParams
};


// export {
// ADA, Asset,
// BlockfrostAdapter, BlockfrostAdapterOptions,
// BuildCancelOrderOptions, BuildDepositTxOptions,
// BuildSwapExactInTxOptions, BuildSwapExactOutTxOptions,
// BuildWithdrawTxOptions,
// BuildZapInTxOptions,
// BulkOrdersOption,
// CalculateDepositOptions,
// CalculateSwapExactInOptions,
// CalculateSwapExactOutOptions,
// CalculateWithdrawOptions,
// CalculateZapInOptions,
// CancelBulkOrdersOptions,
// CreatePoolV2Options,
// DEFAULT_POOL_V2_TRADING_FEE_DENOMINATOR,
// DepositOptions,
// Dex, 
// DexV1Constant,
// DexV2,
// DexV2Calculation,
// DexV2Constant,
// FIXED_DEPOSIT_ADA,
// GetPoolByIdParams,
// GetPoolHistoryParams,
// GetPoolInTxParams,
// GetPoolPriceParams,
// GetPoolsParams,
// GetStablePoolInTxParams,
// GetV2PoolPriceParams,
// MetadataMessage,
// MultiRoutingOptions,
// NetworkEnvironment,
// NetworkId,
// OCOOptions,
// OrderOptions,
// OrderV1, OrderV2,
// OrderV2SwapRouting, PartialSwapOptions,
// PoolV1, PoolV2,
// StableOrder, StablePool, StableswapConstant, StopOptions, SwapExactInOptions, SwapExactOutOptions,
// WithdrawImbalanceOptions, WithdrawOptions,
// ZapOutOptions,
// calculateDeposit,
// calculateSwapExactIn, calculateSwapExactOut,
// calculateWithdraw, calculateZapIn
// };
