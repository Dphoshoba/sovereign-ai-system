import type {
  OAuthAdapter,
  TokenSet,
  TokenValidationResult,
} from "../../platform/connector-platform-sdk";

function maskToken(token: string): string {
  if (!token || token.length < 4) return "oauth2_****";
  return `oauth2_****${token.slice(-4)}`;
}

export const GitHubOAuth: OAuthAdapter = {
  authorizationUrl: "https://github.com/login/oauth/authorize",
  tokenUrl: "https://github.com/login/oauth/access_token",
  requiredScopes: ["repo:status", "read:org"],
  highRiskScopes: ["repo", "workflow", "admin:repo_hook"],
  async exchangeCode(_code: string): Promise<TokenSet> {
    throw new Error("GitHubOAuth.exchangeCode is not implemented.");
  },
  async refreshToken(_refreshToken: string): Promise<TokenSet> {
    throw new Error("GitHubOAuth.refreshToken is not implemented.");
  },
  validateToken(token: TokenSet): TokenValidationResult {
    const minutesUntilExpiry = Math.floor(
      (new Date(token.expiresAt).getTime() - new Date().getTime()) / 60000
    );

    if (minutesUntilExpiry <= 0) {
      return {
        valid: false,
        issue: "expired",
        maskedToken: maskToken(token.accessToken),
      };
    }

    if (minutesUntilExpiry < 10) {
      return {
        valid: true,
        issue: "expiring_soon",
        minutesUntilExpiry,
        maskedToken: maskToken(token.accessToken),
      };
    }

    return {
      valid: true,
      minutesUntilExpiry,
      maskedToken: maskToken(token.accessToken),
    };
  },
};
