import { tool } from 'ai';
import { z } from 'zod';
import { checkAuth } from '@/app/actions/auth';
import { getAmountOut, resolveTokenAddress, lovelaceToAda } from '@/utils/cardano-utils';

const swapParamsSchema = z.object({
  fromToken: z.string().describe('Source token symbol (e.g. "ADA", "MIN")'),
  toToken: z.string().describe('Destination token symbol (e.g. "ADA", "MIN")'),
  amount: z.string().describe('Amount to swap (in human readable units)'),
  amountIn: z.string().describe('Amount of from token to swap (in human readable units). If none found, set to "-1"'),
  amountOut: z.string().describe('Amount of to token to swap (in human readable units). If none found, set to "-1"'),
  slippage: z.number().describe('Slippage in number from 0 to 100. If none found, set to 0.5'),
});

export const getSwapQuote = tool({
  description: "Get swap quote for Cardano tokens",
  parameters: swapParamsSchema,
  execute: async function (params) {
    console.log('----- Trigger get quote for Cardano swap -----')
    console.log({ params })
    const sessionResult = await checkAuth();
    if (!sessionResult) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    try {
      // Resolve fromToken
      const fromAsset = await resolveTokenAddress(params.fromToken);

      // Resolve toToken
      const toAsset = await resolveTokenAddress(params.toToken);

      // Get quote
      const { amountOut, amountOutMin } = await getAmountOut(
        fromAsset,
        toAsset,
        params.amount,
        params.slippage
      );

      // Form a response
      const estAmountOut = lovelaceToAda(Number(amountOut.toString()));
      const estAmountOutMin = lovelaceToAda(Number(amountOutMin.toString()));
      const content = `You're set to receive approximately ${estAmountOut} ${params.toToken}.
      With slippage of ${params.slippage}%, you will receive ${estAmountOutMin} at the minimal.
      Do you want to proceed?`;

      const quote = {
        fromToken: params.fromToken,
        toToken: params.toToken,
        amountIn: params.amount,
        estimatedAmountOut: estAmountOut.toString(),
      };

      console.log('getSwapQuote return: ', {
        success: true,
        content,
        quote,
      });
      
      return {
        success: true,
        content,
        quote,
      };
    } catch (error) {
      const content = `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.log(content);
      return { success: false, content };
    }
  }
});

export const prepForSwapAda = tool({
  description: "Prepare Cardano swap transaction info",
  parameters: swapParamsSchema,
  execute: async function (params) {
    console.log('----- Trigger prepare Cardano swap -----')
    console.log({ params })
    const sessionResult = await checkAuth();
    if (!sessionResult) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    try {
      // Resolve fromToken
      const fromAsset = await resolveTokenAddress(params.fromToken);

      // Resolve toToken
      const toAsset = await resolveTokenAddress(params.toToken);

      // Get quote
      const { amountOut, amountOutMin } = await getAmountOut(
        fromAsset,
        toAsset,
        params.amount,
        params.slippage
      );

      // Form a response
      const estAmountOut = lovelaceToAda(Number(amountOut.toString()));
      const estAmountOutMin = lovelaceToAda(Number(amountOutMin.toString()));
      const content = `Transaction prepared. Please sign this in your Lace wallet.
      You're set to receive approximately ${estAmountOut} ${params.toToken}.
      With slippage of ${params.slippage}%, you will receive ${estAmountOutMin} at the minimal.`;

      const preparedData = {
        fromToken: params.fromToken,
        toToken: params.toToken,
        estimatedAmountOut: estAmountOut.toString(),
        estimatedAmountOutMin: estAmountOutMin.toString(),
        fromAsset,
        toAsset,
        amountIn: params.amount,
      };

      console.log('prepForSwapAda return: ', {
        success: true,
        content,
        preparedData,
      });
      
      return {
        success: true,
        content,
        preparedData,
      };
    } catch (error) {
      const content = `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.log(content);
      return { success: false, content };
    }
  }
});

export const swapTools = {
  getQuote: getSwapQuote,
  prep: prepForSwapAda,
};
