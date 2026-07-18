import { AuthenticationProvider, AuthToken, AuthTokenType } from '../../provider-contracts/authentication-provider';

const CALENDAR_READ_SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
const CALENDAR_WRITE_SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

export class CalendarAuthenticationProvider implements AuthenticationProvider {
  readonly providerId = 'google-calendar-auth';

  private currentToken: AuthToken | null = null;

  constructor(
    private tokenType: AuthTokenType = 'BEARER',
  ) {}

  async acquireToken(_executionId: string, scopes: string[]): Promise<AuthToken> {
    const mergedScopes = [...new Set([...CALENDAR_READ_SCOPES, ...scopes])];
    const hasWriteScopes = scopes.some(s => CALENDAR_WRITE_SCOPES.includes(s));
    const tokenPrefix = hasWriteScopes ? 'sandbox-token-' : 'ya29.calendar-';
    this.currentToken = {
      tokenType: this.tokenType,
      accessToken: `${tokenPrefix}${Date.now()}`,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      scopes: mergedScopes,
    };
    return this.currentToken;
  }

  async refreshToken(_executionId: string, token: AuthToken): Promise<AuthToken> {
    const hasWriteScopes = token.scopes.some(s => CALENDAR_WRITE_SCOPES.includes(s));
    const tokenPrefix = hasWriteScopes ? 'sandbox-token-' : 'ya29.refreshed-';
    const refreshed: AuthToken = {
      tokenType: token.tokenType,
      accessToken: `${tokenPrefix}${Date.now()}`,
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
