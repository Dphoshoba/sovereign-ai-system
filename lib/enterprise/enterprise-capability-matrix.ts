export type EnterpriseCapabilityStatus =
  | "COMPLETE_CONTRACT"
  | "PREVIEW_READY"
  | "BETA_REQUIRED"
  | "BLOCKED_BY_DESIGN"

export type EnterpriseCapability = {
  id: string
  name: string
  area:
    | "foundation"
    | "topology"
    | "guards"
    | "audit"
    | "approval"
    | "policy"
    | "deployment"
  status: EnterpriseCapabilityStatus
  coverage: number
  betaBlockers: string[]
}

export function buildEnterpriseCapabilityMatrix(): EnterpriseCapability[] {
  return [
    {
      id: "ea-cap-foundation",
      name: "Enterprise tenant and governance foundation",
      area: "foundation",
      status: "COMPLETE_CONTRACT",
      coverage: 92,
      betaBlockers: ["Production auth provider selection and enforcement"],
    },
    {
      id: "ea-cap-topology",
      name: "Organizations, workspaces, departments, teams, and memberships",
      area: "topology",
      status: "COMPLETE_CONTRACT",
      coverage: 92,
      betaBlockers: ["Membership persistence mapping remains future work"],
    },
    {
      id: "ea-cap-guards",
      name: "Tenant guards and enterprise isolation audits",
      area: "guards",
      status: "PREVIEW_READY",
      coverage: 94,
      betaBlockers: ["Route guard enforcement is not active"],
    },
    {
      id: "ea-cap-evidence",
      name: "Audit evidence, compliance surface, and trust model",
      area: "audit",
      status: "PREVIEW_READY",
      coverage: 90,
      betaBlockers: ["No audit evidence persistence backend"],
    },
    {
      id: "ea-cap-approvals",
      name: "Review boards, approval chains, delegation, and decision packets",
      area: "approval",
      status: "PREVIEW_READY",
      coverage: 93,
      betaBlockers: ["No enterprise review-board workflow execution"],
    },
    {
      id: "ea-cap-policy",
      name: "Policy versioning, exceptions, drift, and change control",
      area: "policy",
      status: "PREVIEW_READY",
      coverage: 91,
      betaBlockers: ["No policy enforcement or persisted policy registry"],
    },
    {
      id: "ea-cap-deployment",
      name: "Deployment gates, release tiers, promotion criteria, and blockers",
      area: "deployment",
      status: "COMPLETE_CONTRACT",
      coverage: 100,
      betaBlockers: ["Deployment gates are not wired into CI or hosting"],
    },
    {
      id: "ea-cap-execution",
      name: "Enterprise execution, publishing, OpenAI, and graph write controls",
      area: "foundation",
      status: "BLOCKED_BY_DESIGN",
      coverage: 100,
      betaBlockers: ["Execution remains intentionally unavailable in Alpha"],
    },
  ]
}

export function evaluateEnterpriseCapabilityCoverage(
  capabilities: EnterpriseCapability[] = buildEnterpriseCapabilityMatrix()
) {
  const score = Math.round(
    capabilities.reduce((sum, capability) => sum + capability.coverage, 0) /
      capabilities.length
  )

  return {
    score,
    status: "ALPHA_CAPABILITY_CONTRACTS_COMPLETE" as const,
    capabilityCount: capabilities.length,
    blockedByDesignCount: capabilities.filter(
      (capability) => capability.status === "BLOCKED_BY_DESIGN"
    ).length,
    betaBlockerCount: capabilities.reduce(
      (sum, capability) => sum + capability.betaBlockers.length,
      0
    ),
  }
}
