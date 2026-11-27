export type AuthTokenType = 'BEARER' | 'API_KEY' | 'BASIC' | 'CUSTOM';

export interface AuthToken {
  tokenType: AuthTokenType;
  accessToken: string;
  expiresAt: string | null;
  scopes: string[];
}

export interface AuthenticationProvider {
  readonly providerId: string;

  acquireToken(executionId: string, scopes: string[]): Promise<AuthToken>;

  refreshToken(executionId: string, token: AuthToken): Promise<AuthToken>;

  isExpired(token: AuthToken): boolean;

  revoke(executionId: string): Promise<void>;
}
