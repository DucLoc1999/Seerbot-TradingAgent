import { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, Bot, Construction, Network, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

interface ComingSoonFeatureProps {
  text: string;
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FFFFFF] px-4 py-16">
      <main className="container flex max-w-5xl flex-col items-center text-center">
        {/* Construction Badge */}
        <div className="relative mb-6">
          <div className="flex items-center gap-1 rounded-full bg-amber-500/90 px-3 py-1 text-xs font-medium text-black backdrop-blur-sm">
            <Construction size={14} />
            <span>Work in Progress</span>
          </div>
        </div>

        {/* Main Heading */}
        <h1 className="mb-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl md:text-6xl">
          Seerbot AI Swap DEX
        </h1>

        {/* Subheading */}
        <p className="mb-8 max-w-2xl text-xl text-muted-foreground">
          <span className="bg-gradient-to-r from-blue-500 via-green-400 to-purple-600 bg-clip-text text-xl font-bold text-transparent">
            Our decentralized exchange is currently being built, but our advanced AI Trading Assistant is fully operational and ready to
            support all your DeFi needs.
          </span>
        </p>

        {/* Feature Highlight */}
        <div className="mb-12 grid gap-8 sm:grid-cols-2 md:grid-cols-3">
          <FeatureCard
            icon={<Bot className="text-white-200 h-10 w-10" />}
            title="AI Trading Assistant"
            description="Swap tokens, bridge assets, and set limit orders with our intelligent assistant"
          />
          <FeatureCardOne
            icon={<Sparkles className="text-white-200 h-10 w-10" />}
            title="Market Analysis"
            description="Get real-time price data and trend analysis for any token on Pocket Network"
          />
          <FeatureCardTwo
            icon={<Network className="text-white-200 h-10 w-10" />}
            title="Pocket Network"
            description="Experience lightning-fast transactions with minimal fees on Pocket Network"
          />
        </div>

        {/* CTA Button */}
        <Link
          href="/assistant"
          className="group"
        >
          <Button
            size="lg"
            className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 text-lg font-medium hover:from-blue-700 hover:to-purple-700"
          >
            Use AI Trading Assistant
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>

        {/* Coming Soon Section */}
        <div className="mt-20 rounded-xl border border-border/40 bg-card/30 bg-gradient-to-r from-blue-600 to-purple-600 p-6 backdrop-blur-sm">
          <h2 className="mb-4 text-2xl font-bold">Coming Soon</h2>
          <p className="mb-6 text-blue-200 text-muted-foreground">
            Our full DEX platform is under active development. Stay tuned for these exciting features:
          </p>
          <div className="grid gap-4 text-left sm:grid-cols-2">
            <ComingSoonFeature text="Advanced trading interface with charts and depth visualization" />
            <ComingSoonFeature text="Liquidity pools with competitive yield farming opportunities" />
            <ComingSoonFeature text="Advanced aggregator for highest return swaps with minimal slippage" />
            <ComingSoonFeature text="Governance token and DAO participation" />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 text-center text-sm text-muted-foreground text-white">
        <p>© {new Date().getFullYear()} Seerbot - All Rights Reserved</p>
      </footer>
    </div>
  );
}

// Helper Components
function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex flex-col items-center rounded-xl border-border/40 bg-card/30 bg-gradient-to-r from-blue-600 to-green-500 p-6 backdrop-blur-sm transition-all hover:border-border/80 hover:bg-card/50">
      <div className="mb-4">{icon}</div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-sm text-blue-100 text-muted-foreground">{description}</p>
    </div>
  );
}
function FeatureCardOne({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex flex-col items-center rounded-xl border-border/40 bg-card/30 bg-gradient-to-r from-green-500 to-yellow-500 p-6 backdrop-blur-sm transition-all hover:border-border/80 hover:bg-card/50">
      <div className="mb-4">{icon}</div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-sm text-blue-100 text-muted-foreground">{description}</p>
    </div>
  );
}
function FeatureCardTwo({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex flex-col items-center rounded-xl border-border/40 bg-card/30 bg-gradient-to-r from-yellow-500 to-purple-600 p-6 backdrop-blur-sm transition-all hover:border-border/80 hover:bg-card/50">
      <div className="mb-4">{icon}</div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-sm text-blue-100 text-muted-foreground">{description}</p>
    </div>
  );
}
function ComingSoonFeature({ text }: ComingSoonFeatureProps) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-1 h-2 w-2 rounded-full bg-blue-100" />
      <p className="text-sm">{text}</p>
    </div>
  );
}
