import type { CapabilityDescriptor, ServiceDescriptor } from "./contracts";

function compareServiceDescriptor(
  left: ServiceDescriptor,
  right: ServiceDescriptor
): number {
  if (left.serviceName < right.serviceName) return -1;
  if (left.serviceName > right.serviceName) return 1;
  if (left.serviceId < right.serviceId) return -1;
  if (left.serviceId > right.serviceId) return 1;
  return 0;
}

function hasCapability(service: ServiceDescriptor, capabilityId: string): boolean {
  return service.capabilities.includes(capabilityId);
}

export class InMemoryServiceRegistry {
  private readonly services = new Map<string, ServiceDescriptor>();

  register(service: ServiceDescriptor): void {
    this.services.set(service.serviceId, {
      ...service,
      capabilities: [...service.capabilities],
    });
  }

  unregister(serviceId: string): boolean {
    return this.services.delete(serviceId);
  }

  get(serviceId: string): ServiceDescriptor | undefined {
    const service = this.services.get(serviceId);
    if (!service) return undefined;
    return {
      ...service,
      capabilities: [...service.capabilities],
    };
  }

  list(): ServiceDescriptor[] {
    return [...this.services.values()]
      .map((service) => ({
        ...service,
        capabilities: [...service.capabilities],
      }))
      .sort(compareServiceDescriptor);
  }

  listByStatus(status: ServiceDescriptor["status"]): ServiceDescriptor[] {
    return this.list().filter((service) => service.status === status);
  }

  listByCapability(capabilityId: string): ServiceDescriptor[] {
    return this.list().filter((service) => hasCapability(service, capabilityId));
  }

  listByCapabilities(capabilityIds: string[]): ServiceDescriptor[] {
    return this.list().filter((service) =>
      capabilityIds.every((capabilityId) => hasCapability(service, capabilityId))
    );
  }
}

export function extractServiceCapabilities(
  services: ServiceDescriptor[],
  knownCapabilities: CapabilityDescriptor[]
): CapabilityDescriptor[] {
  const serviceCapabilitySet = new Set<string>();
  for (const service of services) {
    for (const capability of service.capabilities) {
      serviceCapabilitySet.add(capability);
    }
  }

  return knownCapabilities
    .filter((capability) => serviceCapabilitySet.has(capability.capabilityId))
    .sort((a, b) => a.name.localeCompare(b.name) || a.capabilityId.localeCompare(b.capabilityId));
}
