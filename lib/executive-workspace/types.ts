export type ExecutiveConfidence = "low" | "moderate" | "high" | "very-high"

export type ExecutiveMissionSummary = {
  id: string
  title: string
  status: string
  researchProgress: number
  creatorProgress: number
  ministryProgress: number
  confidence: ExecutiveConfidence
}

export type ExecutiveDecision = {
  id: string
  title: string
  reason: string
  priority: "high" | "medium" | "low"
  status: "queued" | "ready" | "review"
}

export type ExecutiveRiskNote = {
  id: string
  note: string
  severity: "high" | "medium" | "low"
  mitigation: string
}

export type ExecutiveWorkspace = {
  id: string
  name: string
  executiveOverview: string
  readinessScore: number
  activeMissionCount: number
  priorityCount: number
  decisionCount: number
  researchProgress: number
  creatorOutputProgress: number
  ministryOutputProgress: number
  status: "active" | "reviewing" | "planned"
  priorityList: string[]
  decisionQueue: ExecutiveDecision[]
  riskNotes: ExecutiveRiskNote[]
  blockedCapabilities: string[]
  nextRecommendedActions: string[]
  timeline: Array<{
    date: string
    event: string
    status: "completed" | "in-progress" | "planned"
  }>
  relatedWorkspaces: Array<{
    name: string
    route: string
    status: string
  }>
  activeMissions: ExecutiveMissionSummary[]
  readOnly: true
  previewOnly: true
  noAuth: true
  noSessions: true
  noJwt: true
  noDatabase: true
  noExecution: true
  noPublishing: true
  noOpenAI: true
  noGraphWrites: true
  noSocialPosting: true
}
