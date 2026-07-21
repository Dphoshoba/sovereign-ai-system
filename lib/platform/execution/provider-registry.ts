export type ProviderLifecycleStatus =
  | 'REGISTERED'
  | 'CERTIFIED'
  | 'PRODUCTION'
  | 'DEPRECATED'
  | 'RETIRED';

export type ProviderCertificationLevel =
  | 'STAGE_3A'
  | 'STAGE_3B'
  | 'STAGE_3C'
  | 'PRODUCTION';

export interface ProviderIdentity {
  readonly id: string;
  readonly name: string;
  readonly version: string;
}

export interface ProviderCapability {
  readonly operation: string;
  readonly contractVersion: string;
}

export interface ProviderCertification {
  readonly governanceDecision: string;
  readonly level: ProviderCertificationLevel;
  readonly eosVersion: string;
  readonly certifiedAt: string;
}

export interface ProviderHealth {
  readonly available: boolean;
  readonly ready: boolean;
}

export interface ProviderPolicy {
  readonly sandboxSupported: boolean;
  readonly writeOperations: boolean;
  readonly featureFlags: readonly string[];
}

export interface ProviderMetadata {
  readonly description: string;
  readonly owner: string;
  readonly documentationRef: string;
}

export interface ProviderRegistration {
  readonly identity: ProviderIdentity;
  readonly lifecycle: ProviderLifecycleStatus;
  readonly capabilities: readonly ProviderCapability[];
  readonly certification: ProviderCertification;
  readonly health: ProviderHealth;
  readonly policy: ProviderPolicy;
  readonly metadata: ProviderMetadata;
}

export interface ProviderRegistry {
  register(registration: ProviderRegistration): void;
  unregister(providerId: string): void;
  get(providerId: string): ProviderRegistration | undefined;
  findByOperation(operation: string): readonly ProviderRegistration[];
  findByLifecycle(status: ProviderLifecycleStatus): readonly ProviderRegistration[];
  findByCapability(contractVersion: string): readonly ProviderRegistration[];
  list(): readonly ProviderRegistration[];
  isRegistered(providerId: string): boolean;
}
