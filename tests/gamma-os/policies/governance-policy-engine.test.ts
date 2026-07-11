import { describe, expect, it } from "vitest";
import { GovernancePolicyEngine } from "../../../src/lib/gamma-os/policies/governance-policy-engine";
import { PolicyRegistry } from "../../../src/lib/gamma-os/policies/policy-registry";
import type { PolicyEvaluationContext } from "../../../src/lib/gamma-os/policies/policy-types";

function baseContext(): PolicyEvaluationContext {
  return {
    requestId: "req-1",
    workflowId: "wf-1",
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
}

describe("GovernancePolicyEngine", () => {
  it("approval required", () => {
    const engine = GovernancePolicyEngine.createDefault();
    const result = engine.evaluate(baseContext());
    expect(result.normalized.approvalRequired).toBe(true);
  });

  it("preview-only enforcement", () => {
    const engine = GovernancePolicyEngine.createDefault();
    const result = engine.evaluate({ ...baseContext(), requestedMode: "live" });
    expect(result.normalized.previewOnly).toBe(true);
    expect(result.normalized.blocked).toBe(true);
  });

  it("audit required", () => {
    const engine = GovernancePolicyEngine.createDefault();
    const result = engine.evaluate(baseContext());
    expect(result.normalized.auditRequired).toBe(true);
  });

  it("human review required", () => {
    const engine = GovernancePolicyEngine.createDefault();
    const result = engine.evaluate(baseContext());
    expect(result.normalized.humanReviewRequired).toBe(true);
  });

  it("connector blocked", () => {
    const engine = GovernancePolicyEngine.createDefault();
    const result = engine.evaluate({
      ...baseContext(),
      connectorIds: ["custom-unsafe"],
    });
    expect(result.normalized.blocked).toBe(true);
    expect(result.normalized.violations.join(" ")).toContain("connector-restrictions");
  });

  it("organization denied", () => {
    const engine = GovernancePolicyEngine.createDefault();
    const result = engine.evaluate({
      ...baseContext(),
      organization: {
        tenantId: "",
        organizationId: "org-1",
        environment: "prod",
      },
    });
    expect(result.normalized.blocked).toBe(true);
    expect(result.normalized.violations.join(" ")).toContain("organization-policy");
  });

  it("security denied", () => {
    const engine = GovernancePolicyEngine.createDefault();
    const result = engine.evaluate({
      ...baseContext(),
      requestedCapabilities: ["unsafe"],
    });
    expect(result.normalized.blocked).toBe(true);
    expect(result.normalized.violations.join(" ")).toContain("security-policy");
  });

  it("live execution denied", () => {
    const engine = GovernancePolicyEngine.createDefault();
    const result = engine.evaluate({
      ...baseContext(),
      requestedMode: "live",
    });
    expect(result.normalized.blocked).toBe(true);
    expect(result.normalized.violations.join(" ")).toContain("live-execution-default-deny");
  });

  it("autonomous publishing denied", () => {
    const engine = GovernancePolicyEngine.createDefault();
    const result = engine.evaluate({
      ...baseContext(),
      autonomousPublishingRequested: true,
    });
    expect(result.normalized.blocked).toBe(true);
    expect(result.normalized.violations.join(" ")).toContain(
      "autonomous-publishing-prohibited"
    );
  });

  it("deterministic ordering", () => {
    const engine = GovernancePolicyEngine.createDefault();
    const first = engine.evaluate(baseContext()).normalized.evaluatedPolicyIds;
    const second = engine.evaluate(baseContext()).normalized.evaluatedPolicyIds;
    expect(first).toEqual(second);
  });

  it("duplicate policy registration rejected", () => {
    const registry = new PolicyRegistry();
    const policy = {
      id: "approval-required" as const,
      category: "approval" as const,
      order: 1,
      evaluate: () => ({
        policyId: "approval-required" as const,
        category: "approval" as const,
        severity: "info" as const,
        blocking: false,
        passed: true,
        reason: "ok",
        remediation: "none",
        order: 1,
      }),
    };

    registry.register(policy);
    expect(() => registry.register(policy)).toThrowError(
      "Duplicate policy registration rejected: approval-required"
    );
  });

  it("consolidated decision aggregation", () => {
    const engine = GovernancePolicyEngine.createDefault();
    const result = engine.evaluate(baseContext());
    expect(result.normalized).toMatchObject({
      approvalRequired: true,
      humanReviewRequired: true,
      auditRequired: true,
      previewOnly: true,
    });
    expect(result.governanceDecision.policyDecisions.length).toBeGreaterThan(0);
  });
});
