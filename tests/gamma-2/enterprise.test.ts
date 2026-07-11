import { describe, expect, it } from "vitest";
import {
  PHASE_XX_ENTERPRISE_CAPABILITIES,
  buildEnterpriseReadinessPlan,
  buildPhaseXXReadiness,
} from "../../src/lib/gamma-2/enterprise";

const BASE_TIME = new Date("2026-07-12T00:00:00.000Z");

describe("Gamma 2 Phase XX Enterprise", () => {
  it("marks tenants enterprise-ready when every capability is enabled", () => {
    const plan = buildEnterpriseReadinessPlan({
      tenantId: "tenant-ev",
      organizationName: "Echoes and Visions",
      region: "au",
      enabledCapabilities: [...PHASE_XX_ENTERPRISE_CAPABILITIES],
      requestedAt: BASE_TIME,
    });

    expect(plan.status).toBe("enterprise-ready");
    expect(plan.readinessScore).toBe(100);
    expect(plan.missingCapabilities).toEqual([]);
    expect(plan.governanceBoundaries).toContain("tenant-isolation-required");
  });

  it("blocks tenants missing enterprise capabilities", () => {
    const plan = buildEnterpriseReadinessPlan({
      tenantId: "tenant-partial",
      organizationName: "Partial Org",
      region: "us",
      enabledCapabilities: ["organizations", "rbac", "monitoring"],
      requestedAt: BASE_TIME,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.readinessScore).toBe(27);
    expect(plan.missingCapabilities).toContain("sso");
    expect(plan.missingCapabilities).toContain("regional-deployment");
  });

  it("is deterministic for identical enterprise input", () => {
    const input = {
      tenantId: "tenant-deterministic",
      organizationName: "Deterministic Org",
      region: "eu" as const,
      enabledCapabilities: [...PHASE_XX_ENTERPRISE_CAPABILITIES],
      requestedAt: BASE_TIME,
    };

    expect(buildEnterpriseReadinessPlan(input)).toEqual(buildEnterpriseReadinessPlan(input));
  });

  it("reports Phase XX readiness", () => {
    const readiness = buildPhaseXXReadiness();

    expect(readiness.phase).toBe("XX");
    expect(readiness.requiredCapabilities).toHaveLength(11);
    expect(readiness.enterpriseRule).toBe("tenant-isolated-governed-deployment");
  });
});
