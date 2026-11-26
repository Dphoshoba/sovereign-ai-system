import { AdapterRegistry } from "./adapter-registry";
import { ProviderAdapter, ProviderDescriptor } from "./provider-adapter";

export interface DiscoveryResult {
  discovered: ProviderDescriptor[];
  failed: Array<{ providerId: string; error: string }>;
}

export class ProviderDiscovery {
  constructor(private registry: AdapterRegistry) {}

  discover(): DiscoveryResult {
    const adapters = this.registry.getAll();
    const discovered: ProviderDescriptor[] = [];
    const failed: Array<{ providerId: string; error: string }> = [];

    for (const adapter of adapters) {
      try {
        const descriptor = adapter.getDescriptor();
        discovered.push(descriptor);
      } catch (e: any) {
        failed.push({
          providerId: adapter.providerId,
          error: e.message ?? 'Unknown discovery error',
        });
      }
    }

    return { discovered, failed };
  }

  discoverByRisk(maxRisk: string): ProviderDescriptor[] {
    const result = this.discover();
    const riskLevels: Record<string, number> = {
      READ: 0,
      MODIFY: 1,
      DESTRUCTIVE: 2,
    };
    const max = riskLevels[maxRisk] ?? 0;

    return result.discovered.filter(
      d => (riskLevels[d.riskLevel] ?? 0) <= max,
    );
  }
}
