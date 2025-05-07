'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  autoAuthenticateAddress,
  checkAddressHasSession,
  checkAuth,
  signOut as serverSignOut,
  verifySignature,
} from '@/app/actions/auth';

// Helper function to convert string to hex without '0x' prefix
function stringToHex(str: string): string {
  return Buffer.from(str).toString('hex');
}

export function useAuth() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authenticatedAddress, setAuthenticatedAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkWalletConnection = async () => {
      if (typeof window === 'undefined' || !window.cardano?.lace) {
        setIsConnected(false);
        setAddress(null);
        setIsLoading(false);
        return;
      }

      try {
        const lace = await window.cardano.lace.enable();
        const usedAddresses = await lace.getUsedAddresses();
        // console.log({ usedAddresses })
        
        if (usedAddresses.length > 0) {
          setIsConnected(true);
          setAddress(usedAddresses[0]);
        } else {
          setIsConnected(false);
          setAddress(null);
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
        setIsConnected(false);
        setAddress(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkWalletConnection();
  }, []);

  useEffect(() => {
    const verifyAuth = async () => {
      if (!isConnected) {
        setIsAuthenticated(false);
        setAuthenticatedAddress(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const authData = await checkAuth();

        if (authData) {
          setIsAuthenticated(true);
          setAuthenticatedAddress(authData.address);

          if (address && authData.address !== address) {
            const hasSession = await checkAddressHasSession(address);

            if (hasSession) {
              const result = await autoAuthenticateAddress(address);

              if (result.success) {
                setIsAuthenticated(true);
                setAuthenticatedAddress(address);
                toast.success('Automatically signed in with connected wallet');
              } else {
                setIsAuthenticated(false);
                toast.info('Wallet address changed. Please sign in again.');
              }
            } else {
              setIsAuthenticated(false);
              toast.info('Wallet address changed. Please sign in again.');
            }
          }
        } else {
          if (address) {
            const hasSession = await checkAddressHasSession(address);

            if (hasSession) {
              const result = await autoAuthenticateAddress(address);

              if (result.success) {
                setIsAuthenticated(true);
                setAuthenticatedAddress(address);
                toast.success('Automatically signed in with connected wallet');
              } else {
                setIsAuthenticated(false);
                setAuthenticatedAddress(null);
              }
            } else {
              setIsAuthenticated(false);
              setAuthenticatedAddress(null);
            }
          }
        }
      } catch (error) {
        setIsAuthenticated(false);
        setAuthenticatedAddress(null);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, [isConnected, address]);

  const generateNonce = () => {
    const randomBytes = new Uint8Array(16);
    window.crypto.getRandomValues(randomBytes);
    return Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  };

  const signIn = async (toasting: boolean = true) => {
    if (!address || !window.cardano?.lace) {
      return;
    }

    try {
      setIsLoading(true);
      setIsConnecting(true);

      const lace = await window.cardano.lace.enable();
      
      // Create a message for signing
      const nonce = generateNonce();
      const timestamp = Date.now().toString();
      const message = `Sign this message to login to the app.\nNonce: ${nonce}\nTimestamp: ${timestamp}\nAddress: ${address}`;
      console.log({ address })

      try {
        // Convert message to hex string without '0x' prefix
        const hexMessage = stringToHex(message);
        // console.log('Hex message:', hexMessage); // Debug log

        // Sign the message with the Lace wallet
        const signature = await lace.signData(address, hexMessage);
        // console.log('Signature:', signature); // Debug log

        if (!signature) {
          throw new Error('No signature returned from wallet');
        }
        
        // Convert the signature to a format we can send to the server
        const signatureData = {
          signature: signature,
          key: address,
          message: message
        };

        // Send to server for verification
        await verifySignature(message, JSON.stringify(signatureData));

        setIsAuthenticated(true);
        setAuthenticatedAddress(address);
        if (toasting) toast.success('Successfully signed in');
      } catch (signError) {
        console.error('Signature error:', signError);
        if (signError instanceof Error) {
          throw new Error(`Failed to sign message: ${signError.message}`);
        }
        throw new Error('Failed to sign message. Please try again.');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setIsAuthenticated(false);
      setAuthenticatedAddress(null);
      if (toasting) {
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error('Failed to sign in');
        }
      }
    } finally {
      setIsLoading(false);
      setIsConnecting(false);
    }
  };

  const signOut = async (toasting: boolean = true) => {
    try {
      await serverSignOut();
    } catch (error) {
      // Error handling is silent
    }

    setIsAuthenticated(false);
    setAuthenticatedAddress(null);
    if (toasting) toast.success('Signed out successfully');
  };

  return {
    isAuthenticated,
    isLoading,
    authenticatedAddress,
    signIn,
    signOut,
    isConnected,
    isConnecting,
    currentAddress: address,
  };
}
