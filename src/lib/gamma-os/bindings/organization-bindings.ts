import { GovernancePolicyEngine } from "../policies/governance-policy-engine";
import type { PolicyEvaluationContext } from "../policies/policy-types";
import type { BindingDescriptor } from "./binding-registry";

export interface OrganizationSourceSnapshot {
  organizationHealth: "healthy" | "degraded" | "unknown";
  tenantHealth: "healthy" | "degraded" | "unknown";
  workspaceHealth: "healthy" | "degraded" | "unknown";
  source: string;
  version: string;
}

export interface OrganizationNormalizedContext {
  tenantId: string;
  organizationId: string;
  workspaceId: string;
  teamId: string | null;
  departmentId: string | null;
  roleIds: string[];
}

export function normalizeOrganizationContext(input: {
  tenantId: string;
  organizationId: string;
  workspaceId: string;
  teamId?: string;
  departmentId?: string;
  roleIds?: string[];
}): OrganizationNormalizedContext {
  return {
    tenantId: input.tenantId,
    organizationId: input.organizationId,
    workspaceId: input.workspaceId,
    teamId: input.teamId ?? null,
    departmentId: input.departmentId ?? null,
    roleIds: [...(input.roleIds ?? [])],
  };
}

function aggregateHealth(
  snapshot: OrganizationSourceSnapshot
): "healthy" | "degraded" | "unknown" {
  const statuses = [
    snapshot.organizationHealth,
    snapshot.tenantHealth,
    snapshot.workspaceHealth,
  ];
  if (statuses.includes("degraded")) return "degraded";
  if (statuses.every((status) => status === "healthy")) return "healthy";
  return "unknown";
}

export function createOrganizationBindingDescriptor(
  snapshot: OrganizationSourceSnapshot
): BindingDescriptor {
  return {
    id: "organization-binding",
    domain: "organization",
    capabilities: ["organization", "tenant", "workspace-normalization"],
    health: aggregateHealth(snapshot),
    source: snapshot.source,
    version: snapshot.version,
    governance: {
      approvalRequired: true,
      humanReviewRequired: true,
      auditRequired: true,
      previewOnly: true,
    },
  };
}

export function evaluateOrganizationBindingDispatch(
  context: PolicyEvaluationContext,
  engine: GovernancePolicyEngine = GovernancePolicyEngine.createDefault()
) {
  return engine.evaluate(context);
}
