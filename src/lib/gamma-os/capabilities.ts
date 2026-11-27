import type { CapabilityDescriptor } from "./contracts";

function compareCapability(
  left: CapabilityDescriptor,
  right: CapabilityDescriptor
): number {
  if (left.name < right.name) return -1;
  if (left.name > right.name) return 1;
  if (left.capabilityId < right.capabilityId) return -1;
  if (left.capabilityId > right.capabilityId) return 1;
  return 0;
}

export class CapabilityRegistry {
  private readonly capabilities = new Map<string, CapabilityDescriptor>();

  register(capability: CapabilityDescriptor): void {
    this.capabilities.set(capability.capabilityId, {
      ...capability,
      requiredConnectorKinds: capability.requiredConnectorKinds
        ? [...capability.requiredConnectorKinds]
        : undefined,
      tags: capability.tags ? [...capability.tags] : undefined,
    });
  }

  registerMany(capabilities: CapabilityDescriptor[]): void {
    for (const capability of capabilities) {
      this.register(capability);
    }
  }

  get(capabilityId: string): CapabilityDescriptor | undefined {
    const capability = this.capabilities.get(capabilityId);
    if (!capability) return undefined;
    return {
      ...capability,
      requiredConnectorKinds: capability.requiredConnectorKinds
        ? [...capability.requiredConnectorKinds]
        : undefined,
      tags: capability.tags ? [...capability.tags] : undefined,
    };
  }

  list(): CapabilityDescriptor[] {
    return [...this.capabilities.values()]
      .map((capability) => ({
        ...capability,
        requiredConnectorKinds: capability.requiredConnectorKinds
          ? [...capability.requiredConnectorKinds]
          : undefined,
        tags: capability.tags ? [...capability.tags] : undefined,
      }))
      .sort(compareCapability);
  }

  filterByStatus(status: CapabilityDescriptor["status"]): CapabilityDescriptor[] {
    return this.list().filter((capability) => capability.status === status);
  }

  filterDeterministicOnly(): CapabilityDescriptor[] {
    return this.list().filter((capability) => capability.deterministic);
  }

  filterByTag(tag: string): CapabilityDescriptor[] {
    return this.list().filter((capability) => capability.tags?.includes(tag));
  }

  isCompatible(
    sourceCapabilityId: string,
    targetCapabilityId: string
  ): boolean {
    if (sourceCapabilityId === targetCapabilityId) return true;

    const source = this.capabilities.get(sourceCapabilityId);
    const target = this.capabilities.get(targetCapabilityId);

    if (!source || !target) return false;
    if (source.status !== "active" || target.status !== "active") return false;

    const sourceConnectors = new Set(source.requiredConnectorKinds ?? []);
    const targetConnectors = target.requiredConnectorKinds ?? [];

    if (sourceConnectors.size === 0 || targetConnectors.length === 0) {
      return true;
    }

    return targetConnectors.some((connector) => sourceConnectors.has(connector));
  }

  findCompatibleTargets(sourceCapabilityId: string): CapabilityDescriptor[] {
    return this.list().filter((target) =>
      this.isCompatible(sourceCapabilityId, target.capabilityId)
    );
  }
}
