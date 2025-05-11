type TokenPolicyIds = {
  [ticker: string]: string
}

export const TOKEN_POLICY_ID: TokenPolicyIds = {
  ada: "lovelace",
  usdc: "25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff93555534443",
  min: "29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c64d494e",
  eth: "25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff935455448",
  sundae: "9a9693a9a37912a5097918f97918d15240c92ab729a0b7c4aa144d7753554e444145",
  wrt: "c0ee29a85b13209423b10447d3c2e6a50641a15c57770e27cb9d507357696e67526964657273",
  near: "f51057ac9d6fa7e06719f7c984c1bc2839d0f280ae757557091141704e454152",
}

export function getTokenPolicyId(ticker: string) {
  const tokenPolicyId = TOKEN_POLICY_ID[ticker.toLowerCase()];
  return tokenPolicyId || null;
}