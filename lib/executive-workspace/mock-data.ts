import type { ExecutiveWorkspace } from "./types"

export function getMockExecutiveWorkspace(): ExecutiveWorkspace {
  return {
    id: "womanhood",
    name: "Executive Workspace",
    executiveOverview:
      "Read-only executive summary of research, creator, and ministry progress for the active mission.",
    readinessScore: 58,
    activeMissionCount: 1,
    priorityCount: 4,
    decisionCount: 3,
    researchProgress: 62,
    creatorOutputProgress: 48,
    ministryOutputProgress: 47,
    status: "active",
    priorityList: [
      "Finalize teaching sequence from top discoveries",
      "Expand creator outlines into publish-ready structures",
      "Increase scripture-backed cross references",
      "Prepare executive review packet",
    ],
    decisionQueue: [
      {
        id: "decision-1",
        title: "Approve sermon sequence direction",
        reason: "Ministry output suggests a viable 4-part sequence",
        priority: "high",
        status: "ready",
      },
      {
        id: "decision-2",
        title: "Approve creator book architecture",
        reason: "Book outline is still placeholder level",
        priority: "medium",
        status: "queued",
      },
      {
        id: "decision-3",
        title: "Approve readiness gate",
        reason: "Execution remains blocked by design constraints",
        priority: "medium",
        status: "review",
      },
    ],
    riskNotes: [
      {
        id: "risk-1",
        note: "Source content depth is uneven across output files",
        severity: "medium",
        mitigation: "Expand mission markdown sections incrementally",
      },
    ],
    blockedCapabilities: ["Execution", "Publishing", "Persistence", "OpenAI", "Graph Writes"],
    nextRecommendedActions: [
      "Prioritize scripture-linked lesson expansion",
      "Approve top 3 creator outputs for refinement",
      "Lock executive readiness criteria for next phase",
    ],
    timeline: [
      { date: "2026-07-02", event: "Research mission created", status: "completed" },
      { date: "2026-07-04", event: "Cross-workspace synthesis started", status: "in-progress" },
      { date: "2026-07-05", event: "Executive workspace preview generated", status: "planned" },
    ],
    relatedWorkspaces: [
      { name: "Research Workspace", route: "/research-workspace/womanhood", status: "active" },
      { name: "Creator Workspace", route: "/creator-workspace/womanhood", status: "active" },
      { name: "Ministry Workspace", route: "/ministry-workspace/womanhood", status: "active" },
    ],
    activeMissions: [
      {
        id: "womanhood",
        title: "Research Mission 001 — Womanhood",
        status: "active",
        researchProgress: 62,
        creatorProgress: 48,
        ministryProgress: 47,
        confidence: "high",
      },
    ],
    readOnly: true,
    previewOnly: true,
    noAuth: true,
    noSessions: true,
    noJwt: true,
    noDatabase: true,
    noExecution: true,
    noPublishing: true,
    noOpenAI: true,
    noGraphWrites: true,
    noSocialPosting: true,
  }
}
