export type RouteGuardStatus = "PASS" | "PARTIAL" | "BLOCKED"

export type RouteGuardAuditArea = {
  area: string
  routes: string[]
  guardCoverage: number
  approvalCoverage: number
  auditCoverage: number
  executionCoverage: number
  missingGuards: string[]
  recommendedGuards: string[]
  status: RouteGuardStatus
}

export type RouteGuardAudit = {
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
  guardCoverage: number
  approvalCoverage: number
  auditCoverage: number
  executionCoverage: number
  missingGuards: string[]
  recommendedGuards: string[]
  areas: RouteGuardAuditArea[]
}

const areas: RouteGuardAuditArea[] = [
  area("operator routes", ["/api/ev-kos/operator-dashboard", "/api/ev-kos/operator-actions", "/api/ev-kos/operator-actions/preview"], 74, 70, 64, 100, [
    "Production auth provider guard",
    "Rate-limit enforcement",
  ], [
    "Require authenticated operator identity on preview POST.",
    "Add per-action permission checks before execution controls.",
  ]),
  area("intent routes", ["/api/ev-kos/operator-intent"], 78, 76, 82, 100, [
    "Provider-backed actor validation",
    "Rate-limit enforcement",
  ], [
    "Bind explicitCreateIntent to authenticated actor identity.",
    "Persist immutable audit event for every intent request.",
  ]),
  area("mission routes", ["/api/research/missions", "/api/research/missions/discover", "/api/research/missions/readiness"], 70, 68, 58, 100, [
    "Mission authorization policy",
    "Rate-limit enforcement",
  ], [
    "Require operator:research:preview for dry-run mission POST.",
    "Keep live trend collection behind connector approval.",
  ]),
  area("content routes", ["/api/content/*"], 76, 72, 62, 100, [
    "Campaign operator identity",
    "Generation guard audit",
  ], [
    "Require operator:content:preview for orchestration POST.",
    "Keep generation and publishing blocked until approval handoff exists.",
  ]),
  area("ontology and graph routes", ["/api/ontology/*", "/api/knowledge-graph/*"], 82, 84, 76, 96, [
    "Production graph-write authorization",
    "Universal graph audit persistence",
  ], [
    "Keep explicit-test-write as the only graph write path.",
    "Add approval decision validation before broad ingestion.",
  ]),
  area("review and approval routes", ["/api/ontology/ingestion-review-queue/*", "/api/executive/action-approvals"], 74, 80, 78, 92, [
    "Reviewer identity binding",
    "Approval decision persistence coverage",
  ], [
    "Bind package creation to operator role and organization scope.",
    "Log reviewer decision outcomes when execution phases begin.",
  ]),
  area("production routes", ["/api/production/*"], 88, 86, 70, 100, [
    "Release dashboard audit transport",
  ], [
    "Keep production audit routes GET-only.",
    "Emit release confidence snapshots once logging persistence exists.",
  ]),
  area("security routes", ["/api/security/operator-readiness"], 84, 82, 68, 100, [
    "Security readiness snapshot persistence",
  ], [
    "Keep RC-2 security route report-only until enforcement is approved.",
  ]),
  area("publishing routes", ["/api/publishing/*", "/api/social/*", "/api/youtube/*"], 62, 68, 52, 72, [
    "Publication approval enforcement inventory",
    "Social posting guard audit",
    "Rollback plan registry",
  ], [
    "Audit publishing routes before exposing operator controls.",
    "Require explicit human approval and rollback metadata for publishing.",
  ]),
]

export function buildRouteGuardAudit(): RouteGuardAudit {
  const guardCoverage = average(areas.map((auditArea) => auditArea.guardCoverage))
  const approvalCoverage = average(areas.map((auditArea) => auditArea.approvalCoverage))
  const auditCoverage = average(areas.map((auditArea) => auditArea.auditCoverage))
  const executionCoverage = average(areas.map((auditArea) => auditArea.executionCoverage))

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
    guardCoverage,
    approvalCoverage,
    auditCoverage,
    executionCoverage,
    missingGuards: unique(areas.flatMap((auditArea) => auditArea.missingGuards)),
    recommendedGuards: unique(areas.flatMap((auditArea) => auditArea.recommendedGuards)),
    areas,
  }
}

function area(
  areaName: string,
  routes: string[],
  guardCoverage: number,
  approvalCoverage: number,
  auditCoverage: number,
  executionCoverage: number,
  missingGuards: string[],
  recommendedGuards: string[]
): RouteGuardAuditArea {
  const lowest = Math.min(
    guardCoverage,
    approvalCoverage,
    auditCoverage,
    executionCoverage
  )

  return {
    area: areaName,
    routes,
    guardCoverage,
    approvalCoverage,
    auditCoverage,
    executionCoverage,
    missingGuards,
    recommendedGuards,
    status: lowest < 65 ? "BLOCKED" : lowest < 85 ? "PARTIAL" : "PASS",
  }
}

function average(values: number[]) {
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

function unique(values: string[]) {
  return Array.from(new Set(values))
}
