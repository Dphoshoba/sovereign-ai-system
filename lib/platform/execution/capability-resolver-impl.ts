import { ProviderLifecycleStatus } from "./provider-registry";
import { ProviderDiscovery, DiscoveryOptions } from "./provider-discovery";
import {
  CapabilityResolver,
  ResolutionFilters,
  ResolutionRequest,
  ResolutionResult,
} from "./capability-resolver";

const LIFECYCLE_SCORES: Record<ProviderLifecycleStatus, number> = {
  REGISTERED: 0,
  CERTIFIED: 100,
  DEPRECATED: 0,
  RETIRED: 0,
};

function computeBreakdown(provider: { lifecycle: ProviderLifecycleStatus; health: { available: boolean; ready: boolean } }) {
  return {
    lifecycle: LIFECYCLE_SCORES[provider.lifecycle],
    health: (provider.health.available ? 50 : 0) + (provider.health.ready ? 25 : 0),
  };
}

function filtersFromOptions(options?: DiscoveryOptions): ResolutionFilters {
  return {
    lifecycle: options?.minLifecycle,
    certification: options?.minCertification,
    contractVersion: options?.contractVersion,
    requireAvailable: options?.requireAvailable,
    requireReady: options?.requireReady,
  };
}

export class CapabilityResolverImpl implements CapabilityResolver {
  constructor(private readonly discovery: ProviderDiscovery) {}

  resolve(request: ResolutionRequest): ResolutionResult | undefined {
    const candidates = this.discovery.findByOperation(request.operation, request.options);
    if (candidates.length === 0) return undefined;

    const best = candidates.reduce((a, b) =>
      a.matchScore > b.matchScore ? a : b,
    );

    const breakdown = computeBreakdown(best.provider);

    return {
      provider: best.provider,
      operation: request.operation,
      matchScore: best.matchScore,
      explanation: {
        rule: 'highest_match_score',
        breakdown,
        filters: filtersFromOptions(request.options),
        totalCandidates: candidates.length,
      },
    };
  }
}
