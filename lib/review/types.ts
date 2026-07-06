export type ReviewTaskStatus = "completed" | "pending" | "overdue"

export type ReviewTaskItem = {
  id: string
  title: string
  status: ReviewTaskStatus
  workspace: string
  priority: "high" | "medium" | "low"
  rationale: string
}

export type ReviewRoadmapItem = {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export type MissionReviewWorkspace = {
  mission: string
  missionTitle: string
  completedCount: number
  pendingCount: number
  overdueCount: number
  improvementScore: number
  regressionScore: number
  reviewScore: number
  momentumScore: number
  healthScore: number
  knowledgeDebt: number
  attentionScore: number
  nextWeekActions: string[]
  recommendationCount: number
  completed: ReviewTaskItem[]
  pending: ReviewTaskItem[]
  overdue: ReviewTaskItem[]
  improvements: string[]
  regressions: string[]
  attentionNeeded: string[]
  recommendations: string[]
  missionOutlook: string[]
  roadmap: ReviewRoadmapItem[]
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