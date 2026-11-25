import { ProviderRegistry } from "./provider-registry";
import { ProviderDiscoveryImpl } from "./provider-discovery-impl";
import { DiscoveryOptions, ProviderDiscovery } from "./provider-discovery";
import { CapabilityResolverImpl } from "./capability-resolver-impl";
import { CapabilityResolver } from "./capability-resolver";
import { ExecutionRequest } from "./execution-request";
import { ProviderSelectionContext, ProviderSelector } from "./provider-selector";

export class ProviderSelectionError extends Error {
  constructor(operation: string) {
    super(`No eligible provider found for operation '${operation}'`);
    this.name = 'ProviderSelectionError';
  }
}

export class ProviderSelectorImpl implements ProviderSelector {
  private readonly discovery: ProviderDiscovery;
  private readonly resolver: CapabilityResolver;

  constructor(registry: ProviderRegistry) {
    this.discovery = new ProviderDiscoveryImpl(registry);
    this.resolver = new CapabilityResolverImpl(this.discovery);
  }

  select(
    operation: string,
    options?: DiscoveryOptions,
  ): ProviderSelectionContext {
    const result = this.resolver.resolve({ operation, options });
    if (!result) {
      throw new ProviderSelectionError(operation);
    }
    return {
      provider: result.provider,
      operation: result.operation,
      resolution: result,
    };
  }

  selectForRequest(
    request: ExecutionRequest,
    options?: DiscoveryOptions,
  ): ProviderSelectionContext {
    return this.select(request.operation, options);
  }

  canResolve(operation: string, options?: DiscoveryOptions): boolean {
    const candidates = this.discovery.findByOperation(operation, options);
    return candidates.length > 0;
  }
}
