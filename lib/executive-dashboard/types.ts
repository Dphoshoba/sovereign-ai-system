export type ExecutiveDashboardPriority = {
  title: string
  score: number
  rationale: string
}

export type ExecutiveDashboardRisk = {
  title: string
  severity: "high" | "medium" | "low"
  score: number
  mitigation: string
}

export type ExecutiveDashboardOpportunity = {
  title: string
  score: number
  value: string
  nextMove: string
}

export type ExecutiveDashboardDecision = {
  title: string
  workspace: string
  priority: "high" | "medium" | "low"
  rationale: string
}

export type ExecutiveDashboardRoadmapItem = {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export type MissionExecutiveDashboardWorkspace = {
  mission: string
  missionTitle: string
  executiveScore: number
  strategicAlignment: number
  knowledgeVelocity: number
  growthTrajectory: number
  decisionQuality: number
  missionRisk: number
  opportunityIndex: number
  capitalizationScore: number
  focusScore: number
  sustainabilityScore: number
  priorityCount: number
  decisionCount: number
  riskCount: number
  opportunityCount: number
  healthScore: number
  readinessScore: number
  executiveSummary: string[]
  priorityRadar: ExecutiveDashboardPriority[]
  missionRisks: ExecutiveDashboardRisk[]
  opportunities: ExecutiveDashboardOpportunity[]
  decisionQueue: ExecutiveDashboardDecision[]
  nextExecutiveMoves: string[]
  roadmap: ExecutiveDashboardRoadmapItem[]
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