import { describe, expect, it } from "vitest";
import {
  BindingRegistry,
  type BindingDescriptor,
} from "../../../src/lib/gamma-os/bindings/binding-registry";
import {
  createMemoryBindingDescriptor,
  evaluateMemoryBindingDispatch,
} from "../../../src/lib/gamma-os/bindings/memory-bindings";
import {
  createOrganizationBindingDescriptor,
  normalizeOrganizationContext,
} from "../../../src/lib/gamma-os/bindings/organization-bindings";
import { createSecurityBindingDescriptor } from "../../../src/lib/gamma-os/bindings/security-bindings";
import { createPluginBindingDescriptor } from "../../../src/lib/gamma-os/bindings/plugin-bindings";
import { createAgentRuntimeBindingDescriptor } from "../../../src/lib/gamma-os/bindings/agent-runtime-bindings";
import {
  createConnectorBindingDescriptor,
  evaluateConnectorBindingDispatch,
} from "../../../src/lib/gamma-os/bindings/connector-bindings";
import { GovernancePolicyEngine } from "../../../src/lib/gamma-os/policies/governance-policy-engine";
import type { PolicyEvaluationContext } from "../../../src/lib/gamma-os/policies/policy-types";

const baseContext: PolicyEvaluationContext = {
  requestId: "stage3-req-1",
  workflowId: "stage3-wf-1",
  organization: {
    tenantId: "tenant-1",
    organizationId: "org-1",
    environment: "prod",
  },
  requestedCapabilities: ["safe-op"],
  connectorIds: ["gmail"],
  requiresApproval: true,
  requiresHumanReview: true,
  requiresAudit: true,
  requestedMode: "preview",
  autonomousPublishingRequested: false,
};

function bindingTemplate(overrides: Partial<BindingDescriptor> = {}): BindingDescriptor {
  return {
    id: overrides.id ?? "binding-a",
    domain: overrides.domain ?? "memory",
    capabilities: overrides.capabilities ?? ["cap-a"],
    health: overrides.health ?? "healthy",
    source: overrides.source ?? "source",
    version: overrides.version ?? "1.0.0",
    governance:
      overrides.governance ?? {
        approvalRequired: true,
        humanReviewRequired: true,
        auditRequired: true,
        previewOnly: true,
      },
  };
}

