import { AuthenticationProvider, AuthToken, AuthTokenType } from '../../provider-contracts/authentication-provider';

const CALENDAR_READ_SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

export class CalendarAuthenticationProvider implements AuthenticationProvider {
  readonly providerId = 'google-calendar-auth';

  private currentToken: AuthToken | null = null;

  constructor(
    private tokenType: AuthTokenType = 'BEARER',
  ) {}

  async acquireToken(_executionId: string, scopes: string[]): Promise<AuthToken> {
    const mergedScopes = [...new Set([...CALENDAR_READ_SCOPES, ...scopes])];
    this.currentToken = {
      tokenType: this.tokenType,
      accessToken: `ya29.calendar-${Date.now()}`,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      scopes: mergedScopes,
    };
    return this.currentToken;
  }

  async refreshToken(_executionId: string, token: AuthToken): Promise<AuthToken> {
    const refreshed: AuthToken = {
      tokenType: token.tokenType,
      accessToken: `ya29.refreshed-${Date.now()}`,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      scopes: token.scopes,
    };
    this.currentToken = refreshed;
    return refreshed;
  }

  isExpired(token: AuthToken): boolean {
    if (!token.expiresAt) return false;
    const expiryTime = new Date(token.expiresAt).getTime();
    const bufferMs = 5 * 60 * 1000;
    return Date.now() + bufferMs >= expiryTime;
  }

  async revoke(_executionId: string): Promise<void> {
    this.currentToken = null;
  }
}
