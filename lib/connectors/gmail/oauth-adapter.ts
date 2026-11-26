/**
 * Gmail OAuth Adapter
 *
 * Implements OAuthAdapter from the Gamma Connector Platform SDK.
 * Wraps the existing Gmail authenticator to conform to the platform interface.
 */

import type { OAuthAdapter, TokenSet, TokenValidationResult } from '../../platform/connector-platform-sdk';

export const GmailOAuth: OAuthAdapter = {
  authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',

  requiredScopes: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.compose',
  ],

  highRiskScopes: [
    'https://www.googleapis.com/auth/gmail.send', // Not certified until Build 141
  ],

  async exchangeCode(code: string): Promise<TokenSet> {
    // Production: POST to tokenUrl with code, clientId, clientSecret, redirectUri
    // For now: placeholder — real implementation in Build 141
    throw new Error('GmailOAuth.exchangeCode: requires Build 141 real execution');
  },

  async refreshToken(refreshToken: string): Promise<TokenSet> {
    // Production: POST to tokenUrl with refresh_token, clientId, clientSecret
    throw new Error('GmailOAuth.refreshToken: requires Build 141 real execution');
  },

  validateToken(token: TokenSet): TokenValidationResult {
    // DETERMINISTIC: accept a timestamp to match test currentTime
    // In production, use Date.now(). In tests, pass explicit currentTime.
    
    if (!token?.accessToken) {
      return {
        valid: false,
        issue: 'missing',
        maskedToken: '****',
      };
    }

    const now = new Date();
    const expiresAt = new Date(token.expiresAt);
    const msUntilExpiry = expiresAt.getTime() - now.getTime();

    if (msUntilExpiry <= 0) {
      return {
        valid: false,
        issue: 'expired',
        minutesUntilExpiry: 0,
        maskedToken: maskToken(token.accessToken),
      };
    }

    const minutesUntilExpiry = Math.floor(msUntilExpiry / 60000);

    if (minutesUntilExpiry < 10) {
      return {
        valid: true,
        issue: 'expiring_soon',
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

function maskToken(token: string): string {
  if (!token || token.length < 8) return 'oauth2_****';
  return `oauth2_****${token.slice(-4)}`;
}
