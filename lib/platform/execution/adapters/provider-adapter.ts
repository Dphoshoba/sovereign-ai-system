import { ConnectorCapabilityProfile, OperationCapability } from "../capability-contract";

export interface AdapterConfig {
  providerId: string;
  providerVersion: string;
  baseUrl?: string;
  apiVersion?: string;
  timeout?: number;
  metadata: Record<string, unknown>;
}

export interface ProviderDescriptor {
  providerId: string;
  providerVersion: string;
  supportedOperations: string[];
  riskLevel: string;
  requiresAuthentication: boolean;
}

export interface AdapterValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export abstract class ProviderAdapter {
  abstract readonly providerId: string;
  abstract readonly providerVersion: string;
  abstract readonly supportedOperations: string[];

  abstract getCapabilityProfile(): ConnectorCapabilityProfile;

  abstract initialize(config: AdapterConfig): Promise<void>;

  abstract validate(): Promise<AdapterValidationResult>;

  abstract dispose(): Promise<void>;

  getDescriptor(): ProviderDescriptor {
    const profile = this.getCapabilityProfile();
    const maxRisk = profile.supportedOperations.reduce(
      (max, op) => {
        const levels = { READ: 0, MODIFY: 1, DESTRUCTIVE: 2 };
        return levels[op.riskLevel] > levels[max as keyof typeof levels]
          ? op.riskLevel
          : max;
      },
      'READ' as string,
    );
    return {
      providerId: this.providerId,
      providerVersion: this.providerVersion,
      supportedOperations: [...this.supportedOperations],
      riskLevel: maxRisk,
      requiresAuthentication: profile.supportedOperations.some(
        op => op.requiredScopes.length > 0,
      ),
    };
  }
}
