import { buildPolicyExceptions } from "./policy-exception"

export type ExceptionWorkflowStep = {
  id: string
  name: string
  owner: "requester" | "review-board" | "policy-admin"
  outcome: "document" | "review" | "recommend" | "reject-preview"
  blocksExecution: true
}

export function buildExceptionWorkflowSteps(): ExceptionWorkflowStep[] {
  return [
    {
      id: "exception-intake",
      name: "Exception Intake",
      owner: "requester",
      outcome: "document",
      blocksExecution: true,
    },
    {
      id: "exception-review",
      name: "Exception Review",
      owner: "review-board",
      outcome: "review",
      blocksExecution: true,
    },
    {
      id: "exception-recommendation",
      name: "Exception Recommendation",
      owner: "policy-admin",
      outcome: "recommend",
      blocksExecution: true,
    },
  ]
}

export function evaluateExceptionWorkflowReadiness(
  steps: ExceptionWorkflowStep[] = buildExceptionWorkflowSteps()
) {
  const exceptions = buildPolicyExceptions()
  const allBlockExecution = steps.every((step) => step.blocksExecution)
  const hasReview = steps.some((step) => step.outcome === "review")
  const hasExceptions = exceptions.length > 0
  const checks = [allBlockExecution, hasReview, hasExceptions]

  return {
    score: Math.round((checks.filter(Boolean).length / checks.length) * 100),
    status: "EXCEPTION_WORKFLOW_PREVIEW_READY" as const,
    stepCount: steps.length,
    exceptionCount: exceptions.length,
    execution: false,
  }
}

