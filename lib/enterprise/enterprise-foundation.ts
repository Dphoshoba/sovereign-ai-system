import {
  buildEnterpriseBlockedCapabilities,
  buildEnterpriseGovernancePolicies,
} from "./enterprise-governance-contract"
import {
  buildEnterpriseDataBoundaries,
  buildEnterpriseTenantScope,
} from "./tenant-boundary"

export type EnterpriseAlphaPhase = {
  phase: "EA-1"
  name: "Enterprise Foundations"
  status: "planning-contracts-only"
  mission: string
  nonGoals: string[]
}

export type EnterpriseFoundationPlan = {
  ok: true
  readOnly: true
  planningOnly: true
  writesToPrisma: false
  schemaChanges: false
  migrations: false
  execution: false
  publishing: false
  graphWrites: false
  graphDeletes: false
  openAiCalls: false
  authIntegration: false
  sessions: false
  jwt: false
  phase: EnterpriseAlphaPhase
  enterpriseLayers: string[]
  tenantScope: ReturnType<typeof buildEnterpriseTenantScope>
  dataBoundaries: ReturnType<typeof buildEnterpriseDataBoundaries>
  governancePolicies: ReturnType<typeof buildEnterpriseGovernancePolicies>
  blockedCapabilities: ReturnType<typeof buildEnterpriseBlockedCapabilities>
  recommendedNextSteps: string[]
}

export function buildEnterpriseFoundationPlan(): EnterpriseFoundationPlan {
  return {
    ok: true,
    readOnly: true,
    planningOnly: true,
    writesToPrisma: false,
    schemaChanges: false,
    migrations: false,
    execution: false,
    publishing: false,
    graphWrites: false,
    graphDeletes: false,
    openAiCalls: false,
    authIntegration: false,
    sessions: false,
    jwt: false,
    phase: {
      phase: "EA-1",
      name: "Enterprise Foundations",
      status: "planning-contracts-only",
      mission:
        "Define enterprise tenant, governance, data boundary, and readiness contracts without enabling execution.",
      nonGoals: [
        "No execution",
        "No publishing",
        "No auth integration",
        "No Prisma migrations",
        "No schema changes",
        "No OpenAI calls",
        "No graph writes",
      ],
    },
    enterpriseLayers: [
      "tenant boundary",
      "operator identity contract",
      "role and permission contract",
      "governance gate contract",
      "data boundary contract",
      "readiness and risk reporting",
      "future enterprise rollout plan",
    ],
    tenantScope: buildEnterpriseTenantScope(),
    dataBoundaries: buildEnterpriseDataBoundaries(),
    governancePolicies: buildEnterpriseGovernancePolicies(),
    blockedCapabilities: buildEnterpriseBlockedCapabilities(),
    recommendedNextSteps: [
      "Audit legacy enterprise-governance write routes before reusing them.",
      "Define tenant isolation guard prototypes in report-only mode.",
      "Map existing OrganizationWorkspace and OrganizationMember models to enterprise contracts without schema changes.",
      "Define enterprise audit event taxonomy before adding persistence.",
      "Keep all enterprise execution controls blocked until auth, authorization, rate limits, and approval workflows are enforced.",
    ],
  }
}

