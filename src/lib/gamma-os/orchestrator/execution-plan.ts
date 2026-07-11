import type { GovernanceEngineResult } from "../policies/policy-types";
import type { BindingDescriptor } from "../bindings/binding-registry";
import type { OrchestrationPlan, WorkflowRequest } from "../contracts";

export type RouteStatus = "ready" | "blocked";

export interface PreviewRoute {
  route: "preview";
  status: RouteStatus;
  reason?: string;
  metadata: {
    deterministic: true;
    mode: "preview-only";
  };
}

export interface ApprovalRoute {
  route: "approval";
  status: RouteStatus;
  checkpoints: string[];
  requiresHumanReview: boolean;
  reason?: string;
}

export interface AuditRoute {
  route: "audit";
  status: RouteStatus;
  references: string[];
  immutableProjection: true;
  reason?: string;
}

export function buildOrchestrationPlan(params: {
  workflowRequest: WorkflowRequest;
  requiredCapabilities: string[];
  capabilityMap: Record<string, string[]>;
  resolvedBindings: BindingDescriptor[];
  governanceDecision: GovernanceEngineResult["normalized"];
  dependencyGraph: Record<string, string[]>;
  executionOrder: string[];
  previewRoute: PreviewRoute;
  approvalRoute: ApprovalRoute;
  auditRoute: AuditRoute;
  warnings: string[];
  blockers: string[];
}): OrchestrationPlan {
  const {
    workflowRequest,
    requiredCapabilities,
    capabilityMap,
    resolvedBindings,
    governanceDecision,
    dependencyGraph,
    executionOrder,
    previewRoute,
    approvalRoute,
    auditRoute,
    warnings,
    blockers,
  } = params;

  return {
    requestId: workflowRequest.requestId,
    workflowId: workflowRequest.workflowId,
    organizationContext: { ...workflowRequest.organization },
    resolvedBindings: resolvedBindings.map((binding) => binding.id),
    requiredCapabilities: [...requiredCapabilities],
    capabilityMap: Object.fromEntries(
      Object.entries(capabilityMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([capability, bindingIds]) => [
          capability,
          [...bindingIds].sort((a, b) => a.localeCompare(b)),
        ])
    ),
    governanceDecision: {
      blocked: governanceDecision.blocked,
      approved: governanceDecision.allowed,
      previewOnly: governanceDecision.previewOnly,
      evaluatedPolicyIds: [...(governanceDecision.evaluatedPolicyIds ?? [])],
      violations: [...(governanceDecision.violations ?? [])],
      obligations: [
        ...(governanceDecision.approvalRequired ? ["approval-required"] : []),
        ...(governanceDecision.humanReviewRequired ? ["human-review-required"] : []),
        ...(governanceDecision.auditRequired ? ["audit-required"] : []),
      ],
    },
    dependencyGraph: Object.fromEntries(
      Object.entries(dependencyGraph)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => [key, [...value].sort((a, b) => a.localeCompare(b))])
    ),
    executionOrder: [...executionOrder],
    previewRoute: {
      route: previewRoute.route,
      status: previewRoute.status,
      reason: previewRoute.reason,
      metadata: { ...previewRoute.metadata },
    },
    approvalRoute: {
      route: approvalRoute.route,
      status: approvalRoute.status,
      checkpoints: [...approvalRoute.checkpoints],
      requiresHumanReview: approvalRoute.requiresHumanReview,
      reason: approvalRoute.reason,
    },
    auditRoute: {
      route: auditRoute.route,
      status: auditRoute.status,
      references: [...auditRoute.references],
      immutableProjection: true,
      reason: auditRoute.reason,
    },
    status: blockers.length > 0 ? "blocked" : "planned",
    warnings: [...warnings],
    blockers: [...blockers],
  };
}
