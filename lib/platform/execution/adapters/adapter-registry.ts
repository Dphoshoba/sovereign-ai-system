import { ProviderAdapter } from "./provider-adapter";

export class AdapterRegistry {
  private adapters = new Map<string, ProviderAdapter>();

  register(adapter: ProviderAdapter): void {
    if (this.adapters.has(adapter.providerId)) {
      throw new Error(
        `ADAPTER_ALREADY_REGISTERED: Provider '${adapter.providerId}' is already registered`,
      );
    }
    this.adapters.set(adapter.providerId, adapter);
  }

  get(providerId: string): ProviderAdapter | undefined {
    return this.adapters.get(providerId);
  }

  getAll(): ProviderAdapter[] {
    return Array.from(this.adapters.values()).sort((a, b) =>
      a.providerId.localeCompare(b.providerId),
    );
  }

  isRegistered(providerId: string): boolean {
    return this.adapters.has(providerId);
  }

  unregister(providerId: string): boolean {
    return this.adapters.delete(providerId);
  }

  clear(): void {
    this.adapters.clear();
  }

  count(): number {
    return this.adapters.size;
  }
}
