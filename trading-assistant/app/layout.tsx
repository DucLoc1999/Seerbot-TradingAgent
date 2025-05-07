import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/Header';
import { Providers } from '@/providers';
import '@rainbow-me/rainbowkit/styles.css';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({
  subsets: ['latin'],
  display: 'block',
  variable: '--font-inter',
  preload: true,
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: 'Seerbot AI Swap DEX | AI Trading Assistant',
  description:
    'Seerbot AI Swap is a decentralized exchange on Pocket Network with an intelligent AI Trading Assistant. Swap tokens, bridge assets, set limit orders, and analyze market trends through natural conversation.',
  keywords: 'Seerbot AI Swap, DEX, Pocket Network, AI Trading Assistant, DeFi, token swap, crypto trading, limit orders',
  openGraph: {
    title: 'Seerbot AI Swap DEX | AI Trading Assistant',
    description:
      'Trade on Pocket Network with our intelligent AI assistant. Swap tokens, analyze markets, and set limit orders through natural conversation.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Seerbot AI Swap',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Seerbot AI Swap DEX | AI Trading Assistant',
    description: 'Trade on Pocket Network with our intelligent AI assistant',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} dark font-sans`}
      suppressHydrationWarning={true}
    >
      <body className={`${inter.className} font-sans`}>
        <Toaster
          position="top-center"
          richColors
        />
        <div className="relative flex min-h-screen flex-col">
          <div className="absolute bottom-0 left-0 right-0 top-0 -z-20" />
          <Providers>
            <Header />
            <main>{children}</main>
          </Providers>
        </div>
      </body>
    </html>
  );
}
