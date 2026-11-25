import type { GuardDecision } from "./guard-decision"
import { buildGuardDecisions } from "./guard-decision"

export type GuardReasoning = {
  id: string
  decisionId: string
  routePattern: string
  operatorReason: string
  technicalReason: string
  nextRequiredAction: string
  generatedByAi: false
}

export function buildGuardReasoning(
  decisions: GuardDecision[] = buildGuardDecisions()
): GuardReasoning[] {
  return decisions.map((decision) => ({
    id: `${decision.id}-reasoning`,
    decisionId: decision.id,
    routePattern: decision.routePattern,
    operatorReason: decision.explanation,
    technicalReason:
      decision.missingClaims.length > 0
        ? `Missing required claims: ${decision.missingClaims.join(", ")}.`
        : "Required preview claims are represented in the report-only context.",
    nextRequiredAction:
      decision.outcome === "ALLOW_PREVIEW"
        ? "Keep route in preview mode until enforcement is approved."
        : "Resolve missing tenant, workspace, permission, or approval context before enforcement.",
    generatedByAi: false,
  }))
}

export function evaluateReasoningCoverage(reasoning: GuardReasoning[] = buildGuardReasoning()) {
  const operatorVisible = reasoning.filter(
    (item) => item.operatorReason && item.nextRequiredAction
  ).length

  return {
    score: Math.round((operatorVisible / reasoning.length) * 84),
    status: "OPERATOR_REASONING_READY_STATIC" as const,
    reasoningCount: reasoning.length,
    generatedByAi: false,
  }
}
