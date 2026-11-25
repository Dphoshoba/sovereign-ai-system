/**
 * Base Authenticator - OAuth 2.0 Implementation
 * Abstract base class for all OAuth-based connectors
 */

import { OAuthConfig, TokenResponse } from './connector-types';

export abstract class BaseAuthenticator {
  protected config: OAuthConfig;
  protected redirectUri: string;

  constructor(config: OAuthConfig, redirectUri: string) {
    this.config = config;
    this.redirectUri = redirectUri;
  }

  /**
   * Get the authorization URL to redirect user to
   */
  abstract getAuthorizationUrl(state?: string): string;

  /**
   * Exchange authorization code for access token
   */
  abstract exchangeCodeForTokens(code: string): Promise<TokenResponse>;

  /**
   * Refresh the access token using refresh token
   */
  abstract refreshAccessToken(refreshToken: string): Promise<TokenResponse>;

  /**
   * Validate that a token is still valid
   */
  abstract validateToken(token: string): Promise<boolean>;

  /**
   * Revoke a token
   */
  abstract revokeToken(token: string): Promise<void>;

  /**
   * Check if token needs refresh (helper)
   */
  isTokenExpired(expiresAt: Date): boolean {
    const now = new Date();
    // Refresh if within 5 minutes of expiry
    const buffer = 5 * 60 * 1000;
    return now.getTime() + buffer >= expiresAt.getTime();
  }

  /**
   * Get scopes as space-separated string (OAuth standard)
   */
  protected getScopesAsString(): string {
    return this.config.scopes.join(' ');
  }

  /**
   * Generate PKCE code challenge and verifier (for security)
   */
  protected generatePKCE(): { codeChallenge: string; codeVerifier: string } {
    const codeVerifier = this.generateRandomString(128);
    const codeChallenge = this.base64UrlEncode(
      require('crypto').createHash('sha256').update(codeVerifier).digest('base64')
    );
    return { codeChallenge, codeVerifier };
  }

  /**
   * Generate random string (for state parameter)
   */
  protected generateRandomString(length: number): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  }

  /**
   * Base64 URL encode (RFC 4648)
   */
  protected base64UrlEncode(str: string): string {
    return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }
}
