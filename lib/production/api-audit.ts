export type ApiAuditStatus = "PASS" | "WARNING" | "BLOCKER"

export type ApiRouteAudit = {
  route: string
  area: string
  methods: string[]
  readOnlyDefault: boolean
  responseConsistency: boolean
  errorConsistency: boolean
  safetyFlagsPresent: boolean
  versionReady: boolean
  score: number
  status: ApiAuditStatus
  findings: string[]
}

export type ApiAudit = {
  ok: true
  readOnly: true
  writesToPrisma: false
  apiConsistencyScore: number
  status: ApiAuditStatus
  routes: ApiRouteAudit[]
  highestRiskFindings: string[]
  recommendedFixes: string[]
}

const routes: ApiRouteAudit[] = [
  route({
    route: "/api/health",
    area: "health",
    methods: ["GET"],
    score: 96,
  }),
  route({
    route: "/api/production/readiness",
    area: "production",
    methods: ["GET"],
    score: 94,
  }),
  route({
    route: "/api/ev-kos/operator-dashboard",
    area: "operator",
    methods: ["GET"],
    score: 94,
  }),
  route({
    route: "/api/ev-kos/operator-actions/preview",
    area: "operator",
    methods: ["GET", "POST"],
    score: 82,
    findings: [
      "POST is preview-only, but production auth and rate limits must be added before execution controls.",
    ],
  }),
  route({
    route: "/api/ev-kos/operator-intent",
    area: "operator",
    methods: ["GET", "POST"],
    score: 84,
    findings: [
      "POST can create pending operator intent packages only behind explicitCreateIntent.",
    ],
  }),
  route({
    route: "/api/ontology/ingestion-review-queue/create-package",
    area: "governance",
    methods: ["GET", "POST"],
    score: 74,
    readOnlyDefault: true,
    findings: [
      "Controlled POST creates pending ExecutionAuthorizationRequest review packages.",
      "This should remain isolated from production operator execution until auth, rate limits, and audit policy are enforced.",
    ],
  }),
  route({
    route: "/api/ontology/semantic-graph-transaction",
    area: "semantic-graph",
    methods: ["GET", "POST"],
    score: 78,
    findings: [
      "POST is blocked unless explicit-test-write and all transaction gates are satisfied.",
    ],
  }),
  route({
    route: "/api/content/draft-preview",
    area: "content",
    methods: ["GET"],
    score: 96,
  }),
  route({
    route: "/api/research/missions",
    area: "research",
    methods: ["GET", "POST"],
    score: 82,
    findings: [
      "Mission POST remains dry-run oriented and needs production operator auth before broader use.",
    ],
  }),
]

export function buildApiAudit(): ApiAudit {
  const apiConsistencyScore = Math.round(
    routes.reduce((sum, item) => sum + item.score, 0) / routes.length
  )
  const highestRiskFindings = routes.flatMap((item) => item.findings).slice(0, 8)

  return {
    ok: true,
    readOnly: true,
    writesToPrisma: false,
    apiConsistencyScore,
    status: routes.some((item) => item.status === "BLOCKER")
      ? "BLOCKER"
      : routes.some((item) => item.status === "WARNING")
        ? "WARNING"
        : "PASS",
    routes,
    highestRiskFindings,
    recommendedFixes: [
      "Add a shared production response envelope for operator and governance routes.",
      "Add explicit rate-limit policy before exposing POST routes in production.",
      "Add route-level authentication notes to every operator-adjacent POST route.",
      "Keep graph transaction POST restricted to explicit-test-write until governed production execution is approved.",
    ],
  }
}

function route(
  input: Omit<
    Partial<ApiRouteAudit>,
    "route" | "area" | "methods" | "score" | "status"
  > &
    Pick<ApiRouteAudit, "route" | "area" | "methods" | "score">
): ApiRouteAudit {
  const findings = input.findings ?? []
  const warning =
    input.methods.includes("POST") ||
    !input.responseConsistency ||
    !input.errorConsistency ||
    !input.safetyFlagsPresent ||
    !input.versionReady ||
    findings.length > 0

  return {
    readOnlyDefault: input.readOnlyDefault ?? true,
    responseConsistency: input.responseConsistency ?? true,
    errorConsistency: input.errorConsistency ?? true,
    safetyFlagsPresent: input.safetyFlagsPresent ?? true,
    versionReady: input.versionReady ?? false,
    findings,
    ...input,
    status: input.score < 70 ? "BLOCKER" : warning ? "WARNING" : "PASS",
  }
}
