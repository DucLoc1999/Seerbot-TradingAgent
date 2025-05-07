'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

function ConnectWalletClient() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const checkConnection = async () => {
      if (!isMounted || !window.cardano?.lace) return;

      try {
        const lace = await window.cardano.lace.enable();
        console.log('Lace wallet enabled:', lace);

        const usedAddresses = await lace.getUsedAddresses();
        console.log('Used addresses:', usedAddresses);

        // For debugging, let's check what methods are available
        console.log('Available methods:', Object.keys(lace));

        if (usedAddresses.length > 0) {
          setIsConnected(true);
          setAddress(usedAddresses[0]);
        }
      } catch (error) {
        console.error('Error checking Lace connection:', error);
        setIsConnected(false);
        setAddress(null);
      }
    };

    checkConnection();
  }, [isMounted]);

  const connectWallet = async () => {
    if (!window.cardano?.lace) {
      window.open('https://www.lace.io/', '_blank');
      return;
    }

    setIsLoading(true);
    try {
      const lace = await window.cardano.lace.enable();
      // console.log('Lace wallet enabled:', lace);

      const usedAddresses = await lace.getUsedAddresses();
      // console.log('Used addresses:', usedAddresses);

      // For debugging, let's check what methods are available
      // console.log('Available methods:', Object.keys(lace));

      if (usedAddresses.length > 0) {
        setIsConnected(true);
        setAddress(usedAddresses[0]);
      }
    } catch (error) {
      console.error('Error connecting to Lace:', error);
      setIsConnected(false);
      setAddress(null);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAddress(null);
  };

  // Don't render anything until after hydration
  if (!isMounted) {
    return null;
  }

  if (!window.cardano?.lace) {
    return (
      <Button
        onClick={() => window.open('https://www.lace.io/', '_blank')}
        className="h-9 bg-[#1A64F0] px-4 text-white transition-colors hover:bg-[#1554D0]"
      >
        <span className="text-sm font-medium">Install Lace Wallet</span>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {isConnected ? (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="h-9 px-3 hover:bg-[#1A64F0]/10"
          >
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium text-[#1A64F0]">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
            </div>
          </Button>
          <Button
            variant="outline"
            onClick={disconnectWallet}
            className="h-9 border-[#1A64F0] px-3 text-[#1A64F0] transition-colors hover:bg-[#1A64F0] hover:text-white"
          >
            <span className="text-sm font-medium">Disconnect</span>
          </Button>
        </div>
      ) : (
        <Button
          onClick={connectWallet}
          disabled={isLoading}
          className="h-9 bg-[#1A64F0] px-6 text-white shadow-sm transition-colors hover:bg-[#1554D0] disabled:opacity-50"
        >
          <span className="text-sm font-medium">{isLoading ? 'Connecting...' : 'Connect Wallet'}</span>
        </Button>
      )}
    </div>
  );
}

// Server component wrapper
export function ConnectWallet() {
  return <ConnectWalletClient />;
}
