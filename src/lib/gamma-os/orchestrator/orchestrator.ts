import type { WorkflowRequest, OrchestrationPlan } from "../contracts";
import { GovernancePolicyEngine } from "../policies/governance-policy-engine";
import type { PolicyEvaluationContext } from "../policies/policy-types";
import { BindingRegistry } from "../bindings/binding-registry";
import { createExecutionContext } from "./execution-context";
import { planDispatch } from "./dispatch-planner";
import { routePreview } from "./preview-router";
import { routeApproval } from "./approval-router";
import { routeAudit } from "./audit-router";
import { routeExecutionIntent } from "./execution-router";
import { buildOrchestrationPlan } from "./execution-plan";

function toPolicyContext(workflowRequest: WorkflowRequest): PolicyEvaluationContext {
  return {
    requestId: workflowRequest.requestId,
    workflowId: workflowRequest.workflowId,
    organization: {
      tenantId: workflowRequest.organization.tenantId,
      organizationId: workflowRequest.organization.organizationId,
      environment: workflowRequest.organization.environment,
    },
    requestedCapabilities: [
      ...new Set(
        Object.keys(workflowRequest.input)
          .map((key) => `input:${key}`)
          .concat([
            `trigger:${workflowRequest.trigger.type}`,
            `source:${workflowRequest.trigger.source}`,
          ])
      ),
    ].sort((a, b) => a.localeCompare(b)),
    connectorIds: [],
    requiresApproval: true,
    requiresHumanReview: true,
    requiresAudit: true,
    requestedMode: "preview",
    autonomousPublishingRequested: false,
  };
}

export function orchestrateWorkflowRequest(params: {
  workflowRequest: WorkflowRequest;
  bindingRegistry: BindingRegistry;
  policyEngine?: GovernancePolicyEngine;
}): OrchestrationPlan {
  const {
    workflowRequest,
    bindingRegistry,
    policyEngine = GovernancePolicyEngine.createDefault(),
  } = params;

  const policyContext = toPolicyContext(workflowRequest);
  const governanceResult = policyEngine.evaluate(policyContext);

  const dispatchPlan = planDispatch({
    workflowRequest,
    bindingRegistry,
    governanceDecision: governanceResult.normalized,
  });

  createExecutionContext({
    workflowRequest,
    requiredCapabilities: dispatchPlan.requiredCapabilities,
    availableBindings: dispatchPlan.resolvedBindings,
  });

  const previewRoute = routePreview({
    governanceDecision: governanceResult.normalized,
  });

  const approvalRoute = routeApproval({
    governanceDecision: {
      ...governanceResult.normalized,
      obligations: [
        ...(governanceResult.normalized.approvalRequired ? ["approval-required"] : []),
        ...(governanceResult.normalized.humanReviewRequired ? ["human-review-required"] : []),
        ...(governanceResult.normalized.auditRequired ? ["audit-required"] : []),
      ],
    } as typeof governanceResult.normalized & { obligations: string[] },
    requiredCapabilities: dispatchPlan.requiredCapabilities,
  });

  const auditRoute = routeAudit({
    governanceDecision: governanceResult.normalized,
    requestId: workflowRequest.requestId,
    workflowId: workflowRequest.workflowId,
  });

  const executionIntent = routeExecutionIntent({
    governanceDecision: governanceResult.normalized,
    previewReady: previewRoute.status === "ready",
    approvalReady: approvalRoute.status === "ready",
    auditReady: auditRoute.status === "ready",
  });

  const warnings = [...dispatchPlan.warnings];
  const blockers = [...dispatchPlan.blockers];

  if (executionIntent.status === "blocked" && executionIntent.reason) {
    blockers.push(executionIntent.reason);
  }

  if (executionIntent.route !== "preview") {
    warnings.push(`Primary route intent is ${executionIntent.route}.`);
  }

  return buildOrchestrationPlan({
    workflowRequest,
    requiredCapabilities: dispatchPlan.requiredCapabilities,
    capabilityMap: dispatchPlan.capabilityMap,
    resolvedBindings: dispatchPlan.resolvedBindings,
    governanceDecision: governanceResult.normalized,
    dependencyGraph: dispatchPlan.dependencyGraph,
    executionOrder: dispatchPlan.executionOrder,
    previewRoute,
    approvalRoute,
    auditRoute,
    warnings,
    blockers,
  });
}
