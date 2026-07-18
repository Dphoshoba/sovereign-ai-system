export type DIProvider<T> = (container: AdapterDIContainer) => T;

export interface DIRegistration<T> {
  token: string;
  provider: DIProvider<T>;
  singleton: boolean;
  instance?: T;
}

export class AdapterDIContainer {
  private registrations = new Map<string, DIRegistration<any>>();
  private resolving = new Set<string>();

  register<T>(token: string, provider: DIProvider<T>, singleton: boolean = true): void {
    if (this.registrations.has(token) && !this.allowOverride) {
      throw new Error(
        `DI_CONTAINER_DUPLICATE: Token '${token}' is already registered`,
      );
    }
    this.registrations.set(token, { token, provider, singleton });
  }

  registerInstance<T>(token: string, instance: T): void {
    this.registrations.set(token, {
      token,
      provider: () => instance,
      singleton: true,
      instance,
    });
  }

  resolve<T>(token: string): T {
    const registration = this.registrations.get(token);
    if (!registration) {
      throw new Error(
        `DI_CONTAINER_RESOLVE_FAILED: No provider registered for token '${token}'`,
      );
    }

    if (registration.singleton && registration.instance !== undefined) {
      return registration.instance as T;
    }

    if (this.resolving.has(token)) {
      throw new Error(
        `DI_CONTAINER_CIRCULAR_DEPENDENCY: Circular dependency detected for token '${token}'`,
      );
    }

    this.resolving.add(token);
    try {
      const instance = registration.provider(this);
      if (registration.singleton) {
        registration.instance = instance;
      }
      return instance;
    } finally {
      this.resolving.delete(token);
    }
  }

  isRegistered(token: string): boolean {
    return this.registrations.has(token);
  }

  clear(): void {
    this.registrations.clear();
    this.resolving.clear();
  }

  private allowOverride = false;

  enableOverride(): void {
    this.allowOverride = true;
  }
}
