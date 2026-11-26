export type EnterpriseGovernanceGate =
  | "tenant-scope"
  | "operator-authentication"
  | "operator-authorization"
  | "review-required"
  | "approval-required"
  | "audit-required"
  | "rate-limit-required"
  | "execution-disabled"

export type EnterpriseGovernancePolicy = {
  id: string
  name: string
  gates: EnterpriseGovernanceGate[]
  enforcementStatus: "contract-only" | "legacy-runtime-present" | "blocked"
  appliesTo: string[]
  riskLevel: "medium" | "high" | "critical"
  notes: string
}

export type EnterpriseBlockedCapability = {
  capability: string
  status: "blocked"
  unblockRequires: string[]
}

export function buildEnterpriseGovernancePolicies(): EnterpriseGovernancePolicy[] {
  return [
    {
      id: "ea1-tenant-boundary",
      name: "Tenant scope required for enterprise actions",
      gates: ["tenant-scope", "operator-authentication", "operator-authorization"],
      enforcementStatus: "contract-only",
      appliesTo: ["operator actions", "graph writes", "publishing", "content generation"],
      riskLevel: "critical",
      notes: "Every future enterprise action must carry organizationId, workspaceId, and actorId before execution can be considered.",
    },
    {
      id: "ea1-human-approval",
      name: "Human approval required for risky actions",
      gates: ["review-required", "approval-required", "audit-required"],
      enforcementStatus: "contract-only",
      appliesTo: ["graph ingestion", "publishing", "external operations", "operator execution"],
      riskLevel: "critical",
      notes: "Enterprise Alpha does not add approval execution controls; it documents the required boundary.",
    },
    {
      id: "ea1-execution-disabled",
      name: "Execution remains disabled in Enterprise Alpha",
      gates: ["execution-disabled", "audit-required"],
      enforcementStatus: "blocked",
      appliesTo: ["all enterprise-alpha routes and contracts"],
      riskLevel: "critical",
      notes: "EA-1 is planning and contracts only. No action may become executable in this phase.",
    },
    {
      id: "ea1-rate-limit-required",
      name: "Enterprise rate limits required before production operation",
      gates: ["rate-limit-required", "operator-authentication"],
      enforcementStatus: "contract-only",
      appliesTo: ["operator previews", "review packages", "mission planning", "future execution"],
      riskLevel: "high",
      notes: "Rate-limit implementation remains a future approved hardening task.",
    },
  ]
}

export function buildEnterpriseBlockedCapabilities(): EnterpriseBlockedCapability[] {
  return [
    {
      capability: "operator action execution",
      status: "blocked",
      unblockRequires: ["auth provider integration", "route authorization", "approval workflow", "audit persistence"],
    },
    {
      capability: "automatic publishing",
      status: "blocked",
      unblockRequires: ["publication approval", "channel safety tests", "tenant-scoped publishing credentials"],
    },
    {
      capability: "automatic graph ingestion",
      status: "blocked",
      unblockRequires: ["entity upsert enforcement", "approval boundary", "tenant guard", "audit write verification"],
    },
    {
      capability: "OpenAI draft generation",
      status: "blocked",
      unblockRequires: ["generation policy", "prompt audit", "citation enforcement", "human approval"],
    },
    {
      capability: "auth sessions and JWTs",
      status: "blocked",
      unblockRequires: ["provider decision", "session design approval", "secret management plan"],
    },
  ]
}

