import { GovernancePolicyEngine } from "../policies/governance-policy-engine";
import type { PolicyEvaluationContext } from "../policies/policy-types";
import type { BindingDescriptor } from "./binding-registry";

export interface MemorySourceSnapshot {
  secondBrainStatus: "healthy" | "degraded" | "unknown";
  searchStatus: "healthy" | "degraded" | "unknown";
  graphStatus: "healthy" | "degraded" | "unknown";
  relationshipsStatus: "healthy" | "degraded" | "unknown";
  sharedKnowledgeStatus: "healthy" | "degraded" | "unknown";
  workflowMemoryStatus: "healthy" | "degraded" | "unknown";
  connectorMemoryStatus: "healthy" | "degraded" | "unknown";
  source: string;
  version: string;
}

export interface MemoryBindingDispatchInput {
  context: PolicyEvaluationContext;
}

export interface MemoryBindingDispatchResult {
  allowed: boolean;
  blocked: boolean;
  governanceSummary: string;
  evaluatedPolicyIds: string[];
}

function aggregateHealth(
  snapshot: MemorySourceSnapshot
): "healthy" | "degraded" | "unknown" {
  const statuses = [
    snapshot.secondBrainStatus,
    snapshot.searchStatus,
    snapshot.graphStatus,
    snapshot.relationshipsStatus,
    snapshot.sharedKnowledgeStatus,
    snapshot.workflowMemoryStatus,
    snapshot.connectorMemoryStatus,
  ];
  if (statuses.includes("degraded")) return "degraded";
  if (statuses.every((status) => status === "healthy")) return "healthy";
  return "unknown";
}

export function createMemoryBindingDescriptor(
  snapshot: MemorySourceSnapshot
): BindingDescriptor {
  return {
    id: "memory-binding",
    domain: "memory",
    capabilities: [
      "second-brain",
      "search",
      "graph",
      "relationships",
      "shared-knowledge",
      "workflow-memory",
      "connector-memory",
      "metadata-provenance",
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

export function evaluateMemoryBindingDispatch(
  input: MemoryBindingDispatchInput,
  engine: GovernancePolicyEngine = GovernancePolicyEngine.createDefault()
): MemoryBindingDispatchResult {
  const result = engine.evaluate(input.context);
  return {
    allowed: result.normalized.allowed,
    blocked: result.normalized.blocked,
    governanceSummary: result.governanceDecision.summary,
    evaluatedPolicyIds: [...result.normalized.evaluatedPolicyIds],
  };
}
