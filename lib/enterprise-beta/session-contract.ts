export type EnterpriseSessionContract = {
  id: string
  name: string
  required: boolean
  enforcementMode: "REPORT_ONLY"
  runtimeEnabled: false
  notes: string
}

export function buildSessionContracts(): EnterpriseSessionContract[] {
  return [
    {
      id: "session-tenant-scope",
      name: "Tenant-scoped session",
      required: true,
      enforcementMode: "REPORT_ONLY",
      runtimeEnabled: false,
      notes: "Every future session must carry an organization boundary.",
    },
    {
      id: "session-workspace-scope",
      name: "Workspace-scoped access",
      required: true,
      enforcementMode: "REPORT_ONLY",
      runtimeEnabled: false,
      notes: "Workspace access must be explicit for workspace-bound actions.",
    },
    {
      id: "session-risk-state",
      name: "Risk and approval state",
      required: true,
      enforcementMode: "REPORT_ONLY",
      runtimeEnabled: false,
      notes: "High-risk actions must preserve approval and intent context.",
    },
  ]
}

export function evaluateSessionReadiness(
  contracts: EnterpriseSessionContract[] = buildSessionContracts()
) {
  const requiredContracts = contracts.filter((contract) => contract.required).length
  const score = Math.round((requiredContracts / contracts.length) * 70)

  return {
    score,
    status: "SESSION_CONTRACT_READY_NO_SESSIONS" as const,
    contractCount: contracts.length,
    sessionsEnabled: false,
    jwtIssued: false,
  }
}
