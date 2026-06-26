import { buildEnvironmentAudit } from "./environment-audit"

export type SecurityAuditStatus = "PASS" | "WARNING" | "BLOCKER"

export type SecurityControlAudit = {
  category:
    | "authentication"
    | "authorization"
    | "tenant-isolation"
    | "secret-handling"
    | "request-validation"
    | "audit-logging"
    | "rate-limiting"
    | "governance"
  score: number
  status: SecurityAuditStatus
  summary: string
  findings: string[]
  recommendedFixes: string[]
}

export type SecurityAudit = {
  ok: true
  readOnly: true
  writesToPrisma: false
  actionExecution: false
  openAiCalls: false
  graphWrites: false
  graphDeletes: false
  publishing: false
  socialPosting: false
  automaticApprovals: false
  securityScore: number
  status: SecurityAuditStatus
  controls: SecurityControlAudit[]
  highestRiskFindings: string[]
  releaseBlockers: string[]
  recommendedFixes: string[]
}

export function buildSecurityAudit(): SecurityAudit {
  const environment = buildEnvironmentAudit()
  const controls: SecurityControlAudit[] = [
    control({
      category: "authentication",
      score: 62,
      summary: "Operator/admin/API authentication must be made explicit before production execution controls.",
      findings: [
        "Operator preview routes expose safe read-only or package-only behavior, but production auth is not yet the canonical gate.",
      ],
      recommendedFixes: [
        "Add a single operator authentication source before enabling action execution.",
        "Require authenticated actor identity on all operator-adjacent POST routes.",
      ],
    }),
    control({
      category: "authorization",
      score: 66,
      summary: "Permission and role models are described but not yet enforced uniformly across operator actions.",
      findings: [
        "Operator action registry lists required permissions, but preview routes do not enforce a production permission provider.",
      ],
      recommendedFixes: [
        "Bind operator action permissions to a production role provider.",
        "Block execution controls until authorization failures are tested.",
      ],
    }),
    control({
      category: "tenant-isolation",
      score: 72,
      summary: "Tenant fields are required by graph write gates, but platform-wide route isolation still needs audit coverage.",
      findings: [
        "Graph writes require organizationId and workspaceId, but older admin routes may not share a unified tenant guard.",
      ],
      recommendedFixes: [
        "Create a tenant guard checklist for every mutating admin/API route.",
        "Add automated tests for missing organization/workspace scope.",
      ],
    }),
    control({
      category: "secret-handling",
      score: environment.environmentScore,
      summary: "Secrets are checked by presence only and never returned by audit routes.",
      findings: environment.releaseBlockers,
      recommendedFixes: environment.recommendedFixes,
    }),
    control({
      category: "request-validation",
      score: 78,
      summary: "Recent governed routes validate explicit intent flags; legacy routes need broader validation inventory.",
      findings: [
        "Controlled package and transaction routes have explicit gates, but older routes should be reviewed for shared schema validation.",
      ],
      recommendedFixes: [
        "Adopt shared request validation helpers for mutating routes.",
        "Add negative tests for missing explicit intent flags.",
      ],
    }),
    control({
      category: "audit-logging",
      score: 76,
      summary: "Intent and approval package contracts exist; production-wide audit persistence remains incomplete.",
      findings: [
        "Operator intent packages can be persisted, but preview-only actions are not yet universally logged.",
      ],
      recommendedFixes: [
        "Persist operator intent for every future execution request.",
        "Add immutable audit records for approval handoff and execution outcomes.",
      ],
    }),
    control({
      category: "rate-limiting",
      score: 55,
      summary: "Rate-limit policy is not yet a first-class production gate.",
      findings: [
        "No shared rate-limit contract was found for operator, research, graph, or content POST routes.",
      ],
      recommendedFixes: [
        "Add route-level rate-limit requirements before exposing production POST controls.",
        "Prioritize package creation, graph transaction, and generation routes.",
      ],
    }),
    control({
      category: "governance",
      score: 88,
      summary: "Graph writes, approvals, publishing, and operator actions remain gated by design.",
      findings: [
        "No RC-1 audit route introduces execution, OpenAI calls, publishing, graph writes, graph deletes, or automatic approvals.",
      ],
      recommendedFixes: [
        "Keep explicit-test-write restricted until the production approval handoff is complete.",
        "Add guardrail tests that assert safety flags stay false on preview routes.",
      ],
    }),
  ]

  const securityScore = Math.round(
    controls.reduce((sum, item) => sum + item.score, 0) / controls.length
  )
  const releaseBlockers = [
    "Production operator authentication and authorization are not yet the canonical gate.",
    "Rate limiting is not yet defined for operator-adjacent POST routes.",
    ...environment.releaseBlockers,
  ]

  return {
    ok: true,
    readOnly: true,
    writesToPrisma: false,
    actionExecution: false,
    openAiCalls: false,
    graphWrites: false,
    graphDeletes: false,
    publishing: false,
    socialPosting: false,
    automaticApprovals: false,
    securityScore,
    status: releaseBlockers.length > 0 ? "BLOCKER" : "WARNING",
    controls,
    highestRiskFindings: controls.flatMap((item) => item.findings).slice(0, 10),
    releaseBlockers,
    recommendedFixes: [
      "Implement canonical operator authentication.",
      "Implement per-action authorization checks.",
      "Add shared rate limiting for all operator-adjacent POST routes.",
      "Add automated guardrail tests for no execution, no publishing, no graph writes, and no automatic approvals.",
    ],
  }
}

function control(
  input: Omit<SecurityControlAudit, "status">
): SecurityControlAudit {
  return {
    ...input,
    status:
      input.score < 65
        ? "BLOCKER"
        : input.score < 85 || input.findings.length > 0
          ? "WARNING"
          : "PASS",
  }
}
