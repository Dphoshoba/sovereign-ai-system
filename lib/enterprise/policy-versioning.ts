import { buildEnterprisePolicies } from "./enterprise-policy-model"

export type PolicyVersionState = "draft" | "review-required" | "approved-preview"

export type PolicyVersion = {
  id: string
  policyId: string
  version: string
  state: PolicyVersionState
  changeSummary: string
  supersedesVersion: string | null
  persistence: false
  execution: false
}

export function buildPolicyVersions(): PolicyVersion[] {
  return buildEnterprisePolicies().map((policy) => ({
    id: `${policy.id}-v1`,
    policyId: policy.id,
    version: "1.0-preview",
    state: "review-required",
    changeSummary: `${policy.name} baseline preview contract.`,
    supersedesVersion: null,
    persistence: false,
    execution: false,
  }))
}

export function evaluatePolicyVersionReadiness(
  versions: PolicyVersion[] = buildPolicyVersions()
) {
  const allVersioned = versions.every((version) => Boolean(version.version))
  const allReviewTracked = versions.every(
    (version) => version.state === "review-required"
  )
  const allNonPersistent = versions.every((version) => version.persistence === false)
  const allNonExecuting = versions.every((version) => version.execution === false)
  const checks = [allVersioned, allReviewTracked, allNonPersistent, allNonExecuting]

  return {
    score: Math.round((checks.filter(Boolean).length / checks.length) * 100),
    status: "POLICY_VERSIONING_PREVIEW_READY" as const,
    versionCount: versions.length,
    persistence: false,
    execution: false,
  }
}

