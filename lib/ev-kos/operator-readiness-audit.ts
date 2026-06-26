export type OperatorExecutionReadiness = "READY" | "PARTIAL" | "BLOCKED"

export type RouteAuditStatus = "PASS" | "WARNING" | "BLOCKER"

export type OperatorRouteAuditResult = {
  route: string
  area: string
  methods: string[]
  status: RouteAuditStatus
  score: number
  readOnlyDefault: boolean
  writesToPrisma: boolean
  openAiCalls: boolean
  publishingOrSocialPosting: boolean
  graphWritesOrDeletes: boolean
  approvalBypassRisk: boolean
  safetyFlagsPresent: boolean
  readinessFlagsPresent: boolean
  docsPresent: boolean
  routeGuardNotes: string[]
  findings: string[]
}

export type OperatorReadinessAudit = {
  ok: true
  readOnly: true
  writesToPrisma: false
  execution: false
  openAiCalls: false
  graphWrites: false
  graphDeletes: false
  publishing: false
  socialPosting: false
  automaticApprovals: false
  overallReadinessScore: number
  executionReadiness: OperatorExecutionReadiness
  routeAuditResults: OperatorRouteAuditResult[]
  safetyFindings: string[]
  productionBlockers: string[]
  recommendedFixes: string[]
}

const routeAuditResults: OperatorRouteAuditResult[] = [
  route({
    route: "/api/ev-kos/operator-dashboard",
    area: "operator-dashboard",
    methods: ["GET"],
    score: 94,
    safetyFlagsPresent: true,
    readinessFlagsPresent: true,
    docsPresent: true,
    routeGuardNotes: ["GET-only read-only summary route."],
  }),
  route({
    route: "/api/ev-kos/operator-actions",
    area: "operator-actions",
    methods: ["GET"],
    score: 94,
    safetyFlagsPresent: true,
    readinessFlagsPresent: true,
    docsPresent: false,
    routeGuardNotes: ["GET-only action registry and preview dashboard."],
    findings: ["Dedicated Phase 7B architecture note has not been created."],
  }),
  route({
    route: "/api/ev-kos/operator-actions/preview",
    area: "operator-action-preview",
    methods: ["GET", "POST"],
    score: 84,
    safetyFlagsPresent: true,
    readinessFlagsPresent: true,
    docsPresent: false,
    routeGuardNotes: [
      "POST parses operator preview input but returns preview only.",
      "No execution or persistence path is exposed.",
    ],
    findings: [
      "POST preview should gain operator authentication and audit logging before any execution controls are added.",
    ],
  }),
  route({
    route: "/api/ontology/system-readiness",
    area: "system-readiness",
    methods: ["GET"],
    score: 90,
    safetyFlagsPresent: true,
    readinessFlagsPresent: true,
    docsPresent: true,
    routeGuardNotes: ["GET-only system readiness summary."],
  }),
  route({
    route: "/api/research/missions",
    area: "research-missions",
    methods: ["GET", "POST"],
    score: 82,
    safetyFlagsPresent: true,
    readinessFlagsPresent: true,
    docsPresent: true,
    routeGuardNotes: [
      "POST is dry-run only and blocks dryRun=false.",
      "No source collection or mission execution occurs.",
    ],
    findings: [
      "Needs operator authentication, request audit, and mission authorization policy before execution.",
    ],
  }),
  route({
    route: "/api/research/missions/discover",
    area: "research-missions",
    methods: ["GET", "POST"],
    score: 82,
    safetyFlagsPresent: true,
    readinessFlagsPresent: true,
    docsPresent: true,
    routeGuardNotes: [
      "POST is dry-run topic scoring only.",
      "Live trend collection remains blocked.",
    ],
    findings: [
      "Live external trend collection must remain behind a separate approval and connector policy.",
    ],
  }),
  route({
    route: "/api/research/missions/readiness",
    area: "research-missions",
    methods: ["GET"],
    score: 92,
    safetyFlagsPresent: true,
    readinessFlagsPresent: true,
    docsPresent: true,
    routeGuardNotes: ["GET-only mission readiness summary."],
  }),
  route({
    route: "/api/content/orchestrator",
    area: "content-orchestration",
    methods: ["GET", "POST"],
    score: 82,
    safetyFlagsPresent: true,
    readinessFlagsPresent: true,
    docsPresent: true,
    routeGuardNotes: [
      "POST remains planning-only and blocks publish, socialPosting, and approve requests.",
    ],
    findings: [
      "Operator-level POST guard should require explicit preview intent before production exposure.",
    ],
  }),
  route({
    route: "/api/content/campaigns",
    area: "content-orchestration",
    methods: ["GET"],
    score: 94,
    safetyFlagsPresent: true,
    readinessFlagsPresent: true,
    docsPresent: true,
    routeGuardNotes: ["GET-only campaign dashboard route."],
  }),
  route({
    route: "/api/content/draft-preview",
    area: "draft-preview",
    methods: ["GET"],
    score: 96,
    safetyFlagsPresent: true,
    readinessFlagsPresent: true,
    docsPresent: true,
    routeGuardNotes: ["GET-only governed draft preview packets."],
  }),
  route({
    route: "/api/content/campaign-preview",
    area: "draft-preview",
    methods: ["GET"],
    score: 96,
    safetyFlagsPresent: true,
    readinessFlagsPresent: true,
    docsPresent: true,
    routeGuardNotes: ["GET-only campaign preview summary."],
  }),
  route({
    route: "/api/ontology/graph-write-readiness",
    area: "graph-readiness",
    methods: ["GET"],
    score: 88,
    safetyFlagsPresent: true,
    readinessFlagsPresent: true,
    docsPresent: true,
    routeGuardNotes: [
      "GET builds a dry-run readiness flow and transaction preview only.",
    ],
    findings: [
      "Uses an approval-shaped preview object; production execution needs persisted reviewer decision validation.",
    ],
  }),
  route({
    route: "/api/ontology/ingestion-review-queue",
    area: "review-queue",
    methods: ["GET"],
    score: 94,
    safetyFlagsPresent: true,
    readinessFlagsPresent: true,
    docsPresent: true,
    routeGuardNotes: ["GET-only review queue preview."],
  }),
  route({
    route: "/api/ontology/ingestion-review-queue/create-package",
    area: "review-packages",
    methods: ["GET", "POST"],
    score: 72,
    readOnlyDefault: true,
    writesToPrisma: true,
    safetyFlagsPresent: true,
    readinessFlagsPresent: true,
    docsPresent: true,
    routeGuardNotes: [
      "GET is preview-only.",
      "POST can create ExecutionAuthorizationRequest packages only behind explicitCreatePackage.",
      "POST does not create graph records, graph nodes, graph edges, publications, or approvals.",
    ],
    findings: [
      "Existing controlled package creation is the only audited route with database writes.",
      "Production operator surface should not expose this POST until auth, audit review, and rate limits are explicit.",
    ],
  }),
]

