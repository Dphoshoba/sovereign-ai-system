import type {
  OAuthAdapter,
  TokenSet,
  TokenValidationResult,
} from "../../platform/connector-platform-sdk";

function maskToken(token: string): string {
  if (!token || token.length < 4) return "oauth2_****";
  return `oauth2_****${token.slice(-4)}`;
}

export const SalesforceOAuth: OAuthAdapter = {
  authorizationUrl: "https://login.salesforce.com/services/oauth2/authorize",
  tokenUrl: "https://login.salesforce.com/services/oauth2/token",
  requiredScopes: ["api", "refresh_token"],
  highRiskScopes: ["full", "web"],
  async exchangeCode(_code: string): Promise<TokenSet> {
    throw new Error("SalesforceOAuth.exchangeCode is not implemented.");
  },
  async refreshToken(_refreshToken: string): Promise<TokenSet> {
    throw new Error("SalesforceOAuth.refreshToken is not implemented.");
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
