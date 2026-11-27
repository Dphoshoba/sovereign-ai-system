export type MissionControlStatusItem = {
  title: string
  score: number
  summary: string
}

export type MissionControlRiskItem = {
  title: string
  score: number
  severity: "high" | "medium" | "low"
  mitigation: string
}

export type MissionControlOpportunityItem = {
  title: string
  score: number
  action: string
}

export type MissionControlActionItem = {
  title: string
  priority: "high" | "medium" | "low"
  owner: string
  rationale: string
}

export type MissionControlRoadmapItem = {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export type MissionControlWorkspace = {
  mission: string
  missionTitle: string
  missionScore: number
  executiveScore: number
  plannerScore: number
  advisorScore: number
  reviewScore: number
  readinessScore: number
  momentumScore: number
  healthScore: number
  knowledgeDebt: number
  riskScore: number
  opportunityScore: number
  alignmentScore: number
  executionScore: number
  priorityCount: number
  decisionCount: number
  blockerCount: number
  recommendationCount: number
  actionCount: number
  missionStatus: MissionControlStatusItem[]
  executiveView: MissionControlStatusItem[]
  advisorInsights: string[]
  executionRadar: MissionControlStatusItem[]
  plannerQueue: string[]
  reviewSnapshot: string[]
  risks: MissionControlRiskItem[]
  opportunities: MissionControlOpportunityItem[]
  recommendations: string[]
  immediateActions: MissionControlActionItem[]
  nextSevenDays: string[]
  missionOutlook: string[]
  roadmap: MissionControlRoadmapItem[]
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