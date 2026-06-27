import { buildEnterpriseRouteGuards } from "./route-guard-model"

export type EnterpriseRouteCoverageArea = {
  id: string
  name: string
  routePatterns: string[]
  guarded: boolean
  coverage: number
  notes: string
}

export function buildRouteCoverageAreas(): EnterpriseRouteCoverageArea[] {
  const guards = buildEnterpriseRouteGuards()
  const guardedPatterns = new Set(guards.map((guard) => guard.routePattern))

  return [
    {
      id: "coverage-enterprise-beta",
      name: "Enterprise Beta APIs",
      routePatterns: ["/api/enterprise-beta/*"],
      guarded: guardedPatterns.has("/api/enterprise-beta/*"),
      coverage: 90,
      notes: "New Enterprise Beta routes have explicit report-only guard models.",
    },
    {
      id: "coverage-operator",
      name: "Operator APIs",
      routePatterns: ["/api/ev-kos/operator-*"],
      guarded: guardedPatterns.has("/api/ev-kos/operator-*"),
      coverage: 82,
      notes: "Operator preview and intent routes require future tenant-scoped permission checks.",
    },
    {
      id: "coverage-ontology",
      name: "Ontology and graph readiness APIs",
      routePatterns: ["/api/ontology/*", "/api/knowledge-graph/*"],
      guarded: true,
      coverage: 78,
      notes: "Graph write paths remain gated; route enforcement is still future work.",
    },
    {
      id: "coverage-content",
      name: "Content and publishing APIs",
      routePatterns: ["/api/content/*", "/api/publishing/*", "/api/social/*"],
      guarded: true,
      coverage: 70,
      notes: "Publishing surfaces need high-risk route guard enforcement before runtime enablement.",
    },
    {
      id: "coverage-research",
      name: "Research mission APIs",
      routePatterns: ["/api/research/*"],
      guarded: false,
      coverage: 64,
      notes: "Research route guard requirements are identified but not yet modeled per route.",
    },
  ]
}

export function evaluateRouteCoverage(
  areas: EnterpriseRouteCoverageArea[] = buildRouteCoverageAreas()
) {
  const coverage = Math.round(
    areas.reduce((sum, area) => sum + area.coverage, 0) / areas.length
  )

  return {
    score: coverage,
    status: "ROUTE_COVERAGE_MAPPED_NOT_ENFORCED" as const,
    areaCount: areas.length,
    guardedAreaCount: areas.filter((area) => area.guarded).length,
  }
}
