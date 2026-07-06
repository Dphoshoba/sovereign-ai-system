export type AdvisorPriority = "high" | "medium" | "low"

export type AdvisorActionCategory =
  | "knowledge"
  | "creator"
  | "teaching"
  | "executive"
  | "agency"
  | "recommendation"
  | "gap"

export type AdvisorAction = {
  id: string
  title: string
  category: AdvisorActionCategory
  priority: AdvisorPriority
  rationale: string
  workspace: string
}

export type AdvisorRoadmapItem = {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export type MissionAdvisorWorkspace = {
  mission: string
  missionTitle: string
  adviceCount: number
  priorityActionCount: number
  highestRoiGap: string
  weakestWorkspace: string
  urgencyScore: number
  impactScore: number
  momentumScore: number
  executionScore: number
  healthScore: number
  recommendationCount: number
  missionFocusScore: number
  knowledgeDebt: number
  priorityActions: AdvisorAction[]
  topActions: AdvisorAction[]
  creatorSuggestions: string[]
  teachingSuggestions: string[]
  executiveSuggestions: string[]
  agencySuggestions: string[]
  highestRoiOpportunities: string[]
  weakestAreas: string[]
  missionFocus: string[]
  roadmap: AdvisorRoadmapItem[]
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