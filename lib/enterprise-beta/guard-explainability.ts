import { evaluateDecisionCoverage } from "./guard-decision"
import { evaluateEvidenceCoverage } from "./guard-evidence"
import { evaluateReasoningCoverage } from "./guard-reasoning"

export function buildGuardExplainability() {
  const decision = evaluateDecisionCoverage()
  const evidence = evaluateEvidenceCoverage()
  const reasoning = evaluateReasoningCoverage()
  const explainabilityScore = Math.round(
    [decision.score, evidence.score, reasoning.score].reduce(
      (sum, score) => sum + score,
      0
    ) / 3
  )

  return {
    score: explainabilityScore,
    status: "EXPLAINABILITY_READY_REPORT_ONLY" as const,
    operatorFacing: true,
    generatedByAi: false,
    persisted: false,
  }
}
