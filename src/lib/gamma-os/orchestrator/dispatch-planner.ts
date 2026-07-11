import type { WorkflowRequest } from "../contracts";
import type { BindingRegistry, BindingDescriptor } from "../bindings/binding-registry";
import type { GovernanceEngineResult } from "../policies/policy-types";

export interface DispatchPlanningResult {
  requiredCapabilities: string[];
  capabilityMap: Record<string, string[]>;
  resolvedBindings: BindingDescriptor[];
  dependencyGraph: Record<string, string[]>;
  executionOrder: string[];
  warnings: string[];
  blockers: string[];
}

function deriveCapabilitiesFromWorkflowRequest(
  workflowRequest: WorkflowRequest
): string[] {
  const triggerCapability = `trigger:${workflowRequest.trigger.type}`;
  const sourceCapability = `source:${workflowRequest.trigger.source}`;
  const inputCapabilities = Object.keys(workflowRequest.input)
    .map((key) => `input:${key}`)
    .sort((a, b) => a.localeCompare(b));

  const capabilities = [triggerCapability, sourceCapability, ...inputCapabilities];
  return Array.from(new Set(capabilities)).sort((a, b) => a.localeCompare(b));
}

function buildCapabilityMap(
  requiredCapabilities: string[],
  bindings: BindingDescriptor[]
): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const capability of requiredCapabilities) {
    const matched = bindings
      .filter((binding) => binding.capabilities.includes(capability))
      .map((binding) => binding.id)
      .sort((a, b) => a.localeCompare(b));
    map[capability] = matched;
  }
  return map;
}

function buildDependencyGraph(
  requiredCapabilities: string[],
  capabilityMap: Record<string, string[]>
): Record<string, string[]> {
  const graph: Record<string, string[]> = {};
  for (const capability of requiredCapabilities) {
    graph[capability] = [...(capabilityMap[capability] ?? [])].sort((a, b) =>
      a.localeCompare(b)
    );
  }
  return graph;
}

function buildExecutionOrder(
  requiredCapabilities: string[],
  capabilityMap: Record<string, string[]>
): string[] {
  const capabilityThenBinding = requiredCapabilities.flatMap((capability) => {
    const bindings = capabilityMap[capability] ?? [];
    if (bindings.length === 0) return [capability];
    return bindings.map((bindingId) => `${capability}->${bindingId}`);
  });

  return capabilityThenBinding.sort((a, b) => a.localeCompare(b));
}

export function planDispatch(params: {
  workflowRequest: WorkflowRequest;
  bindingRegistry: BindingRegistry;
  governanceDecision: GovernanceEngineResult["normalized"];
}): DispatchPlanningResult {
  const { workflowRequest, bindingRegistry, governanceDecision } = params;

  const requiredCapabilities = deriveCapabilitiesFromWorkflowRequest(workflowRequest);
  const allBindings = bindingRegistry.list();
  const capabilityMap = buildCapabilityMap(requiredCapabilities, allBindings);
  const dependencyGraph = buildDependencyGraph(requiredCapabilities, capabilityMap);
  const executionOrder = buildExecutionOrder(requiredCapabilities, capabilityMap);

  const warnings: string[] = [];
  const blockers: string[] = [];

  const unresolvedCapabilities = requiredCapabilities.filter(
    (capability) => (capabilityMap[capability] ?? []).length === 0
  );

  if (unresolvedCapabilities.length > 0) {
    blockers.push(
      `Missing bindings for capabilities: ${unresolvedCapabilities
        .sort((a, b) => a.localeCompare(b))
        .join(", ")}`
    );
  }

  if (governanceDecision.blocked) {
    blockers.push(
      `Governance blocked orchestration: ${(governanceDecision.violations ?? []).join(" | ")}`
    );
  }

  if (!governanceDecision.previewOnly) {
    warnings.push("Governance decision is not marked preview-only.");
  }

  const resolvedBindingIds = new Set(
    Object.values(capabilityMap).flatMap((ids) => ids)
  );

  const resolvedBindings = allBindings
    .filter((binding) => resolvedBindingIds.has(binding.id))
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((binding) => ({
      ...binding,
      capabilities: [...binding.capabilities].sort((x, y) => x.localeCompare(y)),
      governance: { ...binding.governance },
    }));

  return {
    requiredCapabilities,
    capabilityMap,
    resolvedBindings,
    dependencyGraph,
    executionOrder,
    warnings,
    blockers,
  };
}
