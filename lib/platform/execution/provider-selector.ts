import { ProviderRegistration } from "./provider-registry";
import { DiscoveryOptions, ProviderDiscoveryResult } from "./provider-discovery";
import { ResolutionResult } from "./capability-resolver";
import { ExecutionRequest } from "./execution-request";

export interface ProviderSelectionContext {
  readonly provider: ProviderRegistration;
  readonly operation: string;
  readonly resolution: ResolutionResult;
}

export interface ProviderSelector {
  select(
    operation: string,
    options?: DiscoveryOptions,
  ): ProviderSelectionContext;
  selectForRequest(
    request: ExecutionRequest,
    options?: DiscoveryOptions,
  ): ProviderSelectionContext;
  canResolve(
    operation: string,
    options?: DiscoveryOptions,
  ): boolean;
}
