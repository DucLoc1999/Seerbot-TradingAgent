interface CardanoLace {
  enable(): Promise<{
    getUsedAddresses(): Promise<string[]>;
    signTx(tx: string, partialSign?: boolean): Promise<string>;
    signData(address: string, message: string): Promise<string>;
  }>;
}

interface Window {
  cardano?: {
    lace?: CardanoLace;
  };
}

declare global {
  interface Window {
    cardano?: {
      lace?: CardanoLace;
    };
  }
} 