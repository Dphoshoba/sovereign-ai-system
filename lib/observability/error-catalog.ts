export type ErrorSeverity = "low" | "medium" | "high" | "critical"

export type ObservabilityErrorCode =
  | "AUTH_PROVIDER_NOT_INTEGRATED"
  | "AUTHORIZATION_NOT_ENFORCED"
  | "RATE_LIMIT_NOT_ENFORCED"
  | "STARTUP_VALIDATION_REPORT_ONLY"
  | "OPERATOR_ACTION_EXECUTION_BLOCKED"
  | "GRAPH_WRITE_GATE_REQUIRED"
  | "PUBLISHING_GATE_REQUIRED"
  | "OPENAI_GENERATION_BLOCKED"
  | "APPROVAL_REQUIRED"
  | "AUDIT_PERSISTENCE_INCOMPLETE"

export type ErrorCatalogEntry = {
  code: ObservabilityErrorCode
  severity: ErrorSeverity
  area:
    | "security"
    | "operator"
    | "governance"
    | "graph"
    | "publishing"
    | "ai"
    | "observability"
  message: string
  recommendedAction: string
  releaseImpact: "none" | "warning" | "blocker"
}

export const ERROR_CATALOG: ErrorCatalogEntry[] = [
  entry("AUTH_PROVIDER_NOT_INTEGRATED", "critical", "security", "No production authentication provider is integrated.", "Select and integrate the approved provider in a later RC.", "blocker"),
  entry("AUTHORIZATION_NOT_ENFORCED", "critical", "security", "Role and permission contracts are defined but not enforced.", "Bind authenticated identities to operator roles and route guards.", "blocker"),
  entry("RATE_LIMIT_NOT_ENFORCED", "high", "security", "Rate-limit policies are defined but not enforced.", "Add middleware or route guard enforcement after approval.", "blocker"),
  entry("STARTUP_VALIDATION_REPORT_ONLY", "medium", "observability", "Startup validation reports readiness but does not block boot.", "Enable boot enforcement after Vercel environment parity is verified.", "warning"),
  entry("OPERATOR_ACTION_EXECUTION_BLOCKED", "medium", "operator", "Operator actions remain preview-only.", "Keep execution blocked until auth, rate limits, audit, and approvals are enforced.", "warning"),
  entry("GRAPH_WRITE_GATE_REQUIRED", "critical", "graph", "Graph writes require explicit test-write and governance gates.", "Do not broaden graph ingestion until approval handoff and audit persistence are complete.", "blocker"),
  entry("PUBLISHING_GATE_REQUIRED", "critical", "publishing", "Publishing must remain behind human approval.", "Do not expose publish controls until publication approval and rollback plans are verified.", "blocker"),
  entry("OPENAI_GENERATION_BLOCKED", "high", "ai", "AI generation must remain governed and unavailable from RC-3 observability.", "Keep observability routes free of model calls.", "warning"),
  entry("APPROVAL_REQUIRED", "high", "governance", "Risky actions require explicit approval.", "Persist approval decisions before enabling execution.", "blocker"),
  entry("AUDIT_PERSISTENCE_INCOMPLETE", "high", "observability", "Logging contracts exist but universal persistence is not implemented.", "Add persistent log/audit transport in a later RC.", "warning"),
]

export function listErrorCatalog() {
  return ERROR_CATALOG
}

export function summarizeErrorCatalog() {
  return {
    total: ERROR_CATALOG.length,
    blockers: ERROR_CATALOG.filter((entryItem) => entryItem.releaseImpact === "blocker").length,
    critical: ERROR_CATALOG.filter((entryItem) => entryItem.severity === "critical").length,
    high: ERROR_CATALOG.filter((entryItem) => entryItem.severity === "high").length,
  }
}

function entry(
  code: ObservabilityErrorCode,
  severity: ErrorSeverity,
  area: ErrorCatalogEntry["area"],
  message: string,
  recommendedAction: string,
  releaseImpact: ErrorCatalogEntry["releaseImpact"]
): ErrorCatalogEntry {
  return {
    code,
    severity,
    area,
    message,
    recommendedAction,
    releaseImpact,
  }
}
