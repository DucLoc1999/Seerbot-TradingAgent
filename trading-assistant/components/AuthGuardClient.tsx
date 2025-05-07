'use client';

import { ReactNode, useEffect, useState } from 'react';
import { Brain, Shuffle, TrendUp } from '@phosphor-icons/react';
//import { ArrowRight, Bot, Construction, Network, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { AuthPageProps } from '@/types/chat';
import { ConnectWallet } from './ConnectWallet';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}
function SignatureLoadingOverlay() {
  return (
    <div className="bg-blue/20 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <Card className="max-w-md bg-gradient-to-r from-blue-500 to-purple-600 p-6 backdrop-blur">
        <div className="flex flex-col items-center text-center">
          <h3 className="text-xl font-semibold">Waiting for signature</h3>
          <p className="mt-2 text-blue-200 text-muted-foreground">
            Please check your wallet and sign the message to verify your identity. This won&apos;t cost any gas fees or initiate
            transactions.
          </p>
          <div className="mt-6">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function AuthPage({ isConnectStep, error, signIn, setError }: AuthPageProps) {
  return (
    <div className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-col items-center justify-start bg-[#FFFFFF] p-6 pt-12">
      <div className="w-full max-w-6xl">
        {/* Welcome section */}

        <div className="mb-16 text-center">
          <h1 className="mb-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-4xl md:text-4xl">
            Seerbot AI Trading Assistant
          </h1>

          <p className="text-xl text-blue-800/80">
            {isConnectStep ? 'Welcome! Connect your wallet to proceed' : 'One last step - verify your wallet to start trading'}
          </p>
        </div>
        {/* Feature Highlight */}
        <div className="mb-12 grid gap-8 sm:grid-cols-2 md:grid-cols-3">
          <FeatureCard
            icon={<Brain className="h-10 w-10 text-primary" />}
            title="Market Analysis"
            description="Swap tokens, bridge assets, and set limit orders with our intelligent assistant"
          />
          <FeatureCardOne
            icon={<TrendUp className="text-white-200 h-8 w-8" />}
            title="Smart Trading"
            description="Execute trades, set limit orders, and deploy strategies using natural language"
          />
          <FeatureCardTwo
            icon={<Shuffle className="text-white-200 h-8 w-8" />}
            title="Cross-Chain Operations"
            description="Seamlessly bridge assets between Pocket Network and other blockchains"
          />
        </div>

        {/* Action section */}
        <div className="flex flex-col items-center text-xl text-blue-800/80">
          <h2 className="mb-6 text-2xl font-semibold">{isConnectStep ? 'Connect Wallet' : 'Sign in'} to Start Trading</h2>
          {error && <p className="mb-4 text-center text-destructive">{error}</p>}
          {isConnectStep ? (
            <ConnectWallet />
          ) : (
            <Button
              onClick={async () => {
                try {
                  setError(null);
                  await signIn();
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Verification failed');
                }
              }}
              size="lg"
              className="max-w-48"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function AuthGuardClient({ children, initialAuth = false }: { children: React.ReactNode; initialAuth?: boolean }) {
  const { isAuthenticated, signIn, isConnected, isConnecting, isLoading: authLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasCompletedAuth, setHasCompletedAuth] = useState(initialAuth);

  useEffect(() => {
    // Only set initializing to false when we've determined the initial auth state
    if (!isConnecting && !authLoading) {
      // Add a small delay to prevent flashing states
      const timer = setTimeout(() => {
        setIsInitializing(false);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isConnecting, authLoading]);

  // Track when authentication is fully completed
  useEffect(() => {
    if (isAuthenticated && isConnected && !isInitializing) {
      // Add a small delay to ensure stability
      const timer = setTimeout(() => {
        setHasCompletedAuth(true);
      }, 200);

      return () => clearTimeout(timer);
    } else if (!isAuthenticated || !isConnected) {
      setHasCompletedAuth(false);
    }
  }, [isAuthenticated, isConnected, isInitializing]);

  // Modified signIn function that tracks signing state
  const handleSignIn = async () => {
    try {
      setError(null);
      setIsSigning(true);
      await signIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsSigning(false);
    }
  };

  // Show nothing during initial load to prevent flashing
  if (isInitializing) {
    return null;
  }

  // Only show authenticated content when we're sure authentication is complete
  if (!isConnected || !isAuthenticated || !hasCompletedAuth) {
    const isConnectStep = !isConnected;

    return (
      <>
        <AuthPage
          isConnectStep={isConnectStep}
          error={error}
          signIn={handleSignIn}
          setError={setError}
        />
        {isSigning && <SignatureLoadingOverlay />}
      </>
    );
  }

  return <>{children}</>;
}
// Helper Components
function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex flex-col items-center rounded-xl border-border/40 bg-card/30 bg-gradient-to-r from-blue-600 to-green-500 p-6 text-center backdrop-blur-sm transition-all hover:border-border/80 hover:bg-card/50">
      <div className="mb-4">{icon}</div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-sm text-blue-100 text-muted-foreground">{description}</p>
    </div>
  );
}
function FeatureCardOne({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex flex-col items-center rounded-xl border-border/40 bg-card/30 bg-gradient-to-r from-green-500 to-yellow-500 p-6 text-center backdrop-blur-sm transition-all hover:border-border/80 hover:bg-card/50">
      <div className="mb-4">{icon}</div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-sm text-blue-100 text-muted-foreground">{description}</p>
    </div>
  );
}
function FeatureCardTwo({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex flex-col items-center rounded-xl border-border/40 bg-card/30 bg-gradient-to-r from-yellow-500 to-purple-600 p-6 text-center backdrop-blur-sm transition-all hover:border-border/80 hover:bg-card/50">
      <div className="mb-4">{icon}</div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-sm text-blue-100 text-muted-foreground">{description}</p>
    </div>
  );
}
