export type LogLevel = "debug" | "info" | "warn" | "error" | "critical"

export type ObservabilityEventCategory =
  | "audit"
  | "operator"
  | "governance"
  | "mission-lifecycle"
  | "campaign"
  | "review"
  | "approval"
  | "error"
  | "security"

export type LoggingEventContract = {
  category: ObservabilityEventCategory
  eventName: string
  level: LogLevel
  requiredFields: string[]
  recommendedFields: string[]
  persistenceRequired: false
  notes: string[]
}

export const LOG_LEVELS: Array<{
  level: LogLevel
  description: string
  productionUse: string
}> = [
  {
    level: "debug",
    description: "Developer diagnostic detail.",
    productionUse: "Disabled or sampled unless investigating an incident.",
  },
  {
    level: "info",
    description: "Normal lifecycle or readiness events.",
    productionUse: "Allowed for low-volume system lifecycle events.",
  },
  {
    level: "warn",
    description: "Recoverable issue or missing readiness guard.",
    productionUse: "Should be visible in release confidence dashboards.",
  },
  {
    level: "error",
    description: "Failed operation or blocked route guard.",
    productionUse: "Must be captured by monitoring when persistence is added.",
  },
  {
    level: "critical",
    description: "Governance, tenant, approval, or security boundary risk.",
    productionUse: "Must page an operator before execution controls exist.",
  },
]

export const LOGGING_EVENT_CONTRACTS: LoggingEventContract[] = [
  event("audit", "audit.record.created", "info", [
    "eventId",
    "actorId",
    "eventType",
    "targetType",
    "timestamp",
  ]),
  event("operator", "operator.intent.previewed", "info", [
    "actorId",
    "actionId",
    "source",
    "safetyFlags",
  ]),
  event("operator", "operator.intent.package.created", "warn", [
    "actorId",
    "actionId",
    "authorizationRequestId",
    "explicitCreateIntent",
  ]),
  event("governance", "governance.decision.required", "warn", [
    "requestId",
    "decision",
    "riskScore",
    "approvalRequired",
  ]),
  event("mission-lifecycle", "mission.state.transition.previewed", "info", [
    "missionId",
    "from",
    "to",
    "valid",
  ]),
  event("campaign", "campaign.preview.generated", "info", [
    "campaignId",
    "missionId",
    "assetCount",
    "readiness",
  ]),
  event("review", "review.queue.item.created", "warn", [
    "reviewItemId",
    "reason",
    "risk",
    "source",
  ]),
  event("approval", "approval.package.created", "warn", [
    "authorizationRequestId",
    "requestedBy",
    "riskLevel",
    "status",
  ]),
  event("error", "route.guard.blocked", "error", [
    "route",
    "method",
    "reason",
    "actorId",
  ]),
  event("security", "security.rate_limit.threshold", "critical", [
    "route",
    "actorId",
    "policyId",
    "threshold",
  ]),
]

export function listLoggingContracts() {
  return LOGGING_EVENT_CONTRACTS
}

export function summarizeLoggingContracts() {
  return {
    levels: LOG_LEVELS.length,
    events: LOGGING_EVENT_CONTRACTS.length,
    categories: Array.from(
      new Set(LOGGING_EVENT_CONTRACTS.map((contract) => contract.category))
    ).length,
    persistenceRequired: false,
  }
}

function event(
  category: ObservabilityEventCategory,
  eventName: string,
  level: LogLevel,
  requiredFields: string[],
  recommendedFields: string[] = ["organizationId", "workspaceId", "correlationId"],
  notes: string[] = []
): LoggingEventContract {
  return {
    category,
    eventName,
    level,
    requiredFields,
    recommendedFields,
    persistenceRequired: false,
    notes,
  }
}
