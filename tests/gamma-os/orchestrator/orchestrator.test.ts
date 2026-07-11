import { describe, expect, it } from "vitest";
import { BindingRegistry, type BindingDescriptor } from "../../../src/lib/gamma-os/bindings/binding-registry";
import { orchestrateWorkflowRequest } from "../../../src/lib/gamma-os/orchestrator/orchestrator";
import { GovernancePolicyEngine } from "../../../src/lib/gamma-os/policies/governance-policy-engine";
import type { WorkflowRequest } from "../../../src/lib/gamma-os/contracts";

function baseWorkflowRequest(overrides: Partial<WorkflowRequest> = {}): WorkflowRequest {
  return {
    requestId: "req-1",
    workflowId: "wf-1",
    workflowVersion: "1.0.0",
    trigger: {
      type: "scheduled",
      source: "scheduler",
    },
    input: {
      digest: true,
      region: "global",
    },
    organization: {
      tenantId: "tenant-1",
      organizationId: "org-1",
      environment: "prod",
    },
    requestedBy: "tester@gamma.local",
    ...overrides,
  };
}

function binding(id: string, capabilities: string[]): BindingDescriptor {
  return {
    id,
    domain: "connector",
    capabilities: [...capabilities],
    health: "healthy",
    source: "test-source",
    version: "1.0.0",
    governance: {
      approvalRequired: true,
      humanReviewRequired: true,
      auditRequired: true,
      previewOnly: true,
    },
  };
}

function registryWithBindings(bindings: BindingDescriptor[]): BindingRegistry {
  const registry = new BindingRegistry();
  for (const item of bindings) registry.register(item);
  return registry;
}

