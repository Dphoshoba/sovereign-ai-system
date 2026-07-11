import { GovernancePolicyEngine } from "../policies/governance-policy-engine";
import type { PolicyEvaluationContext } from "../policies/policy-types";
import type { BindingDescriptor } from "./binding-registry";

export interface AgentRuntimeSourceSnapshot {
  plannerStatus: "healthy" | "degraded" | "unknown";
  reviewerStatus: "healthy" | "degraded" | "unknown";
  workflowEngineStatus: "healthy" | "degraded" | "unknown";
  runtimeQueueStatus: "healthy" | "degraded" | "unknown";
  executionStatus: "healthy" | "degraded" | "unknown";
  simulatorStatus: "healthy" | "degraded" | "unknown";
  auditStatus: "healthy" | "degraded" | "unknown";
  source: string;
  version: string;
}

function aggregateHealth(
  snapshot: AgentRuntimeSourceSnapshot
): "healthy" | "degraded" | "unknown" {
  const statuses = [
    snapshot.plannerStatus,
    snapshot.reviewerStatus,
    snapshot.workflowEngineStatus,
    snapshot.runtimeQueueStatus,
    snapshot.executionStatus,
    snapshot.simulatorStatus,
    snapshot.auditStatus,
  ];
  if (statuses.includes("degraded")) return "degraded";
  if (statuses.every((status) => status === "healthy")) return "healthy";
  return "unknown";
}

export function createAgentRuntimeBindingDescriptor(
  snapshot: AgentRuntimeSourceSnapshot
): BindingDescriptor {
  return {
    id: "agent-runtime-binding",
    domain: "agent-runtime",
    capabilities: [
      "planner",
      "reviewer",
      "workflow-engine",
      "runtime-queue",
      "execution",
      "simulator",
      "audit",
      "delegation-placeholder",
      "conflict-placeholder",
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

export function evaluateAgentRuntimeBindingDispatch(
  context: PolicyEvaluationContext,
  engine: GovernancePolicyEngine = GovernancePolicyEngine.createDefault()
) {
  return engine.evaluate(context);
}
