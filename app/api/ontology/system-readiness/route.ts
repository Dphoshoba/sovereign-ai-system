import { NextResponse } from "next/server"

type SystemReadinessStatus = "READY" | "PARTIAL" | "BLOCKED"

type SystemReadinessSection = {
  name: string
  status: SystemReadinessStatus
  completion: number
  summary: string
  blocker?: string
}

const sections: SystemReadinessSection[] = [
  {
    name: "Research",
    status: "READY",
    completion: 100,
    summary: "Research pipeline, audit persistence, source fallback, and governance gates are in place.",
  },
  {
    name: "Ontology",
    status: "READY",
    completion: 100,
    summary: "Universal ontology contract supports current domain categories and graph-shaped extraction output.",
  },
  {
    name: "Adapter",
    status: "READY",
    completion: 100,
    summary: "Ontology outputs can be converted into semantic graph payloads without writes.",
  },
  {
    name: "Entity Resolution",
    status: "READY",
    completion: 95,
    summary: "Dry-run entity fingerprints, similarity scoring, duplicate, and conflict classification are available.",
  },
  {
    name: "Review Queue",
    status: "READY",
    completion: 95,
    summary: "Review items are generated for possible duplicates, blocked conflicts, and governance review cases.",
  },
  {
    name: "Review Packages",
    status: "READY",
    completion: 90,
    summary: "Pending ExecutionAuthorizationRequest packages can be created behind explicit package gates.",
  },
  {
    name: "Review Decision",
    status: "READY",
    completion: 90,
    summary: "Reviewer decisions can be prepared and validated without approving or executing writes automatically.",
  },
  {
    name: "Graph Readiness",
    status: "READY",
    completion: 85,
    summary: "Readiness checklist connects governance, review, tenant, audit, and executor preview gates.",
  },
  {
    name: "Transaction Executor",
    status: "PARTIAL",
    completion: 75,
    summary: "Guarded executor exists with dry-run default and explicit-test-write gate for controlled writes.",
  },
  {
    name: "Graph Write",
    status: "PARTIAL",
    completion: 45,
    summary: "Controlled graph write path exists, but broad ingestion remains blocked by design.",
    blocker: "Needs approved package handoff, duplicate-safe upsert, and audit persistence policy before expansion.",
  },
  {
    name: "Autonomous Research",
    status: "PARTIAL",
    completion: 40,
    summary: "Research foundation exists, but autonomous missions need scoped mission contracts and review gates.",
  },
  {
    name: "Learning",
    status: "PARTIAL",
    completion: 25,
    summary: "Feedback concepts exist, but no closed-loop optimization should run until graph governance matures.",
  },
  {
    name: "Reasoning",
    status: "PARTIAL",
    completion: 35,
    summary: "Reasoning and executive systems exist, but graph-backed reasoning needs canonical data quality guarantees.",
  },
  {
    name: "Publishing",
    status: "PARTIAL",
    completion: 55,
    summary: "Publishing surfaces exist, but ontology-to-multiformat generation remains downstream and review-bound.",
  },
]

export async function GET() {
  const overallCompletion = Math.round(
    sections.reduce((sum, section) => sum + section.completion, 0) /
      sections.length
  )

  return NextResponse.json({
    ok: true,
    readOnly: true,
    writesToPrisma: false,
    graphWrites: false,
    automaticApproval: false,
    automaticPublishing: false,
    overallStatus:
      sections.some((section) => section.status === "BLOCKED")
        ? "BLOCKED"
        : sections.every((section) => section.status === "READY")
          ? "READY"
          : "PARTIAL",
    overallCompletion,
    sections,
    nextBoundary:
      "Do not enable autonomous graph ingestion until review package decisions, duplicate-safe upserts, audit persistence, and tenant validation are fully verified.",
  })
}
