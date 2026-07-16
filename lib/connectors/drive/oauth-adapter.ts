import type {
  OAuthAdapter,
  TokenSet,
  TokenValidationResult,
} from "../../platform/connector-platform-sdk";

function maskToken(token: string): string {
  if (!token || token.length < 4) return "oauth2_****";
  return `oauth2_****${token.slice(-4)}`;
}

export const DriveOAuth: OAuthAdapter = {
  authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenUrl: "https://oauth2.googleapis.com/token",
  requiredScopes: ["https://www.googleapis.com/auth/drive.metadata.readonly"],
  highRiskScopes: [
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive",
  ],
  async exchangeCode(code: string): Promise<TokenSet> {
    return {
      accessToken: `access_token_${code.slice(0, 4)}`,
      refreshToken: `refresh_token_${code.slice(0, 4)}`,
      expiresAt: new Date(Date.now() + 3600 * 1000),
      scopes: this.requiredScopes,
    };
  },
  async refreshToken(refreshToken: string): Promise<TokenSet> {
    return {
      accessToken: `refreshed_token_${refreshToken.slice(0, 4)}`,
      refreshToken: refreshToken,
      expiresAt: new Date(Date.now() + 3600 * 1000),
      scopes: this.requiredScopes,
    };
  },
  validateToken(token: TokenSet): TokenValidationResult {
    const now = new Date();
    const minutesUntilExpiry = Math.floor(
      (new Date(token.expiresAt).getTime() - now.getTime()) / 60000
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
