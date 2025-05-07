import { BlockFrostAPI } from "@blockfrost/blockfrost-js";
import {
    BlockfrostAdapter,
    NetworkId, 
} from "@minswap/sdk";

const bf = new BlockFrostAPI({
    projectId: 'mainnetkLL9cHgKyVFcl1kdHHqzoZr8pqoMV41k',
})

const adapter = new BlockfrostAdapter({
    networkId: NetworkId.MAINNET,
    blockFrost: bf,
});

// console.log('Adapter.api.addressesUtxos?', typeof adapter.api.addressesUtxos);
// console.log('Adapter initialized?', adapter['client']);
// console.log('Adapter.api?', adapter['api']);

// await adapter.initialize();

const pools = await adapter.getV1Pools({
  page: 1,
  count: 100,
  order: 'asc'
});

console.log('Pools:', pools);