import { buildPolicyDriftSignals, evaluatePolicyDriftReadiness } from "./policy-drift"
import { buildPolicyVersions, evaluatePolicyVersionReadiness } from "./policy-versioning"

export type GovernanceEvolutionSignal = {
  id: string
  source: "policy-version" | "policy-drift" | "exception-review"
  recommendation: string
  reviewRequired: true
  execution: false
}

export function buildGovernanceEvolutionSignals(): GovernanceEvolutionSignal[] {
  return [
    ...buildPolicyVersions().slice(0, 2).map((version) => ({
      id: `${version.id}-evolution`,
      source: "policy-version" as const,
      recommendation: `Review ${version.policyId} before enforcement.`,
      reviewRequired: true as const,
      execution: false as const,
    })),
    ...buildPolicyDriftSignals().slice(0, 2).map((signal) => ({
      id: `${signal.id}-evolution`,
      source: "policy-drift" as const,
      recommendation: `Assess ${signal.policyId} drift before policy promotion.`,
      reviewRequired: true as const,
      execution: false as const,
    })),
  ]
}

export function evaluateGovernanceEvolutionReadiness(
  signals: GovernanceEvolutionSignal[] = buildGovernanceEvolutionSignals()
) {
  const versions = evaluatePolicyVersionReadiness()
  const drift = evaluatePolicyDriftReadiness()
  const allRequireReview = signals.every((signal) => signal.reviewRequired)
  const allNonExecuting = signals.every((signal) => signal.execution === false)
  const score = Math.round(
    [versions.score, drift.score, allRequireReview ? 100 : 0, allNonExecuting ? 100 : 0].reduce(
      (sum, value) => sum + value,
      0
    ) / 4
  )

  return {
    score,
    status: "GOVERNANCE_EVOLUTION_PREVIEW_READY" as const,
    signalCount: signals.length,
    persistence: false,
    execution: false,
  }
}

