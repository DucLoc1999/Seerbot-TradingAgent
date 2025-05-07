import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const workInProgresss = () => {
  return (
    <span className="color: red">
      <b>
        <u>{'<Work in progress>'}</u>
      </b>
    </span>
  );
};

export default function WelcomeCard() {
  return (
    <div className="mb-10 ml-0 mr-auto mt-10 max-w-xl">
      <Card className="rounded-bl-none">
        <CardHeader>
          <CardTitle>Welcome to Seerbot Swap AI Trading Assistant 👋</CardTitle>
        </CardHeader>
        <CardContent className="prose text-sm leading-normal text-muted-foreground">
          <p className="mb-3">I&apos;m your DeFi Trading Assistant on Cardano and Binance Smart Chain. Here&apos;s how I can help you:</p>

          <p className="mb-2">
            💰 <strong>Send token from Lace wallet: </strong> &quot;Send 1 USDC to another wallet&quot;
          </p>

          <p className="mb-2">
            💱 <strong>Token Swaps: </strong> &quot;Swap 10 ADA to USDC&quot;
          </p>

          <p className="mb-2">
            🌉 <strong>Bridge Tokens:</strong> {workInProgresss()} &quot;Bridge 1 USDC from Cardano to BSC&quot;
          </p>

          {/* <p className="mb-2">
            💰 <strong>Manage Contract Balance: </strong>
            {workInProgresss()}
          </p>
          <p className="mb-2 ml-5">• Deposit: &quot;Deposit 5 USDT into the contract&quot;</p>
          <p className="mb-2 ml-5">• Withdraw: &quot;Withdraw my USDC from the contract&quot;</p> */}

          <p className="mb-2">
            📈 <strong>Limit Orders: </strong>
            {workInProgresss()} &quot;Set a limit order to buy ADA at 0.6 USDC&quot;
          </p>

          <p className="mb-2">
            🔍 <strong>Market Analysis: </strong>&quot;Analyze ADA price trends&quot;
          </p>

          {/* <p className="mb-2">
            ➕ <strong>Add Custom Tokens: </strong>
            {workInProgresss()} &quot;Add USDC to my wallet&quot;
          </p> */}

          <p className="mt-4">Just type your request naturally, and I&apos;ll guide you through the process!</p>
        </CardContent>
      </Card>
    </div>
  );
}
