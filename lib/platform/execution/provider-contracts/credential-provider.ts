export type CredentialType = 'OAUTH2_CLIENT' | 'API_KEY' | 'SERVICE_ACCOUNT' | 'BASIC_AUTH';

export interface CredentialDescriptor {
  credentialId: string;
  providerId: string;
  type: CredentialType;
  scopes: string[];
  issuedAt: string;
  expiresAt: string | null;
  isRevocable: boolean;
}

export interface CredentialProvider {
  readonly providerId: string;

  getDescriptor(executionId: string): Promise<CredentialDescriptor>;

  validate(executionId: string): Promise<boolean>;

  revoke(executionId: string): Promise<void>;
}
