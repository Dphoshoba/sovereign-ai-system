import {
  ProviderLifecycleStatus,
  ProviderRegistration,
  ProviderRegistry,
} from "./provider-registry";

function compareById(a: ProviderRegistration, b: ProviderRegistration): number {
  return a.identity.id.localeCompare(b.identity.id);
}

export class ProviderRegistryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderRegistryError';
  }
}

export class ProviderRegistryImpl implements ProviderRegistry {
  private readonly providers = new Map<string, ProviderRegistration>();

  static createWithDefaultProviders(): ProviderRegistryImpl {
    const registry = new ProviderRegistryImpl();
    registry.register({
      identity: { id: 'google-calendar', name: 'Google Calendar', version: '1.0.0' },
      lifecycle: 'CERTIFIED',
      capabilities: [
        { operation: 'events.list', contractVersion: 'v3' },
        { operation: 'events.get', contractVersion: 'v3' },
        { operation: 'events.insert', contractVersion: 'v3' },
        { operation: 'events.update', contractVersion: 'v3' },
        { operation: 'events.delete', contractVersion: 'v3' },
      ],
      certification: {
        governanceDecision: 'GOV-2026-PhaseIII-001',
        level: 'STAGE_3C',
        eosVersion: '1.0.0',
        certifiedAt: '2026-07-19T00:00:00.000Z',
      },
      health: { available: true, ready: true },
      policy: {
        sandboxSupported: true,
        writeOperations: true,
        featureFlags: [],
      },
      metadata: {
        description: 'Google Calendar API v3 provider — certified through Phase III',
        owner: 'Gamma OS Team',
        documentationRef: 'governance/certification/PHASE_III_CLOSURE.md',
      },
    });
    return registry;
  }

  register(registration: ProviderRegistration): void {
    if (this.providers.has(registration.identity.id)) {
      throw new ProviderRegistryError(
        `Provider '${registration.identity.id}' is already registered`,
      );
    }
    this.providers.set(registration.identity.id, { ...registration });
  }

  unregister(providerId: string): void {
    if (!this.providers.has(providerId)) {
      throw new ProviderRegistryError(
        `Provider '${providerId}' is not registered`,
      );
    }
    this.providers.delete(providerId);
  }

  get(providerId: string): ProviderRegistration | undefined {
    return this.providers.get(providerId);
  }

  findByOperation(operation: string): readonly ProviderRegistration[] {
    return this.filterSorted((p) =>
      p.capabilities.some((c) => c.operation === operation),
    );
  }

  findByLifecycle(status: ProviderLifecycleStatus): readonly ProviderRegistration[] {
    return this.filterSorted((p) => p.lifecycle === status);
  }

  findByCapability(contractVersion: string): readonly ProviderRegistration[] {
    return this.filterSorted((p) =>
      p.capabilities.some((c) => c.contractVersion === contractVersion),
    );
  }

  list(): readonly ProviderRegistration[] {
    return this.filterSorted(() => true);
  }

  isRegistered(providerId: string): boolean {
    return this.providers.has(providerId);
  }

  private filterSorted(
    predicate: (p: ProviderRegistration) => boolean,
  ): ProviderRegistration[] {
    return Array.from(this.providers.values())
      .filter(predicate)
      .sort(compareById);
  }
}
