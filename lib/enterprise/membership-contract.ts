export type EnterpriseMembershipStatus = "invited" | "active" | "suspended" | "removed"

export type EnterpriseMembershipContract = {
  id: string
  actorType: "human" | "system"
  roleId: string
  organizationIdRequired: true
  workspaceIdsRequired: true
  departmentIds: string[]
  teamIds: string[]
  status: EnterpriseMembershipStatus
  authProviderStatus: "not-integrated"
  sessionStatus: "not-implemented"
  jwtStatus: "not-implemented"
}

export function buildEnterpriseMembershipContracts(): EnterpriseMembershipContract[] {
  return [
    {
      id: "founder-admin-membership",
      actorType: "human",
      roleId: "enterprise-administrator",
      organizationIdRequired: true,
      workspaceIdsRequired: true,
      departmentIds: ["executive-office"],
      teamIds: ["enterprise-admins", "review-board"],
      status: "invited",
      authProviderStatus: "not-integrated",
      sessionStatus: "not-implemented",
      jwtStatus: "not-implemented",
    },
    {
      id: "research-lead-membership",
      actorType: "human",
      roleId: "research-lead",
      organizationIdRequired: true,
      workspaceIdsRequired: true,
      departmentIds: ["research-intelligence"],
      teamIds: ["research-operators"],
      status: "invited",
      authProviderStatus: "not-integrated",
      sessionStatus: "not-implemented",
      jwtStatus: "not-implemented",
    },
    {
      id: "reviewer-membership",
      actorType: "human",
      roleId: "enterprise-reviewer",
      organizationIdRequired: true,
      workspaceIdsRequired: true,
      departmentIds: ["executive-office"],
      teamIds: ["review-board"],
      status: "invited",
      authProviderStatus: "not-integrated",
      sessionStatus: "not-implemented",
      jwtStatus: "not-implemented",
    },
  ]
}

export function evaluateMembershipReadiness(
  contracts: EnterpriseMembershipContract[] = buildEnterpriseMembershipContracts()
) {
  const scoped = contracts.every(
    (contract) =>
      contract.organizationIdRequired &&
      contract.workspaceIdsRequired &&
      contract.authProviderStatus === "not-integrated"
  )
  const noSessionsOrJwt = contracts.every(
    (contract) =>
      contract.sessionStatus === "not-implemented" &&
      contract.jwtStatus === "not-implemented"
  )

  return {
    score: scoped && noSessionsOrJwt ? 74 : 40,
    status: "CONTRACT_READY_AUTH_BLOCKED" as const,
    membershipContractCount: contracts.length,
    authProviderIntegrated: false,
    sessions: false,
    jwt: false,
  }
}