export function buildOperatorReadinessAudit(): OperatorReadinessAudit {
  const productionBlockers = [
    "Operator authentication and permission source are not integrated into the preview routes.",
    "Operator action previews are not yet persisted to an audit trail.",
    "Controlled review package POST writes exist and should remain separate from the operator dashboard until protected by production auth and audit policy.",
    "Execution controls must remain blocked until per-action execution contracts, rollback plans, and approval handoff are documented.",
  ]
  const safetyFindings = buildSafetyFindings(routeAuditResults)
  const recommendedFixes = [
    "Add a Phase 7D operator intent/audit contract before introducing any execution buttons.",
    "Require explicit preview intent and actor identity for all POST preview routes.",
    "Add production route guard notes near each operator-adjacent POST route.",
    "Keep review package creation isolated from the operator dashboard until auth and audit controls are verified.",
    "Add automated guardrail tests for false safety flags and blocked execution paths.",
  ]
  const overallReadinessScore = Math.round(
    routeAuditResults.reduce((sum, item) => sum + item.score, 0) /
      routeAuditResults.length
  )

  return {
    ok: true,
    readOnly: true,
    writesToPrisma: false,
    execution: false,
    openAiCalls: false,
    graphWrites: false,
    graphDeletes: false,
    publishing: false,
    socialPosting: false,
    automaticApprovals: false,
    overallReadinessScore,
    executionReadiness: productionBlockers.length > 0 ? "BLOCKED" : "READY",
    routeAuditResults,
    safetyFindings,
    productionBlockers,
    recommendedFixes,
  }
}

function route(
  input: Partial<OperatorRouteAuditResult> &
    Pick<
      OperatorRouteAuditResult,
      | "route"
      | "area"
      | "methods"
      | "score"
      | "safetyFlagsPresent"
      | "readinessFlagsPresent"
      | "docsPresent"
      | "routeGuardNotes"
    >
): OperatorRouteAuditResult {
  const writesToPrisma = input.writesToPrisma ?? false
  const riskFlags = [
    writesToPrisma,
    input.openAiCalls ?? false,
    input.publishingOrSocialPosting ?? false,
    input.graphWritesOrDeletes ?? false,
    input.approvalBypassRisk ?? false,
    !input.safetyFlagsPresent,
    !input.readinessFlagsPresent,
    !input.docsPresent,
  ]
  const status: RouteAuditStatus =
    riskFlags.some(Boolean) || input.methods.includes("POST")
      ? writesToPrisma
        ? "BLOCKER"
        : "WARNING"
      : "PASS"

  return {
    readOnlyDefault: input.readOnlyDefault ?? true,
    writesToPrisma,
    openAiCalls: input.openAiCalls ?? false,
    publishingOrSocialPosting: input.publishingOrSocialPosting ?? false,
    graphWritesOrDeletes: input.graphWritesOrDeletes ?? false,
    approvalBypassRisk: input.approvalBypassRisk ?? false,
    findings: input.findings ?? [],
    ...input,
    status,
  }
}

function buildSafetyFindings(results: OperatorRouteAuditResult[]) {
  const findings = [
    "No audited operator route calls OpenAI.",
    "No audited operator route publishes or posts to social platforms.",
    "No audited operator route performs graph writes or graph deletes.",
    "Operator actions remain preview-only and do not execute.",
  ]

  if (results.some((result) => result.writesToPrisma)) {
    findings.push(
      "One audited review package route can write ExecutionAuthorizationRequest records behind explicitCreatePackage; it is not exposed as an operator execution control."
    )
  }

  if (results.some((result) => result.methods.includes("POST"))) {
    findings.push(
      "Several routes accept POST for preview or controlled package creation; production operator execution must wait for auth and audit hardening."
    )
  }

  return findings
}
