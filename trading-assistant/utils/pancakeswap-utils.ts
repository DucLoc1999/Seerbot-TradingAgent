import { parseUnits, formatUnits, erc20Abi, type Address } from "viem";
import { PANCAKE_SWAP_ADDRESS, PANCAKE_SWAP_ABI, PANCAKE_FACTORY_ABI } from '../config/contracts'  // PancakeSwap Router V2 ABI and address
import { getWalletClient, getPublicClient, currentChainId } from "./getClients"

async function checkBalance (
  walletAddress: Address,
  tokenAddress: Address
) {
  const { publicClient } = await getPublicClient(currentChainId)
  const balance = await publicClient.readContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [walletAddress]
  })
  return balance
}

async function getTokenDecimal(tokenAddress: Address) {
  const { publicClient } = await getPublicClient(currentChainId)
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
  spenderAddress: Address
) {
  const { publicClient } = await getPublicClient(currentChainId)
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
  amount: BigInt | number,
  decimal?: number
) {
  const { publicClient } = await getPublicClient(currentChainId)
  const { walletClient } = await getWalletClient(currentChainId)
  const approveAmount = typeof amount === 'bigint'
  ? amount
  : parseUnits(`${amount}`, decimal ? decimal : 18)

  const approveHash = await walletClient.writeContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'approve',
    args: [spenderAddress, approveAmount]
  })

  const approveReceipt = publicClient.waitForTransactionReceipt({ hash: approveHash })
  return { approveHash, approveReceipt }
}

export async function getAmountOut (
  path: Address[],
  amount: bigint | string,
  slippage: number,
  decimal?: number
) {
  const { publicClient } = await getPublicClient(currentChainId)
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

export async function swapExactTokensForTokens(
  tokenIn: Address, 
  tokenOut: Address,
  amountIn: string,
  slippage: number
) {
  // Get clients
  const { publicClient } = await getPublicClient(currentChainId)
  const { walletClient, account } = await getWalletClient(currentChainId)

  // Get decimal
  const tokenInDecimal = await getTokenDecimal(tokenIn)
  const tokenOutDecimal = await getTokenDecimal(tokenOut)

  // Config txn arguments
  const amountInWei = parseUnits(amountIn, tokenInDecimal);
  const path = [tokenIn, tokenOut];
  const to = account.address;
  const deadline = Date.now() + 60 * 10;

  // Check wallet balance
  const balance = await checkBalance(account.address, tokenIn)
  if (amountInWei > balance) {
    throw new Error("Insufficient balance")
  }

  // Check allowance
  const allowance = await checkAllowance(tokenIn, account.address, PANCAKE_SWAP_ADDRESS)
  if (amountInWei > allowance) {
    console.log("Run approve token")
    const { approveHash, approveReceipt } = await approveToken(tokenIn, PANCAKE_SWAP_ADDRESS, amountInWei * 100n, tokenInDecimal)
    console.log(`Approval hash: ${approveHash}\nReceipt: ${approveReceipt}`)
  }

  // Get amount out
  const { amountsOut, amountOutMin } = await getAmountOut(path, amountInWei, slippage, tokenOutDecimal)

  console.log('----- Log before swap -----')
  console.log({
    allowance: { tokenIn, amountInWei, allowance },
    amountOut: {
      amountsOut,
      amountsOutReadable: [
        formatUnits(amountsOut[0], tokenInDecimal),
        formatUnits(amountsOut[1], tokenOutDecimal)
      ]
    },
    amountOutMin: {
      amountOutMin,
      amountOutMinReadable: formatUnits(amountOutMin, tokenOutDecimal),
    },
  })

  // Send transaction
  const txnHash = await walletClient.writeContract({
    address: PANCAKE_SWAP_ADDRESS,
    abi: PANCAKE_SWAP_ABI,
    functionName: "swapExactTokensForTokens",
    args: [amountInWei, amountOutMin, path, to, BigInt(deadline * 1000)],
  });

  const txnReceipt = await publicClient.waitForTransactionReceipt({ hash: txnHash })

  console.log(`Swap transaction hash: ${txnHash}`);
  return txnHash
}

// Get txn info - will do this later
async function getTxnInfo(txnHash: `0x${string}`) {
  const { publicClient } = await getPublicClient(currentChainId)
  const txnReceipt = await publicClient.waitForTransactionReceipt({ hash: txnHash })
}
