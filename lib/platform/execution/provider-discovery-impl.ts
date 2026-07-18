import {
  ProviderCertificationLevel,
  ProviderLifecycleStatus,
  ProviderRegistration,
  ProviderRegistry,
} from "./provider-registry";
import {
  DiscoveryOptions,
  ProviderDiscovery,
  ProviderDiscoveryResult,
} from "./provider-discovery";

const CERTIFICATION_ORDER: Record<ProviderCertificationLevel, number> = {
  STAGE_3A: 0,
  STAGE_3B: 1,
  STAGE_3C: 2,
  PRODUCTION: 3,
};

const LIFECYCLE_ORDER: Record<ProviderLifecycleStatus, number> = {
  REGISTERED: 0,
  CERTIFIED: 1,
  DEPRECATED: 2,
  RETIRED: 3,
};

function meetsMinLifecycle(
  actual: ProviderLifecycleStatus,
  min: ProviderLifecycleStatus | undefined,
): boolean {
  if (!min) return true;
  return LIFECYCLE_ORDER[actual] >= LIFECYCLE_ORDER[min];
}

function meetsMinCertification(
  actual: ProviderCertificationLevel,
  min: ProviderCertificationLevel | undefined,
): boolean {
  if (!min) return true;
  return CERTIFICATION_ORDER[actual] >= CERTIFICATION_ORDER[min];
}

function computeMatchScore(provider: ProviderRegistration): number {
  let score = 0;
  if (provider.lifecycle === 'CERTIFIED') score += 100;
  if (provider.lifecycle === 'PRODUCTION') score += 200;
  if (provider.health.available) score += 50;
  if (provider.health.ready) score += 25;
  return score;
}

export class ProviderDiscoveryImpl implements ProviderDiscovery {
  constructor(private readonly registry: ProviderRegistry) {}

  findByOperation(
    operation: string,
    options?: DiscoveryOptions,
  ): readonly ProviderDiscoveryResult[] {
    return this.matchAndFilter(
      this.registry.findByOperation(operation),
      options,
    );
  }

  findEligible(options?: DiscoveryOptions): readonly ProviderDiscoveryResult[] {
    return this.matchAndFilter(this.registry.list(), {
      ...options,
      requireAvailable: options?.requireAvailable ?? true,
      requireReady: options?.requireReady ?? true,
    });
  }

  findCertified(
    minLevel?: ProviderCertificationLevel,
  ): readonly ProviderDiscoveryResult[] {
    return this.matchAndFilter(this.registry.list(), {
      minLifecycle: 'CERTIFIED',
      minCertification: minLevel,
    });
  }

  supportsOperation(providerId: string, operation: string): boolean {
    const provider = this.registry.get(providerId);
    if (!provider) return false;
    return provider.capabilities.some((c) => c.operation === operation);
  }

  resolve(
    operation: string,
    options?: DiscoveryOptions,
  ): ProviderDiscoveryResult | undefined {
    const results = this.matchAndFilter(
      this.registry.findByOperation(operation),
      options,
    );
    if (results.length === 0) return undefined;
    return results.reduce((best, current) =>
      current.matchScore > best.matchScore ? current : best,
    );
  }

  private matchAndFilter(
    providers: readonly ProviderRegistration[],
    options?: DiscoveryOptions,
  ): ProviderDiscoveryResult[] {
    return providers
      .filter((p) => {
        if (options?.minLifecycle && !meetsMinLifecycle(p.lifecycle, options.minLifecycle)) return false;
        if (options?.minCertification && !meetsMinCertification(p.certification.level, options.minCertification)) return false;
        if (options?.contractVersion && !p.capabilities.some((c) => c.contractVersion === options.contractVersion)) return false;
        if (options?.requireAvailable && !p.health.available) return false;
        if (options?.requireReady && !p.health.ready) return false;
        return true;
      })
      .map((p) => ({ provider: p, matchScore: computeMatchScore(p) }))
      .sort((a, b) => b.matchScore - a.matchScore);
  }
}
