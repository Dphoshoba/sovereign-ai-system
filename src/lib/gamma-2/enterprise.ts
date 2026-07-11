export type EnterpriseCapability =
  | "organizations"
  | "departments"
  | "rbac"
  | "sso"
  | "licensing"
  | "billing"
  | "compliance"
  | "monitoring"
  | "high-availability"
  | "disaster-recovery"
  | "regional-deployment";

export interface EnterpriseTenantInput {
  tenantId: string;
  organizationName: string;
  region: "us" | "eu" | "au";
  enabledCapabilities: EnterpriseCapability[];
  requestedAt: Date;
}

export interface EnterpriseReadinessPlan {
  id: string;
  tenantId: string;
  organizationName: string;
  region: EnterpriseTenantInput["region"];
  status: "enterprise-ready" | "blocked";
  readinessScore: number;
  missingCapabilities: EnterpriseCapability[];
  governanceBoundaries: string[];
  generatedAt: Date;
}

export const PHASE_XX_ENTERPRISE_CAPABILITIES: EnterpriseCapability[] = [
  "organizations",
  "departments",
  "rbac",
  "sso",
  "licensing",
  "billing",
  "compliance",
  "monitoring",
  "high-availability",
  "disaster-recovery",
  "regional-deployment",
];

function uniqueCapabilities(capabilities: EnterpriseCapability[]): EnterpriseCapability[] {
  return PHASE_XX_ENTERPRISE_CAPABILITIES.filter((capability) =>
    capabilities.includes(capability)
  );
}

export function buildEnterpriseReadinessPlan(
  input: EnterpriseTenantInput
): EnterpriseReadinessPlan {
  const enabled = uniqueCapabilities(input.enabledCapabilities);
  const missingCapabilities = PHASE_XX_ENTERPRISE_CAPABILITIES.filter(
    (capability) => !enabled.includes(capability)
  );
  const readinessScore = Math.round(
    (enabled.length / PHASE_XX_ENTERPRISE_CAPABILITIES.length) * 100
  );

  return {
    id: `enterprise_${input.tenantId}`,
    tenantId: input.tenantId,
    organizationName: input.organizationName,
    region: input.region,
    status: missingCapabilities.length === 0 ? "enterprise-ready" : "blocked",
    readinessScore,
    missingCapabilities,
    governanceBoundaries: [
      "human-admin-required",
      "tenant-isolation-required",
      "audit-required",
      "regional-policy-required",
    ],
    generatedAt: new Date(input.requestedAt),
  };
}

export function buildPhaseXXReadiness(): {
  phase: "XX";
  name: "Enterprise";
  requiredCapabilities: EnterpriseCapability[];
  enterpriseRule: "tenant-isolated-governed-deployment";
} {
  return {
    phase: "XX",
    name: "Enterprise",
    requiredCapabilities: [...PHASE_XX_ENTERPRISE_CAPABILITIES],
    enterpriseRule: "tenant-isolated-governed-deployment",
  };
}
