import { ProviderAdapter, AdapterConfig } from "./provider-adapter";
import { AdapterRegistry } from "./adapter-registry";
import { AdapterLifecycle } from "./adapter-lifecycle";
import { AdapterValidator } from "./adapter-validator";

export type AdapterFactoryFn = (config: AdapterConfig) => ProviderAdapter;

export interface FactoryRegistration {
  providerType: string;
  factory: AdapterFactoryFn;
  version: string;
}

export class AdapterFactory {
  private factories = new Map<string, FactoryRegistration>();

  constructor(
    private registry: AdapterRegistry,
    private lifecycle: AdapterLifecycle,
    private validator: AdapterValidator,
  ) {}

  registerProviderType(
    providerType: string,
    factory: AdapterFactoryFn,
    version: string = '1.0.0',
  ): void {
    if (this.factories.has(providerType)) {
      throw new Error(
        `FACTORY_ALREADY_REGISTERED: Provider type '${providerType}' already has a factory`,
      );
    }
    this.factories.set(providerType, { providerType, factory, version });
  }

  create(providerType: string, config: AdapterConfig): ProviderAdapter {
    const registration = this.factories.get(providerType);
    if (!registration) {
      throw new Error(
        `FACTORY_NOT_FOUND: No factory registered for provider type '${providerType}'`,
      );
    }

    const adapter = registration.factory(config);

    if (adapter.providerId !== config.providerId) {
      throw new Error(
        `ADAPTER_ID_MISMATCH: Factory created adapter with providerId '${adapter.providerId}' but config specified '${config.providerId}'`,
      );
    }

    return adapter;
  }

  async createAndRegister(
    providerType: string,
    config: AdapterConfig,
  ): Promise<ProviderAdapter> {
    const adapter = this.create(providerType, config);

    const validation = this.validator.validate(adapter);
    if (!validation.valid) {
      throw new Error(
        `ADAPTER_VALIDATION_FAILED: ${validation.errors.join('; ')}`,
      );
    }

    this.registry.register(adapter);

    const transitioned = this.lifecycle.transitionTo(adapter, 'INITIALIZED');
    if (!transitioned) {
      this.registry.unregister(adapter.providerId);
      throw new Error(
        `LIFECYCLE_TRANSITION_FAILED: Could not transition '${adapter.providerId}' to INITIALIZED`,
      );
    }

    return adapter;
  }

  getRegisteredTypes(): FactoryRegistration[] {
    return Array.from(this.factories.values()).sort((a, b) =>
      a.providerType.localeCompare(b.providerType),
    );
  }

  clear(): void {
    this.factories.clear();
  }
}
