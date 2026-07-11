export type BindingDomain =
  | "memory"
  | "organization"
  | "security"
  | "plugin"
  | "agent-runtime"
  | "connector";

export interface BindingGovernanceMetadata {
  approvalRequired: boolean;
  humanReviewRequired: boolean;
  auditRequired: boolean;
  previewOnly: boolean;
}

export interface BindingDescriptor {
  id: string;
  domain: BindingDomain;
  capabilities: string[];
  health: "healthy" | "degraded" | "unknown";
  source: string;
  version: string;
  governance: BindingGovernanceMetadata;
}

function compareBindings(a: BindingDescriptor, b: BindingDescriptor): number {
  if (a.domain < b.domain) return -1;
  if (a.domain > b.domain) return 1;
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
}

export class BindingRegistry {
  private readonly bindings = new Map<string, BindingDescriptor>();

  register(binding: BindingDescriptor): void {
    if (this.bindings.has(binding.id)) {
      throw new Error(`Duplicate binding ID: ${binding.id}`);
    }
    this.bindings.set(binding.id, {
      ...binding,
      capabilities: [...binding.capabilities],
      governance: { ...binding.governance },
    });
  }

  unregister(id: string): boolean {
    return this.bindings.delete(id);
  }

  get(id: string): BindingDescriptor | undefined {
    const binding = this.bindings.get(id);
    if (!binding) return undefined;
    return {
      ...binding,
      capabilities: [...binding.capabilities],
      governance: { ...binding.governance },
    };
  }

  list(): BindingDescriptor[] {
    return [...this.bindings.values()]
      .sort(compareBindings)
      .map((binding) => ({
        ...binding,
        capabilities: [...binding.capabilities],
        governance: { ...binding.governance },
      }));
  }

  filterByDomain(domain: BindingDomain): BindingDescriptor[] {
    return this.list().filter((binding) => binding.domain === domain);
  }

  filterByCapability(capability: string): BindingDescriptor[] {
    return this.list().filter((binding) =>
      binding.capabilities.includes(capability)
    );
  }
}
