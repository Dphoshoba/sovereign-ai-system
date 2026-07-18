import { CredentialProvider, CredentialDescriptor } from '../provider-contracts/credential-provider';

export interface RotationPolicy {
  renewalThresholdMs: number;
  maxRotationAttempts: number;
  requireValidationAfterRotation: boolean;
}

export const DEFAULT_ROTATION_POLICY: RotationPolicy = {
  renewalThresholdMs: 300000,
  maxRotationAttempts: 3,
  requireValidationAfterRotation: true,
};

export interface RotationResult {
  rotated: boolean;
  previousCredentialId: string;
  newCredentialId: string | null;
  rotatedAt: string;
  validationPassed: boolean | null;
  error: string | null;
}

export interface CredentialHealth {
  credentialId: string;
  isValid: boolean;
  expiresAt: string | null;
  needsRotation: boolean;
  reason: string;
}

export class CredentialRotationManager {
  private policy: RotationPolicy;
  private rotationHistory: Map<string, RotationResult[]> = new Map();

  constructor(
    private credentialProvider: CredentialProvider,
    policy: Partial<RotationPolicy> = {},
  ) {
    this.policy = { ...DEFAULT_ROTATION_POLICY, ...policy };
  }

  async checkHealth(executionId: string): Promise<CredentialHealth> {
    const descriptor = await this.credentialProvider.getDescriptor(executionId);
    const isValid = await this.credentialProvider.validate(executionId);
    const expiresAt = descriptor.expiresAt;
    const needsRotation = this.isNearExpiry(descriptor);

    return {
      credentialId: descriptor.credentialId,
      isValid,
      expiresAt,
      needsRotation,
      reason: needsRotation
        ? 'Credential is near expiry and requires rotation'
        : isValid ? 'Credential is valid' : 'Credential validation failed',
    };
  }

  async rotate(executionId: string): Promise<RotationResult> {
    const previousDescriptor = await this.credentialProvider.getDescriptor(executionId);
    const history = this.rotationHistory.get(executionId) ?? [];

    if (history.length >= this.policy.maxRotationAttempts) {
      return {
        rotated: false,
        previousCredentialId: previousDescriptor.credentialId,
        newCredentialId: null,
        rotatedAt: new Date().toISOString(),
        validationPassed: null,
        error: 'MAX_ROTATION_ATTEMPTS_EXCEEDED',
      };
    }

    try {
      await this.credentialProvider.revoke(executionId);
      const newDescriptor = await this.credentialProvider.getDescriptor(executionId);
      let validationPassed: boolean | null = null;

      if (this.policy.requireValidationAfterRotation) {
        validationPassed = await this.credentialProvider.validate(executionId);
      }

      const result: RotationResult = {
        rotated: true,
        previousCredentialId: previousDescriptor.credentialId,
        newCredentialId: newDescriptor.credentialId,
        rotatedAt: new Date().toISOString(),
        validationPassed,
        error: null,
      };

      history.push(result);
      this.rotationHistory.set(executionId, history);
      return result;
    } catch (e) {
      const result: RotationResult = {
        rotated: false,
        previousCredentialId: previousDescriptor.credentialId,
        newCredentialId: null,
        rotatedAt: new Date().toISOString(),
        validationPassed: null,
        error: `ROTATION_FAILED: ${(e as Error).message}`,
      };
      history.push(result);
      this.rotationHistory.set(executionId, history);
      return result;
    }
  }

  getRotationHistory(executionId: string): RotationResult[] {
    return this.rotationHistory.get(executionId) ?? [];
  }

  private isNearExpiry(descriptor: CredentialDescriptor): boolean {
    if (!descriptor.expiresAt) return false;
    const expiryTime = new Date(descriptor.expiresAt).getTime();
    const now = Date.now();
    return expiryTime - now < this.policy.renewalThresholdMs;
  }
}
