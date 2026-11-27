import { getMission, getMissionProgress } from "./research-registry"
import { getCreatorWorkspace } from "./creator-output-reader"
import { getMinistryWorkspace } from "./ministry-reader"
import type { ExecutiveConfidence, ExecutiveWorkspace } from "../executive-workspace/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function deriveConfidence(readinessScore: number): ExecutiveConfidence {
  if (readinessScore >= 85) {
    return "very-high"
  }
  if (readinessScore >= 65) {
    return "high"
  }
  if (readinessScore >= 45) {
    return "moderate"
  }
  return "low"
}

export async function getExecutiveWorkspace(slug: string): Promise<ExecutiveWorkspace | null> {
  const researchMission = await getMission(slug)
  const researchProgress = await getMissionProgress(slug)
  const creatorWorkspace = await getCreatorWorkspace(slug)
  const ministryWorkspace = await getMinistryWorkspace(slug)

  if (!researchMission || !researchProgress || !creatorWorkspace || !ministryWorkspace) {
    return null
  }

  const blockedCapabilities = [
    "Execution",
    "Publishing",
    "Persistence",
    "OpenAI",
    "Graph Writes",
    "Social Posting",
  ]

  const readinessRaw = Math.floor(
    researchMission.overallProgress * 0.4 +
      creatorWorkspace.progress * 0.3 +
      ministryWorkspace.progress * 0.3
  )
  const readinessPenalty = blockedCapabilities.length
  const readinessScore = clamp(readinessRaw - readinessPenalty, 0, 100)
  const confidence = deriveConfidence(readinessScore)

  const priorityList = [
    "Increase creator output depth from placeholder structures",
    "Convert top scripture references into teaching sequence",
    "Refine ministry lesson flow with cross-reference support",
    "Define executive gate for next build transition",
  ]

  const decisionQueue: ExecutiveWorkspace["decisionQueue"] = [
    {
      id: "decision-1",
      title: "Approve teaching sequence baseline",
      reason: "Ministry outputs include lesson-ready prompts",
      priority: "high",
      status: "ready",
    },
    {
      id: "decision-2",
      title: "Approve creator output expansion scope",
      reason: "Book and course outlines remain lightweight",
      priority: "medium",
      status: "queued",
    },
    {
      id: "decision-3",
      title: "Approve readiness threshold for next phase",
      reason: "Current blocked capabilities remain intentional",
      priority: "medium",
      status: "review",
    },
  ]

  const riskNotes: ExecutiveWorkspace["riskNotes"] = [
    {
      id: "risk-1",
      note: "Mission source coverage is strong in scripture, lighter in outlines",
      severity: "medium",
      mitigation: "Expand book, course, and series markdown assets",
    },
    {
      id: "risk-2",
      note: "Execution and publishing remain blocked by preview constraints",
      severity: "low",
      mitigation: "Keep explicit blocked-capability reporting in executive dashboard",
    },
  ]

  const nextRecommendedActions = [
    "Prioritize top 3 scripture-backed lessons for ministry",
    "Approve creator output structure for book and course",
    "Run executive readiness review against blocked capabilities",
    "Prepare handoff notes for future non-preview phase",
  ]

  const timeline: ExecutiveWorkspace["timeline"] = [
    { date: "2026-07-02", event: "Research mission created", status: "completed" },
    { date: "2026-07-04", event: "Creator and ministry dashboards completed", status: "completed" },
    { date: "2026-07-05", event: "Executive workspace synthesized", status: "in-progress" },
    { date: "2026-07-05", event: "Readiness and decision review queued", status: "planned" },
  ]

  return {
    id: slug,
    name: "Executive Workspace",
    executiveOverview:
      "Executive summary across research, creator, and ministry workspaces in read-only preview mode.",
    readinessScore,
    activeMissionCount: 1,
    priorityCount: priorityList.length,
    decisionCount: decisionQueue.length,
    researchProgress: researchMission.overallProgress,
    creatorOutputProgress: creatorWorkspace.progress,
    ministryOutputProgress: ministryWorkspace.progress,
    status: "active",
    priorityList,
    decisionQueue,
    riskNotes,
    blockedCapabilities,
    nextRecommendedActions,
    timeline,
    relatedWorkspaces: [
      { name: "Research Workspace", route: `/research-workspace/${slug}`, status: "active" },
      { name: "Creator Workspace", route: `/creator-workspace/${slug}`, status: "active" },
      { name: "Ministry Workspace", route: `/ministry-workspace/${slug}`, status: "active" },
    ],
    activeMissions: [
      {
        id: slug,
        title: researchMission.name,
        status: researchMission.status,
        researchProgress: researchMission.overallProgress,
        creatorProgress: creatorWorkspace.progress,
        ministryProgress: ministryWorkspace.progress,
        confidence,
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
