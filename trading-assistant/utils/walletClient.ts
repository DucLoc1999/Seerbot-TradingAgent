import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { chainConfig, chainId, RPC_URLS } from '@/config/chains';

// Create account from private key
const pk: `0x${string}` = `0x${process.env.ASSISTANT_PRIVATE_KEY}`
const account = privateKeyToAccount(pk)
// const account = privateKeyToAccount(process.env.ASSISTANT_PRIVATE_KEY as `0x${string}`);

// Create public client for reading blockchain state
export const publicClient = createPublicClient({
  chain: chainConfig[chainId],
  transport: http(RPC_URLS[chainId]),
});

export function getWalletClient() {
  const chain = chainConfig[chainId];

  return createWalletClient({
    account,
    chain,
    transport: http(RPC_URLS[chainId]),
  });
}

export async function waitForTransactionReceipt({ hash }: { hash: `0x${string}` }) {
  return publicClient.waitForTransactionReceipt({ hash });
}
