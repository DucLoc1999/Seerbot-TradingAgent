import { BlockFrostAPI } from "@blockfrost/blockfrost-js";
import { getTokenPolicyId } from './tokenPolicyId';
import {
    Asset,
    BlockfrostAdapter,
    NetworkId, 
} from "@minswap/sdk";
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

type PoolAddress = {
    poolAddress: string;
    tokenA: string;
    tokenB: string;
  }

// Initialize BlockFrost
let _api: BlockFrostAPI | null = null;
function initBlockfrostAPI() {
    if (_api) return _api;
    const api_key = process.env.BLOCKFROST_API_KEY || 'mainnetkLL9cHgKyVFcl1kdHHqzoZr8pqoMV41k';
    return new BlockFrostAPI({
        projectId: api_key,
    })
}

// Initialize Adapters
let _adapter: BlockfrostAdapter | null = null;
function initAdapter() {
    if (_adapter) return _adapter;
    const bf = initBlockfrostAPI();
    _adapter = new BlockfrostAdapter({
        networkId: NetworkId.MAINNET,
        blockFrost: bf,
    })
    return _adapter;
}

// Helper function to convert lovelace to ADA
function lovelaceToAda(lovelace: number, decimal: number): number {
  return lovelace / (10 ** decimal);
}

// Helper function to convert ADA to lovelace
function adaToLovelace(ada: number): number {
  return ada * 1000000;
}

async function checkBalance(address: string, assetString: string): Promise<number> {
  let res: number = 0;
  const bf = initBlockfrostAPI();
  const utxos = await bf.addressesUtxos(address);
  for (const utxo of utxos) {
    for (const amount of utxo.amount) {
      if (amount.unit === assetString) res += parseInt(amount.quantity);
    }
  }
  return res;
}

async function getTokenDecimal(assetString: string): Promise<number> {
  if (assetString === 'lovelace') return 6;
  const bf = initBlockfrostAPI();
  const asset = await bf.assetsById(assetString);
  return asset.metadata?.decimals ?? 0;
}

async function findPoolAddress(fromAsset: string, toAsset: string): Promise<PoolAddress | null> {
    try {
        const adapter = initAdapter();
        const poolv2 = await adapter.getV2PoolByPair(
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
            console.log('pools length:', pools.length);
            throw new Error("Pool not found");
        }
    
        return {poolAddress: poolv2.address, tokenA: poolv2.assetA, tokenB: poolv2.assetB};
    } catch (error) {
        console.error('Failed to fetch liquidity pool:', error);
        return null;
    }
}

async function getPoolState(poolAddress: string | null): Promise<{ reserveIn: string, reserveOut: string }> {
  if (!poolAddress) {
    throw new Error('Pool address is null');
  }
  try {
    const bf = initBlockfrostAPI();
    const utxos = await bf.addressesUtxos(poolAddress);
    let reserveIn = '0';
    let reserveOut = '0';
    
    for (const utxo of utxos) {
      for (const amount of utxo.amount) {
        if (amount.unit === 'lovelace') {
          reserveIn = amount.quantity;
        } else {
          reserveOut = amount.quantity;
        }
      }
    }
    
    return { reserveIn, reserveOut };
  } catch (error) {
    console.error('Error getting pool state:', error);
    throw error;
  }
}

export async function getAmountOut(
    fromAsset: string,
    toAsset: string,
    amount: string,
    slippage: number
  ): Promise<{ amountOut: bigint, amountOutMin: bigint }> {
    try {
      // Get pool information
      const poolInfo = await findPoolAddress(fromAsset, toAsset);
      console.log('poolInfo:', poolInfo);
      if (!poolInfo) {
        throw new Error('Pool not found');
      }
      const { poolAddress, tokenA, tokenB } = poolInfo;
  
      // Get pool state
      const poolState = await getPoolState(poolAddress);
      
      // Calculate amount out using constant product formula (x * y = k)
      const amountIn = BigInt(adaToLovelace(Number(amount)));
      const reserveIn = tokenA === fromAsset ? BigInt(poolState.reserveIn) : BigInt(poolState.reserveOut);
      const reserveOut = tokenA === fromAsset ? BigInt(poolState.reserveOut) : BigInt(poolState.reserveIn);
      
      // Calculate amount out with 0.3% fee
      const amountInWithFee = amountIn * BigInt(997) / BigInt(1000);
      const amountOut = (amountInWithFee * reserveOut) / (reserveIn + amountInWithFee);
      
      // Calculate minimum amount out with slippage
      const amountOutMin = amountOut * BigInt(Math.floor((1 - slippage / 100) * 1000)) / BigInt(1000);
  
      return { amountOut, amountOutMin };
    } catch (error) {
      console.error('Error calculating amount out:', error);
      throw error;
    }
  }

export async function resolveTokenAddress(ticker: string): Promise<string> {
  if (ticker.toLowerCase() === 'ada') {
    return 'lovelace';
  }
  
  const policyId = getTokenPolicyId(ticker);
  if (!policyId) {
    throw new Error(`Could not find token "${ticker}". Please provide the token's policy ID.`);
  }
  
  return policyId;
}

export {
  checkBalance,
  getTokenDecimal,
  findPoolAddress,
  getPoolState,
  lovelaceToAda,
  adaToLovelace
};
