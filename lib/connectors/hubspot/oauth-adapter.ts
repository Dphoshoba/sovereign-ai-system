import type {
  OAuthAdapter,
  TokenSet,
  TokenValidationResult,
} from "../../platform/connector-platform-sdk";

function maskToken(token: string): string {
  if (!token || token.length < 4) return "oauth2_****";
  return `oauth2_****${token.slice(-4)}`;
}

export const HubSpotOAuth: OAuthAdapter = {
  authorizationUrl: "https://app.hubspot.com/oauth/authorize",
  tokenUrl: "https://api.hubapi.com/oauth/v1/token",
  requiredScopes: ["crm.objects.contacts.read", "crm.objects.companies.read"],
  highRiskScopes: ["crm.objects.contacts.write", "crm.objects.deals.write"],
  async exchangeCode(_code: string): Promise<TokenSet> {
    throw new Error("HubSpotOAuth.exchangeCode is not implemented.");
  },
  async refreshToken(_refreshToken: string): Promise<TokenSet> {
    throw new Error("HubSpotOAuth.refreshToken is not implemented.");
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
