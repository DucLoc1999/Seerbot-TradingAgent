import { BlockFrostAPI } from "@blockfrost/blockfrost-js";
import { getTokenPolicyId } from './tokenPolicyId';
import {
    Asset,
    BlockfrostAdapter,
    NetworkId, 
} from "@minswap/sdk";

// Initialize BlockFrost
function initBlockfrostAPI() {
    const api_key = process.env.BLOCKFROST_API_KEY || 'mainnetkLL9cHgKyVFcl1kdHHqzoZr8pqoMV41k';
    return new BlockFrostAPI({
        projectId: api_key,
    })
}

// Initialize Adapters
function initAdapter() {
    const bf = initBlockfrostAPI();
    const adapter = new BlockfrostAdapter({
        networkId: NetworkId.MAINNET,
        blockFrost: bf,
    })
    return adapter;
}

// Helper function to convert lovelace to ADA
function lovelaceToAda(lovelace: number): number {
  return lovelace / 1000000;
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

async function findPoolAddress(fromAsset: string, toAsset: string): Promise<string | null> {
    console.log('----- Find pool address -----')
    console.log({ fromAsset, toAsset });
    try {
        const adapter = initAdapter();
        const poolv2 = await adapter.getV2PoolByPair(
            Asset.fromString(fromAsset),
            Asset.fromString(toAsset)
        );
        if (!poolv2) {
            console.log('Pool not found in V2. Searching in V1...');
            const pools = await adapter.getV1Pools({
                page: 1,
                count: 100,
                order: 'asc'
            });
            console.log({ poolsv1: pools });
            for (const pool of pools) {
                console.log({ pool, fromAsset, toAsset });
                if (
                    (pool.assetA === fromAsset && pool.assetB === toAsset) || 
                    (pool.assetA === toAsset && pool.assetB === fromAsset)
                ) {
                    return pool.address;
                }
            }
            throw new Error("Pool not found");
        }
    
        return poolv2.address;
    } catch (error) {
        console.error('Failed to fetch liquidity pool:', error);
        return null;
    }
}

async function getPoolState(poolAddress: string): Promise<{ reserveIn: string, reserveOut: string }> {
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
    console.log('----- Get amount out calleds -----')
    console.log('params: ',{ fromAsset, toAsset, amount, slippage });
    // Get pool information
    const poolAddress = await findPoolAddress(fromAsset, toAsset);
    if (!poolAddress) {
      throw new Error('Pool not found');
    }

    // Get pool state
    const poolState = await getPoolState(poolAddress);
    
    // Calculate amount out using constant product formula (x * y = k)
    const amountIn = BigInt(amount);
    const reserveIn = BigInt(poolState.reserveIn);
    const reserveOut = BigInt(poolState.reserveOut);
    
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
