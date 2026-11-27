import { evaluateDryRunCoverage } from "./runtime-auth-dry-run"
import { evaluateFeatureFlagCoverage } from "./auth-feature-flags"
import { evaluateRollbackCoverage } from "./auth-rollback"
import { evaluateGoNoGoCoverage } from "./auth-go-no-go"
import { evaluateAuthRiskReadiness } from "./auth-risk-register"

export function evaluateAuthActivationReadiness() {
  const dryRun = evaluateDryRunCoverage()
  const featureFlags = evaluateFeatureFlagCoverage()
  const rollback = evaluateRollbackCoverage()
  const goNoGo = evaluateGoNoGoCoverage()
  const risk = evaluateAuthRiskReadiness()

  return {
    score: Math.round(
      [dryRun.score, featureFlags.score, rollback.score, goNoGo.score, risk.score].reduce(
        (sum, score) => sum + score,
        0
      ) / 5
    ),
    status: "AUTH_ACTIVATION_READINESS_DEFINED_REPORT_ONLY" as const,
    runtimeActivation: false,
  }
}
