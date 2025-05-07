import { createWalletClient, createPublicClient, http, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { chainConfig, getHealthyRpc } from '../config/chains'
import { cookies } from "next/headers";

export let currentChainId: number = 56;

export function setChainId(newChainId: number) {
  console.log('--- Set chain called ---')
  if (newChainId !== currentChainId) {
    currentChainId = newChainId;
    console.log('New chain set:', currentChainId)
  } else {
    console.log('Keep the current chain:', currentChainId)
  }
}
export async function getWalletClient(chainId: number) {
  const chain = chainConfig[chainId];
  const rpcUrl = await getHealthyRpc(chainId);

  // Get private key
  const cookieStore = await cookies()
  const getPk = cookieStore.get('pk')
  if (!getPk) throw new Error('No private key found')
  const pk = getPk.value
  const privateKey = pk.startsWith('0x') ? pk as Address : `0x${pk}` as Address;
  const account = privateKeyToAccount(privateKey);

  const walletClient = createWalletClient({ account, chain, transport: http(rpcUrl) });
  return { walletClient, account }
}

export async function getPublicClient(chainId: number) {
  const chain = chainConfig[chainId];
  const rpcUrl = await getHealthyRpc(chainId);

  // Create  clients
  const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });
  
  return { publicClient }
}
