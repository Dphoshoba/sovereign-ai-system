export type ReviewWorkflowStep = {
  id: string
  name: string
  owner: "review-board" | "domain-reviewer" | "enterprise-admin"
  expectedOutcome: "recommend" | "request-more-information" | "escalate"
  blocksExecution: true
}

export function buildReviewWorkflowSteps(): ReviewWorkflowStep[] {
  return [
    {
      id: "intake",
      name: "Review Intake",
      owner: "review-board",
      expectedOutcome: "request-more-information",
      blocksExecution: true,
    },
    {
      id: "domain-review",
      name: "Domain Review",
      owner: "domain-reviewer",
      expectedOutcome: "recommend",
      blocksExecution: true,
    },
    {
      id: "governance-escalation",
      name: "Governance Escalation",
      owner: "enterprise-admin",
      expectedOutcome: "escalate",
      blocksExecution: true,
    },
    {
      id: "decision-packet-preview",
      name: "Decision Packet Preview",
      owner: "review-board",
      expectedOutcome: "recommend",
      blocksExecution: true,
    },
  ]
}

export function evaluateWorkflowReadiness(
  steps: ReviewWorkflowStep[] = buildReviewWorkflowSteps()
) {
  const hasIntake = steps.some((step) => step.id === "intake")
  const hasDomainReview = steps.some((step) => step.id === "domain-review")
  const hasEscalation = steps.some((step) => step.id === "governance-escalation")
  const allBlockExecution = steps.every((step) => step.blocksExecution)
  const checks = [hasIntake, hasDomainReview, hasEscalation, allBlockExecution]

  return {
    score: Math.round((checks.filter(Boolean).length / checks.length) * 100),
    status: "WORKFLOW_PREVIEW_READY_EXECUTION_BLOCKED" as const,
    stepCount: steps.length,
    execution: false,
  }
}

