import { buildEnterprisePolicies } from "./enterprise-policy-model"

export type PolicyDriftSignal = {
  id: string
  policyId: string
  driftType: "missing-enforcement" | "legacy-write-surface" | "stale-review"
  severity: "medium" | "high"
  detectionMode: "contract-only"
  persistence: false
}

export function buildPolicyDriftSignals(): PolicyDriftSignal[] {
  return buildEnterprisePolicies().map((policy) => ({
    id: `${policy.id}-drift-signal`,
    policyId: policy.id,
    driftType:
      policy.domain === "publishing" ? "legacy-write-surface" : "missing-enforcement",
    severity: policy.domain === "publishing" ? "high" : "medium",
    detectionMode: "contract-only",
    persistence: false,
  }))
}

export function evaluatePolicyDriftReadiness(
  signals: PolicyDriftSignal[] = buildPolicyDriftSignals()
) {
  const hasSignals = signals.length > 0
  const allContractOnly = signals.every(
    (signal) => signal.detectionMode === "contract-only"
  )
  const noPersistence = signals.every((signal) => signal.persistence === false)
  const checks = [hasSignals, allContractOnly, noPersistence]

  return {
    score: Math.round((checks.filter(Boolean).length / checks.length) * 100),
    status: "POLICY_DRIFT_CONTRACT_READY" as const,
    signalCount: signals.length,
    persistence: false,
  }
}

