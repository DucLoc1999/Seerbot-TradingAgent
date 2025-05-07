'use client'

import {
  createPublicClient,
  createWalletClient,
  custom,
  parseUnits,
  erc20Abi,
  type Address,
  type PublicClient,
  type WalletClient,
  type Account,
  type Chain,
} from 'viem'
import { chainConfig } from '@/config/chains';
import { PANCAKE_SWAP_ADDRESS, PANCAKE_SWAP_ABI } from '../config/contracts'  // PancakeSwap Router V2 ABI and address

async function checkBalance (
  walletAddress: Address,
  tokenAddress: Address,
  publicClient: PublicClient
) {
  const balance = await publicClient.readContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [walletAddress]
  })
  return balance
}

async function getTokenDecimal(tokenAddress: Address, publicClient: PublicClient) {
  const decimal = await publicClient.readContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'decimals',
  })
  return decimal
}

async function checkAllowance (
  tokenAddress: Address,
  ownerAddress: Address,
  spenderAddress: Address,
  publicClient: PublicClient,
) {
  const allowance = await publicClient.readContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [ownerAddress, spenderAddress]
  })
  return allowance
}

async function approveToken(
  tokenAddress: Address,
  spenderAddress: Address,
  amount: bigint | number,
  publicClient: PublicClient,
  walletClient: WalletClient,
  account: Account,
  chain: Chain,
  decimal?: number,
) {
  const approveAmount = typeof amount === 'bigint'
  ? amount
  : parseUnits(`${amount}`, decimal ? decimal : 18)

  const approveHash = await walletClient.writeContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'approve',
    args: [spenderAddress, approveAmount],
    account,
    chain,
  })

  const approveReceipt = publicClient.waitForTransactionReceipt({ hash: approveHash })
  return { approveHash, approveReceipt }
}

export async function getAmountOut (
  path: Address[],
  amount: bigint | string,
  slippage: number,
  publicClient: PublicClient,
  decimal?: number
) {
  const amountWei = typeof amount === 'bigint' ? amount : parseUnits(amount, decimal ? decimal : 18);

  const amountsOut = await publicClient.readContract({
    address: PANCAKE_SWAP_ADDRESS,
    abi: PANCAKE_SWAP_ABI,
    functionName: "getAmountsOut",
    args: [amountWei, path],
  });
  
  const amountOutMin = amountsOut[1] - (amountsOut[1] * BigInt(slippage * 100) / 10000n);
  return { amountsOut, amountOutMin }
}

export async function swapTokensWithMetaMask(
  fromTokenAddress: Address,
  toTokenAddress: Address,
  amountIn: string,
  amountOutMin: string,
  chainId: number
) {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed')
  }
  // Get provider, account
  const provider = window.ethereum
  const chain = chainConfig[chainId]
  console.log({ chainId, chain })

  const [account] = await window.ethereum.request({ method: 'eth_requestAccounts' })

  // Get clients
  const walletClient = createWalletClient({
    chain: chainConfig[chainId],
    transport: custom(provider)
  })

  const [walletAddress] = await walletClient.getAddresses();

  const publicClient = createPublicClient({
    chain: chainConfig[chainId],
    transport: custom(provider)
  })

  // Get decimals
  const fromTokenDecimal = await getTokenDecimal(fromTokenAddress, publicClient)
  const toTokenDecimal = await getTokenDecimal(toTokenAddress, publicClient)

  // Form arguments
  const amountInWei = parseUnits(amountIn, fromTokenDecimal)
  const amountOutMinWei = parseUnits(amountOutMin, toTokenDecimal)
  const deadline = Date.now() + 60 * 10

  // Check wallet balance
  const balance = await checkBalance(walletAddress, fromTokenAddress, publicClient)
  if (amountInWei > balance) {
    throw new Error("Insufficient balance")
  }

  // Check allowance
  const allowance = await checkAllowance(
    fromTokenAddress,
    walletAddress,
    PANCAKE_SWAP_ADDRESS,
    publicClient
  )
  if (amountInWei > allowance) {
    const { approveHash, approveReceipt } = await approveToken(
      fromTokenAddress,
      PANCAKE_SWAP_ADDRESS,
      amountInWei,
      publicClient,
      walletClient,
      account,
      chain,
      fromTokenDecimal
    )
    console.log(`Approval hash: ${approveHash}\nReceipt: ${approveReceipt}`)
  }

  console.log('--- Start transaction ---')
  const txnHash = await walletClient.writeContract({
    address: PANCAKE_SWAP_ADDRESS,
    abi: PANCAKE_SWAP_ABI,
    functionName: 'swapExactTokensForTokens',
    args: [
      amountInWei,
      amountOutMinWei,
      [fromTokenAddress, toTokenAddress],
      walletAddress,
      BigInt(deadline * 1000)
    ],
    account,
    chain
  })

  // const txnReceipt = await publicClient.waitForTransactionReceipt({ hash: txnHash })
  console.log(`Swap transaction hash: ${txnHash}`);
  return txnHash
}
