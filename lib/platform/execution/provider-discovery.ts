import {
  ProviderCertificationLevel,
  ProviderLifecycleStatus,
  ProviderRegistration,
  ProviderRegistry,
} from "./provider-registry";

export interface DiscoveryOptions {
  readonly minLifecycle?: ProviderLifecycleStatus;
  readonly minCertification?: ProviderCertificationLevel;
  readonly contractVersion?: string;
  readonly requireAvailable?: boolean;
  readonly requireReady?: boolean;
}

export interface ProviderDiscoveryResult {
  readonly provider: ProviderRegistration;
  readonly matchScore: number;
}

export interface ProviderDiscovery {
  findByOperation(
    operation: string,
    options?: DiscoveryOptions,
  ): readonly ProviderDiscoveryResult[];
  findEligible(options?: DiscoveryOptions): readonly ProviderDiscoveryResult[];
  findCertified(minLevel?: ProviderCertificationLevel): readonly ProviderDiscoveryResult[];
  supportsOperation(providerId: string, operation: string): boolean;
  resolve(operation: string, options?: DiscoveryOptions): ProviderDiscoveryResult | undefined;
}
