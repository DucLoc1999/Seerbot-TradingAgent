# Seerbot AI Trading Assistant

## 🚀 Overview

Seerbot is a next-generation decentralized exchange (DEX) built on the Cardano. While the full DEX interface is under development, our AI Trading Assistant is fully operational, allowing users to perform trades, analyze markets, and manage their crypto assets through natural language conversation.

## ✨ Key Features

### AI Trading Assistant

- **Token Swaps**: Easily swap tokens on Cardano with simple commands like "Swap 1 ADA to USDC"
- **Bridge Functionality**: Bridge tokens between Cardano and other chains with commands like "Bridge 10 ADA from Binance Smart Chain to Cardano"
- **Limit Orders**: Set up to 10 limit orders with commands like "Set a limit order to buy ADA at 0.67 USDC"
- **Market Analysis**: Get real-time price data and trend analysis for any token with "Analyze ADA price trends"

### Coming Soon

- Advanced trading interface with charts and depth visualization
- Liquidity pools with competitive yield farming opportunities
- Advanced aggregator for highest return swaps with minimal slippage
- Governance token and DAO participation

## 🛠️ Technology Stack

- **Frontend**: Next.js, React, TypeScript
- **Styling**: Tailwind CSS
- **AI Integration**: ChatGPT-4o
- **Blockchain**: Cardano
- **Authentication**: JWT-based authentication
- **Data Storage**: Supabase
- **APIs**: deBridge, Odos, Coingecko

## 📋 Prerequisites

- Node.js 18.x or higher
- npm, yarn, pnpm, or bun
- A modern web browser
- Lace wallet

## 🚀 Getting Started

1. **Clone the repository**:

   ```bash

   ```

2. **Install dependencies**:

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. **Set up environment variables**:

   - Copy `.env.example` to `.env.local`
   - Fill in the required API keys and configuration values

4. **Run the development server**:

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## 🔧 Configuration

The application requires several environment variables to be set:

- `NEXT_PUBLIC_PROJECT_ID`: WalletConnect project ID
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`: For database access
- `OPENAI_API_KEY`: For AI chat functionality
- `JWT_SECRET_KEY`: For session management
- Various API endpoints for deBridge, CoinGecko, and Odos
- `NEXT_PUBLIC_CONTRACT_ADDRESS`: Contract address for the AI Trading Assistant
- `ASSISTANT_PRIVATE_KEY`: Private key for the assistant wallet
- `MARKET_DATA_API_URL` and `MARKET_DATA_API_KEY`: For market data access

See `.env.example` for a complete list of required variables.

## 📱 Responsive Design

The application is fully responsive and works on devices of all sizes:

- Desktop
- Tablet
- Mobile

## 🔒 Security

- All sensitive operations are performed server-side
- User funds are never directly accessed by the application
- Contract interactions require explicit user approval
- JWT-based authentication with secure session management

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- The Cardano team for creating an amazing platform
- The Cardano Blockchain Hackathon organizers for the opportunity
- All open-source libraries and tools that made this project possible

Built with ❤️ for the Cardano Blockchain Hackathon
