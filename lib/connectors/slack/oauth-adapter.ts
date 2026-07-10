/**
 * Slack OAuth Adapter
 */
import type { OAuthAdapter, TokenSet, TokenValidationResult } from '../../platform/connector-platform-sdk';

export const SlackOAuth: OAuthAdapter = {
  authorizationUrl: 'https://accounts.slack.com/oauth2/authorize',
  tokenUrl: 'https://accounts.slack.com/oauth2/token',
  requiredScopes: ['slack.readonly'],
  highRiskScopes: [],
  async exchangeCode(code: string): Promise<TokenSet> {
    throw new Error('Not implemented');
  },
  async refreshToken(refreshToken: string): Promise<TokenSet> {
    throw new Error('Not implemented');
  },
  validateToken(token: TokenSet): TokenValidationResult {
    const now = new Date();
    const expiresAt = new Date(token.expiresAt);
    const minutesUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / 60000);
    if (minutesUntilExpiry <= 0) {
      return { valid: false, issue: 'expired', maskedToken: 'oauth2_****' + token.accessToken.slice(-4) };
    }
    if (minutesUntilExpiry < 10) {
      return { valid: true, issue: 'expiring_soon', minutesUntilExpiry, maskedToken: 'oauth2_****' + token.accessToken.slice(-4) };
    }
    return { valid: true, minutesUntilExpiry, maskedToken: 'oauth2_****' + token.accessToken.slice(-4) };
  },
};
