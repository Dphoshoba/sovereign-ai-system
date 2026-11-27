import { GovernancePolicyEngine } from "../policies/governance-policy-engine";
import type { PolicyEvaluationContext } from "../policies/policy-types";
import type { BindingDescriptor } from "./binding-registry";

export interface SecuritySourceSnapshot {
  permissionsStatus: "healthy" | "degraded" | "unknown";
  approvalWorkflowStatus: "healthy" | "degraded" | "unknown";
  approvalQueueStatus: "healthy" | "degraded" | "unknown";
  humanReviewStatus: "healthy" | "degraded" | "unknown";
  source: string;
  version: string;
}

function aggregateHealth(
  snapshot: SecuritySourceSnapshot
): "healthy" | "degraded" | "unknown" {
  const statuses = [
    snapshot.permissionsStatus,
    snapshot.approvalWorkflowStatus,
    snapshot.approvalQueueStatus,
    snapshot.humanReviewStatus,
  ];
  if (statuses.includes("degraded")) return "degraded";
  if (statuses.every((status) => status === "healthy")) return "healthy";
  return "unknown";
}

export function createSecurityBindingDescriptor(
  snapshot: SecuritySourceSnapshot
): BindingDescriptor {
  return {
    id: "security-binding",
    domain: "security",
    capabilities: [
      "permissions",
      "approval-workflow",
      "approval-queue",
      "human-review",
    ],
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

export function evaluateSecurityBindingDispatch(
  context: PolicyEvaluationContext,
  engine: GovernancePolicyEngine = GovernancePolicyEngine.createDefault()
) {
  return engine.evaluate(context);
}
