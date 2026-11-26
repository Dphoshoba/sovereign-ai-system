export type QueryConfidence = "low" | "moderate" | "high" | "very-high"

export type QueryPriority = "low" | "medium" | "high"

export type QueryEvidence = {
  source: string
  summary: string
}

export type QueryAnswer = {
  id: string
  query: string
  answer: string[]
  confidence: QueryConfidence
  evidence: QueryEvidence[]
  priority: QueryPriority
  recommendedNextActions: string[]
}

export type QueryWorkspaceScore = {
  workspace: string
  score: number
  status: "strong" | "watch" | "weak"
}

export type MissionQueryWorkspace = {
  mission: string
  missionTitle: string
  queryCount: number
  questionCount: number
  answerCount: number
  gapCount: number
  recommendationCount: number
  coverageScore: number
  inferenceCoverage: number
  confidenceScore: number
  recommendationScore: number
  missionPriorityScore: number
  knowledgeCompleteness: number
  healthScore: number
  missingAssets: string[]
  weakAreas: QueryWorkspaceScore[]
  strongAreas: QueryWorkspaceScore[]
  suggestedNextActions: string[]
  answers: QueryAnswer[]
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
