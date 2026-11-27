/**
 * Calendar Authenticator - OAuth 2.0 Implementation
 */

import { BaseAuthenticator, TokenResponse } from '../sdk';
import { calendarManifest } from './manifest';

export class CalendarAuthenticator extends BaseAuthenticator {
  constructor(redirectUri: string) {
    super(calendarManifest.oauthConfig!, redirectUri);
  }

  getAuthorizationUrl(state?: string): string {
    const { codeChallenge } = this.generatePKCE();

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: this.getScopesAsString(),
      state: state || this.generateRandomString(32),
      access_type: 'offline',
      prompt: 'consent',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      include_granted_scopes: 'true',
    });

    return `${this.config.authUrl}?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: this.redirectUri,
    });

    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OAuth error: ${error.error} - ${error.error_description || 'unknown'}`);
    }

    const data = (await response.json()) as any;

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token refresh error: ${error.error || 'unknown'}`);
    }

    const data = (await response.json()) as any;

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
    };
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ access_token: token }).toString(),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async revokeToken(token: string): Promise<void> {
    if (!this.config.revokeUrl) {
      throw new Error('Revoke URL not configured');
    }

    const response = await fetch(this.config.revokeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token }).toString(),
    });

    if (!response.ok) {
      throw new Error('Failed to revoke token');
    }
  }
}
