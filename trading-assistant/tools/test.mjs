import { BlockFrostAPI } from "@blockfrost/blockfrost-js";
import {
    BlockfrostAdapter,
    NetworkId,
} from "@minswap/sdk";
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const TOKEN_POLICY_ID = {
    ada: "lovelace",
    usdc: "25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff93555534443",
    min: "29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c64d494e",
    eth: "25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff935455448",
    sundae: "9a9693a9a37912a5097918f97918d15240c92ab729a0b7c4aa144d7753554e444145",
    wingriders: "c0ee29a85b13209423b10447d3c2e6a50641a15c57770e27cb9d507357696e67526964657273",
    near: "f51057ac9d6fa7e06719f7c984c1bc2839d0f280ae757557091141704e454152",
  }

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

// for (let i = 0; i < 10; i++) {
//   const pools = await adapter.getAllV2Pools();
//   if (pools.length) {
//     const fileName = `v2pools/pools-${i}.json`;
//     console.log(`${pools.length} pools found on page ${i}. Saving to ${fileName}`);
//     writeFileSync(fileName, JSON.stringify(pools, null, 2));
//   } else {
//     console.log(`No pools found on page ${i}`);
//   }
// }

// const pools = await adapter.getV2PoolByLp(Asset.fromString('29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c64d494e'));
// const fileName = `v2pools/pools.json`;
// console.log('pools:', pools);
// if (!!pools && pools.length) {
//   console.log(`${pools.length} pools found. Saving to ${fileName}`);
//   writeFileSync(fileName, JSON.stringify(pools, null, 2));
// } else {
//   console.log('No pools found');
// }


// const data = readFileSync('poolsv1/pools-0.json', 'utf8');
// const pools = JSON.parse(data);

// console.log(pools);
// console.log('Pools length:', pools.length);

// const pool = pools[0];
// console.log('Pool 1 value:', pool.value);



const folderPath = './v1pools';

// Read all files in the folder
const files = readdirSync(folderPath);

// Filter JSON files and parse them
const allData = files
  .filter(file => file.endsWith('.json'))
  .map(file => {
    const content = readFileSync(join(folderPath, file), 'utf-8');
    return JSON.parse(content);
  }).flat();

for (const token in TOKEN_POLICY_ID) {
	console.log(token);
	const pools = allData.filter(p => p.assetA === TOKEN_POLICY_ID[token] || p.assetB === TOKEN_POLICY_ID[token]);
  console.log(pools.map(p => {
    return {
      address: p.address,
      assetA: p.assetA,
      assetB: p.assetB,
    }
  }));
}

// console.log(allData);
// console.log(allData.length);
// console.log(typeof allData);
// console.log(allData[0]);

// console.log('Pools:', pools);