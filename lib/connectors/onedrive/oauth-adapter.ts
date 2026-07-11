import type {
  OAuthAdapter,
  TokenSet,
  TokenValidationResult,
} from "../../platform/connector-platform-sdk";

function maskToken(token: string): string {
  if (!token || token.length < 4) return "oauth2_****";
  return `oauth2_****${token.slice(-4)}`;
}

export const OneDriveOAuth: OAuthAdapter = {
  authorizationUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
  tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
  requiredScopes: ["Files.Read", "Files.Read.All"],
  highRiskScopes: ["Files.ReadWrite", "Files.ReadWrite.All"],
  async exchangeCode(_code: string): Promise<TokenSet> {
    throw new Error("OneDriveOAuth.exchangeCode is not implemented.");
  },
  async refreshToken(_refreshToken: string): Promise<TokenSet> {
    throw new Error("OneDriveOAuth.refreshToken is not implemented.");
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
