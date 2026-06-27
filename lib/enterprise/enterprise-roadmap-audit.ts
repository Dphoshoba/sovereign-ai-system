export type EnterpriseRoadmapItem = {
  id: string
  milestone: "EA-9" | "Enterprise Beta" | "Production"
  title: string
  dependsOn: string[]
  readiness: number
}

export function buildEnterpriseRoadmapAudit(): EnterpriseRoadmapItem[] {
  return [
    {
      id: "roadmap-alpha-merge-audit",
      milestone: "EA-9",
      title: "Prepare enterprise-alpha merge review and compatibility checklist.",
      dependsOn: ["EA-8 closure audit", "final build and smoke verification"],
      readiness: 92,
    },
    {
      id: "roadmap-auth-enforcement",
      milestone: "Enterprise Beta",
      title: "Implement selected auth provider and tenant-aware route guards.",
      dependsOn: ["RC-6 provider decision", "operator security checklist"],
      readiness: 64,
    },
    {
      id: "roadmap-audit-persistence",
      milestone: "Enterprise Beta",
      title: "Persist enterprise audit evidence and approval decisions.",
      dependsOn: ["audit model mapping", "retention policy"],
      readiness: 70,
    },
    {
      id: "roadmap-ci-release-gates",
      milestone: "Production",
      title: "Wire release gates into CI, branch protection, and deployment readiness.",
      dependsOn: ["deployment environment policy", "observability checks"],
      readiness: 68,
    },
  ]
}

export function evaluateEnterpriseRoadmapCoverage(
  roadmap: EnterpriseRoadmapItem[] = buildEnterpriseRoadmapAudit()
) {
  const score = Math.round(
    roadmap.reduce((sum, item) => sum + item.readiness, 0) / roadmap.length
  )

  return {
    score,
    status: "ROADMAP_DEFINED_WITH_BETA_DEPENDENCIES" as const,
    itemCount: roadmap.length,
    nextMilestone: "EA-9",
  }
}
