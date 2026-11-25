import { ProviderCertificationLevel, ProviderLifecycleStatus, ProviderRegistration } from "./provider-registry";
import { DiscoveryOptions } from "./provider-discovery";

export interface ResolutionBreakdown {
  readonly lifecycle: number;
  readonly health: number;
}

export interface ResolutionFilters {
  readonly lifecycle?: ProviderLifecycleStatus;
  readonly certification?: ProviderCertificationLevel;
  readonly contractVersion?: string;
  readonly requireAvailable?: boolean;
  readonly requireReady?: boolean;
}

export interface ResolutionExplanation {
  readonly rule: string;
  readonly breakdown: ResolutionBreakdown;
  readonly filters: ResolutionFilters;
  readonly totalCandidates: number;
}

export interface ResolutionResult {
  readonly provider: ProviderRegistration;
  readonly operation: string;
  readonly matchScore: number;
  readonly explanation: ResolutionExplanation;
}

export interface ResolutionRequest {
  readonly operation: string;
  readonly options?: DiscoveryOptions;
}

export interface CapabilityResolver {
  resolve(request: ResolutionRequest): ResolutionResult | undefined;
}