describe("gamma-os stage 4 orchestrator", () => {
  it("produces planned status for governance-approved preview flow", () => {
    const request = baseWorkflowRequest();
    const registry = registryWithBindings([
      binding("b-trigger", ["trigger:scheduled"]),
      binding("b-source", ["source:scheduler"]),
      binding("b-input-digest", ["input:digest"]),
      binding("b-input-region", ["input:region"]),
    ]);

    const plan = orchestrateWorkflowRequest({
      workflowRequest: request,
      bindingRegistry: registry,
    });

    expect(plan.status).toBe("planned");
    expect(plan.previewRoute.status).toBe("ready");
    expect(plan.approvalRoute.status).toBe("ready");
    expect(plan.auditRoute.status).toBe("ready");
  });

  it("blocks when required capabilities are missing", () => {
    const request = baseWorkflowRequest();
    const registry = registryWithBindings([binding("b-only-trigger", ["trigger:scheduled"])]);

    const plan = orchestrateWorkflowRequest({
      workflowRequest: request,
      bindingRegistry: registry,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.blockers.join(" ")).toContain("Missing bindings for capabilities");
  });

  it("deterministic execution order across repeated runs", () => {
    const request = baseWorkflowRequest();
    const registry = registryWithBindings([
      binding("z", ["input:region"]),
      binding("a", ["trigger:scheduled"]),
      binding("c", ["input:digest"]),
      binding("b", ["source:scheduler"]),
    ]);

    const first = orchestrateWorkflowRequest({
      workflowRequest: request,
      bindingRegistry: registry,
    });

    const second = orchestrateWorkflowRequest({
      workflowRequest: request,
      bindingRegistry: registry,
    });

    expect(first.executionOrder).toEqual(second.executionOrder);
    expect(first.dependencyGraph).toEqual(second.dependencyGraph);
  });

  it("does not mutate input workflow object", () => {
    const request = baseWorkflowRequest();
    const original = JSON.parse(JSON.stringify(request));
    const registry = registryWithBindings([
      binding("b-trigger", ["trigger:scheduled"]),
      binding("b-source", ["source:scheduler"]),
      binding("b-input-digest", ["input:digest"]),
      binding("b-input-region", ["input:region"]),
    ]);

    orchestrateWorkflowRequest({
      workflowRequest: request,
      bindingRegistry: registry,
    });

    expect(request).toEqual(original);
  });

  it("governance denial yields blocked plan", () => {
    const request = baseWorkflowRequest({
      organization: {
        tenantId: "",
        organizationId: "org-1",
        environment: "prod",
      },
    });

    const registry = registryWithBindings([
      binding("b-trigger", ["trigger:scheduled"]),
      binding("b-source", ["source:scheduler"]),
      binding("b-input-digest", ["input:digest"]),
      binding("b-input-region", ["input:region"]),
    ]);

    const plan = orchestrateWorkflowRequest({
      workflowRequest: request,
      bindingRegistry: registry,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.governanceDecision.blocked).toBe(true);
  });

  it("requires preview mode and denies live execution paths", () => {
    const request = baseWorkflowRequest();
    const registry = registryWithBindings([
      binding("b-trigger", ["trigger:scheduled"]),
      binding("b-source", ["source:scheduler"]),
      binding("b-input-digest", ["input:digest"]),
      binding("b-input-region", ["input:region"]),
    ]);

    const plan = orchestrateWorkflowRequest({
      workflowRequest: request,
      bindingRegistry: registry,
      policyEngine: GovernancePolicyEngine.createDefault(),
    });

    expect(plan.governanceDecision.previewOnly).toBe(true);
    expect(plan.governanceDecision.violations.join(" ")).not.toContain("live execution enabled");
  });

  it("approval route contains sorted checkpoints", () => {
    const request = baseWorkflowRequest();
    const registry = registryWithBindings([
      binding("b-trigger", ["trigger:scheduled"]),
      binding("b-source", ["source:scheduler"]),
      binding("b-input-digest", ["input:digest"]),
      binding("b-input-region", ["input:region"]),
    ]);

    const plan = orchestrateWorkflowRequest({
      workflowRequest: request,
      bindingRegistry: registry,
    });

    const sorted = [...plan.approvalRoute.checkpoints].sort((a, b) => a.localeCompare(b));
    expect(plan.approvalRoute.checkpoints).toEqual(sorted);
  });

  it("audit route contains immutable projection marker", () => {
    const request = baseWorkflowRequest();
    const registry = registryWithBindings([
      binding("b-trigger", ["trigger:scheduled"]),
      binding("b-source", ["source:scheduler"]),
      binding("b-input-digest", ["input:digest"]),
      binding("b-input-region", ["input:region"]),
    ]);

    const plan = orchestrateWorkflowRequest({
      workflowRequest: request,
      bindingRegistry: registry,
    });

    expect(plan.auditRoute.immutableProjection).toBe(true);
  });

  it("duplicate capability providers are retained in capability map", () => {
    const request = baseWorkflowRequest();
    const registry = registryWithBindings([
      binding("b1", ["trigger:scheduled"]),
      binding("b2", ["trigger:scheduled"]),
      binding("b3", ["source:scheduler"]),
      binding("b4", ["input:digest"]),
      binding("b5", ["input:region"]),
    ]);

    const plan = orchestrateWorkflowRequest({
      workflowRequest: request,
      bindingRegistry: registry,
    });

    expect(plan.capabilityMap["trigger:scheduled"]).toEqual(["b1", "b2"]);
  });

  it("empty input still plans trigger/source capabilities", () => {
    const request = baseWorkflowRequest({ input: {} });
    const registry = registryWithBindings([
      binding("b1", ["trigger:scheduled"]),
      binding("b2", ["source:scheduler"]),
    ]);

    const plan = orchestrateWorkflowRequest({
      workflowRequest: request,
      bindingRegistry: registry,
    });

    expect(plan.requiredCapabilities).toEqual(["source:scheduler", "trigger:scheduled"]);
  });

  it("unknown workflow id still deterministic and bounded", () => {
    const request = baseWorkflowRequest({ workflowId: "wf-unknown" });
    const registry = registryWithBindings([
      binding("b1", ["trigger:scheduled"]),
      binding("b2", ["source:scheduler"]),
      binding("b3", ["input:digest"]),
      binding("b4", ["input:region"]),
    ]);

    const plan = orchestrateWorkflowRequest({
      workflowRequest: request,
      bindingRegistry: registry,
    });

    expect(plan.workflowId).toBe("wf-unknown");
    expect(plan.status).toBe("planned");
  });

  it("missing organization context gets blocked by governance", () => {
    const request = baseWorkflowRequest({
      organization: {
        tenantId: "",
        organizationId: "",
        environment: "prod",
      },
    });
    const registry = registryWithBindings([
      binding("b1", ["trigger:scheduled"]),
      binding("b2", ["source:scheduler"]),
      binding("b3", ["input:digest"]),
      binding("b4", ["input:region"]),
    ]);

    const plan = orchestrateWorkflowRequest({
      workflowRequest: request,
      bindingRegistry: registry,
    });

    expect(plan.governanceDecision.blocked).toBe(true);
    expect(plan.status).toBe("blocked");
  });

  it("no direct execution permission is ever granted", () => {
    const request = baseWorkflowRequest();
    const registry = registryWithBindings([
      binding("b1", ["trigger:scheduled"]),
      binding("b2", ["source:scheduler"]),
      binding("b3", ["input:digest"]),
      binding("b4", ["input:region"]),
    ]);

    const plan = orchestrateWorkflowRequest({
      workflowRequest: request,
      bindingRegistry: registry,
    });

    expect(plan.previewRoute.metadata.mode).toBe("preview-only");
  });

  it("autonomous publishing remains prohibited in governance", () => {
    const request = baseWorkflowRequest();
    const registry = registryWithBindings([
      binding("b1", ["trigger:scheduled"]),
      binding("b2", ["source:scheduler"]),
      binding("b3", ["input:digest"]),
      binding("b4", ["input:region"]),
    ]);

    const plan = orchestrateWorkflowRequest({
      workflowRequest: request,
      bindingRegistry: registry,
    });

    expect(
      plan.governanceDecision.violations.some((violation) =>
        violation.toLowerCase().includes("autonomous")
      )
    ).toBe(false);
  });

  it("resolved bindings are deterministic and sorted", () => {
    const request = baseWorkflowRequest();
    const registry = registryWithBindings([
      binding("z", ["trigger:scheduled"]),
      binding("a", ["source:scheduler"]),
      binding("m", ["input:digest"]),
      binding("n", ["input:region"]),
    ]);

    const plan = orchestrateWorkflowRequest({
      workflowRequest: request,
      bindingRegistry: registry,
    });

    const sorted = [...plan.resolvedBindings].sort((a, b) => a.localeCompare(b));
    expect(plan.resolvedBindings).toEqual(sorted);
  });

  it("preview route is blocked when governance blocks", () => {
    const request = baseWorkflowRequest({
      organization: {
        tenantId: "",
        organizationId: "org-1",
        environment: "prod",
      },
    });
    const registry = registryWithBindings([
      binding("b1", ["trigger:scheduled"]),
      binding("b2", ["source:scheduler"]),
      binding("b3", ["input:digest"]),
      binding("b4", ["input:region"]),
    ]);

    const plan = orchestrateWorkflowRequest({
      workflowRequest: request,
      bindingRegistry: registry,
    });

    expect(plan.previewRoute.status).toBe("blocked");
  });

  it("approval route blocked if governance denied", () => {
    const request = baseWorkflowRequest({
      organization: {
        tenantId: "",
        organizationId: "org-1",
        environment: "prod",
      },
    });
    const registry = registryWithBindings([
      binding("b1", ["trigger:scheduled"]),
      binding("b2", ["source:scheduler"]),
      binding("b3", ["input:digest"]),
      binding("b4", ["input:region"]),
    ]);
    const plan = orchestrateWorkflowRequest({
      workflowRequest: request,
      bindingRegistry: registry,
    });
    expect(plan.approvalRoute.status).toBe("blocked");
  });

  it("audit route blocked if governance denied", () => {
    const request = baseWorkflowRequest({
      organization: {
        tenantId: "",
        organizationId: "org-1",
        environment: "prod",
      },
    });
    const registry = registryWithBindings([
      binding("b1", ["trigger:scheduled"]),
      binding("b2", ["source:scheduler"]),
      binding("b3", ["input:digest"]),
      binding("b4", ["input:region"]),
    ]);
    const plan = orchestrateWorkflowRequest({
      workflowRequest: request,
      bindingRegistry: registry,
    });
    expect(plan.auditRoute.status).toBe("blocked");
  });

  it("dependency graph contains every required capability key", () => {
    const request = baseWorkflowRequest();
    const registry = registryWithBindings([
      binding("b1", ["trigger:scheduled"]),
      binding("b2", ["source:scheduler"]),
      binding("b3", ["input:digest"]),
      binding("b4", ["input:region"]),
    ]);
    const plan = orchestrateWorkflowRequest({
      workflowRequest: request,
      bindingRegistry: registry,
    });

    for (const capability of plan.requiredCapabilities) {
      expect(Object.keys(plan.dependencyGraph)).toContain(capability);
    }
  });

  it("warnings and blockers arrays are always present", () => {
    const request = baseWorkflowRequest();
    const registry = registryWithBindings([
      binding("b1", ["trigger:scheduled"]),
      binding("b2", ["source:scheduler"]),
      binding("b3", ["input:digest"]),
      binding("b4", ["input:region"]),
    ]);
    const plan = orchestrateWorkflowRequest({
      workflowRequest: request,
      bindingRegistry: registry,
    });

    expect(Array.isArray(plan.warnings)).toBe(true);
    expect(Array.isArray(plan.blockers)).toBe(true);
  });

  it("no persistence ownership introduced in plan output", () => {
    const request = baseWorkflowRequest();
    const registry = registryWithBindings([
      binding("b1", ["trigger:scheduled"]),
      binding("b2", ["source:scheduler"]),
      binding("b3", ["input:digest"]),
      binding("b4", ["input:region"]),
    ]);
    const plan = orchestrateWorkflowRequest({
      workflowRequest: request,
      bindingRegistry: registry,
    });

    expect(JSON.stringify(plan).toLowerCase()).not.toContain("writefile");
    expect(JSON.stringify(plan).toLowerCase()).not.toContain("prisma");
  });
});
