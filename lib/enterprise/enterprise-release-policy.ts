export type EnterpriseReleasePolicy = {
  id: string
  name: string
  policyMode: "preview-only"
  requiredApprovals: string[]
  requiredEvidence: string[]
  blocksProduction: true
  persistence: false
}

export function buildEnterpriseReleasePolicies(): EnterpriseReleasePolicy[] {
  return [
    {
      id: "no-production-without-auth",
      name: "No production without auth enforcement",
      policyMode: "preview-only",
      requiredApprovals: ["release board", "security owner"],
      requiredEvidence: ["auth provider integrated", "authorization guards enforced"],
      blocksProduction: true,
      persistence: false,
    },
    {
      id: "no-production-without-observability",
      name: "No production without observability",
      policyMode: "preview-only",
      requiredApprovals: ["release board"],
      requiredEvidence: ["telemetry backend", "audit persistence", "redaction policy"],
      blocksProduction: true,
      persistence: false,
    },
  ]
}

export function evaluateReleasePolicyReadiness(
  policies: EnterpriseReleasePolicy[] = buildEnterpriseReleasePolicies()
) {
  const allPreview = policies.every((policy) => policy.policyMode === "preview-only")
  const allBlockProduction = policies.every((policy) => policy.blocksProduction)
  const noPersistence = policies.every((policy) => policy.persistence === false)
  const checks = [allPreview, allBlockProduction, noPersistence]

  return {
    score: Math.round((checks.filter(Boolean).length / checks.length) * 100),
    status: "RELEASE_POLICY_PREVIEW_READY" as const,
    policyCount: policies.length,
    productionBlocked: true,
  }
}