describe("Stage 3 bindings - thorough coverage", () => {
  it("memory binding descriptor includes required capabilities", () => {
    const descriptor = createMemoryBindingDescriptor({
      secondBrainStatus: "healthy",
      searchStatus: "healthy",
      graphStatus: "healthy",
      relationshipsStatus: "healthy",
      sharedKnowledgeStatus: "healthy",
      workflowMemoryStatus: "healthy",
      connectorMemoryStatus: "healthy",
      source: "memory-reader",
      version: "1.0.0",
    });

    expect(descriptor.domain).toBe("memory");
    expect(descriptor.capabilities).toContain("second-brain");
    expect(descriptor.capabilities).toContain("connector-memory");
  });

  it("organization binding normalizes workspace/team/department/role", () => {
    const normalized = normalizeOrganizationContext({
      tenantId: "t-1",
      organizationId: "o-1",
      workspaceId: "w-1",
      teamId: "team-1",
      departmentId: "dep-1",
      roleIds: ["admin", "reviewer"],
    });

    expect(normalized).toEqual({
      tenantId: "t-1",
      organizationId: "o-1",
      workspaceId: "w-1",
      teamId: "team-1",
      departmentId: "dep-1",
      roleIds: ["admin", "reviewer"],
    });
  });

  it("security binding descriptor includes approval workflow and queue capabilities", () => {
    const descriptor = createSecurityBindingDescriptor({
      permissionsStatus: "healthy",
      approvalWorkflowStatus: "healthy",
      approvalQueueStatus: "healthy",
      humanReviewStatus: "healthy",
      source: "security-reader",
      version: "1.0.0",
    });

    expect(descriptor.capabilities).toContain("approval-workflow");
    expect(descriptor.capabilities).toContain("approval-queue");
    expect(descriptor.domain).toBe("security");
  });

  it("plugin binding descriptor contains isolation and certification placeholders", () => {
    const descriptor = createPluginBindingDescriptor({
      pluginRegistryStatus: "healthy",
      moduleMarketplaceStatus: "healthy",
      capabilitiesStatus: "healthy",
      healthMetadataStatus: "healthy",
      source: "plugin-registry",
      version: "1.0.0",
    });

    expect(descriptor.capabilities).toContain("isolation-placeholder");
    expect(descriptor.capabilities).toContain("certification-placeholder");
  });

  it("agent runtime binding descriptor exposes planner/reviewer/runtime metadata", () => {
    const descriptor = createAgentRuntimeBindingDescriptor({
      plannerStatus: "healthy",
      reviewerStatus: "healthy",
      workflowEngineStatus: "healthy",
      runtimeQueueStatus: "healthy",
      executionStatus: "healthy",
      simulatorStatus: "healthy",
      auditStatus: "healthy",
      source: "agent-runtime",
      version: "1.0.0",
    });

    expect(descriptor.capabilities).toContain("planner");
    expect(descriptor.capabilities).toContain("reviewer");
    expect(descriptor.capabilities).toContain("runtime-queue");
  });

  it("connector binding descriptor maps sdk/compliance/hardening/certification", () => {
    const descriptor = createConnectorBindingDescriptor({
      sdkDescriptorStatus: "healthy",
      capabilityNormalizationStatus: "healthy",
      complianceStatus: "healthy",
      hardeningStatus: "healthy",
      certificationStatus: "healthy",
      connectorHealthStatus: "healthy",
      source: "connector-reader",
      version: "1.0.0",
    });

    expect(descriptor.capabilities).toContain("sdk-descriptor-mapping");
    expect(descriptor.capabilities).toContain("compliance");
    expect(descriptor.capabilities).toContain("hardening");
    expect(descriptor.capabilities).toContain("certification");
  });

  it("memory dispatch routes through governance engine and allows preview mode", () => {
    const result = evaluateMemoryBindingDispatch({
      context: baseContext,
    });
    expect(result.allowed).toBe(true);
    expect(result.blocked).toBe(false);
    expect(result.evaluatedPolicyIds.length).toBeGreaterThan(0);
  });

  it("connector dispatch blocked by governance when restricted connector requested", () => {
    const result = evaluateConnectorBindingDispatch({
      ...baseContext,
      connectorIds: ["custom-unsafe"],
    });
    expect(result.normalized.blocked).toBe(true);
    expect(result.normalized.violations.join(" ")).toContain("connector-restrictions");
  });

  it("live execution remains blocked by default via governance", () => {
    const result = evaluateConnectorBindingDispatch({
      ...baseContext,
      requestedMode: "live",
    });
    expect(result.normalized.blocked).toBe(true);
    expect(result.normalized.violations.join(" ")).toContain("live-execution-default-deny");
  });

  it("autonomous publishing remains prohibited via governance", () => {
    const result = evaluateConnectorBindingDispatch({
      ...baseContext,
      autonomousPublishingRequested: true,
    });
    expect(result.normalized.blocked).toBe(true);
    expect(result.normalized.violations.join(" ")).toContain(
      "autonomous-publishing-prohibited"
    );
  });

  it("missing organization context is denied", () => {
    const result = evaluateConnectorBindingDispatch({
      ...baseContext,
      organization: {
        tenantId: "",
        organizationId: "org-1",
        environment: "prod",
      },
    });
    expect(result.normalized.blocked).toBe(true);
    expect(result.normalized.violations.join(" ")).toContain("organization-policy");
  });

  it("missing approval context still reflects required governance metadata", () => {
    const engine = GovernancePolicyEngine.createDefault();
    const result = engine.evaluate({
      ...baseContext,
      requiresApproval: false,
      requiresHumanReview: false,
      requiresAudit: false,
    });

    expect(result.normalized.previewOnly).toBe(true);
    expect(result.normalized.evaluatedPolicyIds.length).toBe(9);
  });

  it("binding registry register/get/list/unregister works", () => {
    const registry = new BindingRegistry();
    const binding = bindingTemplate({ id: "memory-a", domain: "memory" });

    registry.register(binding);
    expect(registry.get("memory-a")?.id).toBe("memory-a");
    expect(registry.list().length).toBe(1);
    expect(registry.unregister("memory-a")).toBe(true);
    expect(registry.list().length).toBe(0);
  });

  it("binding registry rejects duplicate IDs", () => {
    const registry = new BindingRegistry();
    const binding = bindingTemplate({ id: "dup-id" });

    registry.register(binding);
    expect(() => registry.register(binding)).toThrowError("Duplicate binding ID: dup-id");
  });

  it("binding registry deterministic ordering", () => {
    const registry = new BindingRegistry();
    registry.register(bindingTemplate({ id: "z-binding", domain: "memory" }));
    registry.register(bindingTemplate({ id: "a-binding", domain: "memory" }));
    registry.register(bindingTemplate({ id: "b-binding", domain: "connector" }));

    const listed = registry.list().map((binding) => `${binding.domain}:${binding.id}`);
    expect(listed).toEqual([
      "connector:b-binding",
      "memory:a-binding",
      "memory:z-binding",
    ]);
  });

  it("binding registry filter by domain", () => {
    const registry = new BindingRegistry();
    registry.register(bindingTemplate({ id: "m-1", domain: "memory" }));
    registry.register(bindingTemplate({ id: "c-1", domain: "connector" }));

    const memoryBindings = registry.filterByDomain("memory");
    expect(memoryBindings.length).toBe(1);
    expect(memoryBindings[0].id).toBe("m-1");
  });

  it("binding registry filter by capability", () => {
    const registry = new BindingRegistry();
    registry.register(bindingTemplate({ id: "x", capabilities: ["shared", "a"] }));
    registry.register(bindingTemplate({ id: "y", capabilities: ["b"] }));

    const filtered = registry.filterByCapability("shared");
    expect(filtered.map((binding) => binding.id)).toEqual(["x"]);
  });

  it("governance-required metadata is present on all descriptors", () => {
    const descriptors = [
      createMemoryBindingDescriptor({
        secondBrainStatus: "healthy",
        searchStatus: "healthy",
        graphStatus: "healthy",
        relationshipsStatus: "healthy",
        sharedKnowledgeStatus: "healthy",
        workflowMemoryStatus: "healthy",
        connectorMemoryStatus: "healthy",
        source: "memory",
        version: "1",
      }),
      createOrganizationBindingDescriptor({
        organizationHealth: "healthy",
        tenantHealth: "healthy",
        workspaceHealth: "healthy",
        source: "org",
        version: "1",
      }),
      createSecurityBindingDescriptor({
        permissionsStatus: "healthy",
        approvalWorkflowStatus: "healthy",
        approvalQueueStatus: "healthy",
        humanReviewStatus: "healthy",
        source: "sec",
        version: "1",
      }),
    ];

    for (const descriptor of descriptors) {
      expect(descriptor.governance).toEqual({
        approvalRequired: true,
        humanReviewRequired: true,
        auditRequired: true,
        previewOnly: true,
      });
    }
  });

  it("source reader failure normalization degrades health", () => {
    const descriptor = createConnectorBindingDescriptor({
      sdkDescriptorStatus: "healthy",
      capabilityNormalizationStatus: "degraded",
      complianceStatus: "healthy",
      hardeningStatus: "healthy",
      certificationStatus: "healthy",
      connectorHealthStatus: "healthy",
      source: "connector",
      version: "1",
    });
    expect(descriptor.health).toBe("degraded");
  });

  it("empty registry returns empty lists", () => {
    const registry = new BindingRegistry();
    expect(registry.list()).toEqual([]);
    expect(registry.filterByDomain("memory")).toEqual([]);
    expect(registry.filterByCapability("anything")).toEqual([]);
  });

  it("no input mutation when registering binding", () => {
    const registry = new BindingRegistry();
    const binding = bindingTemplate({
      id: "immutable",
      capabilities: ["cap-a"],
      governance: {
        approvalRequired: true,
        humanReviewRequired: false,
        auditRequired: true,
        previewOnly: true,
      },
    });

    registry.register(binding);
    binding.capabilities.push("cap-b");
    binding.governance.humanReviewRequired = true;

    const stored = registry.get("immutable");
    expect(stored?.capabilities).toEqual(["cap-a"]);
    expect(stored?.governance.humanReviewRequired).toBe(false);
  });
});
