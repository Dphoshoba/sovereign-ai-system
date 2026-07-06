export type InferenceConfidence = "low" | "moderate" | "high" | "very-high"

export type InferencePriority = "high" | "medium" | "low"

export type InferenceCategory =
  | "knowledge-gap"
  | "knowledge-opportunity"
  | "unused-research"
  | "missing-asset"
  | "workspace-weakness"

export type InferenceItem = {
  id: string
  category: InferenceCategory
  sourceType: "discovery" | "question" | "workspace" | "framework"
  source: string
  inference: string
  suggestedOutput?: string
  suggestedAction: string
  confidence: InferenceConfidence
  priority: InferencePriority
}

export type InferenceGap = {
  id: string
  title: string
  description: string
  severity: InferencePriority
}

export type InferenceWorkspaceStatus = {
  workspace: string
  score: number
  status: "strong" | "watch" | "weak"
}

export type InferenceWorkspace = {
  mission: string
  missionTitle: string
  inferenceCount: number
  gapCount: number
  unansweredQuestions: number
  unusedDiscoveries: number
  missingFrameworkCount: number
  coverageScore: number
  maturityScore: number
  confidenceScore: number
  recommendationScore: number
  healthScore: number
  discoveries: number
  questions: number
  answeredQuestions: number
  frameworks: number
  missingFrameworks: string[]
  creatorAssets: number
  teachings: number
  executivePriorities: number
  recommendationCount: number
  missionAreasNeedingAttention: string[]
  workspaceWeaknesses: InferenceWorkspaceStatus[]
  knowledgeGaps: InferenceGap[]
  knowledgeOpportunities: InferenceItem[]
  unusedResearch: InferenceItem[]
  missingAssets: InferenceItem[]
  suggestedActions: string[]
  timeline: Array<{
    date: string
    event: string
    status: "completed" | "in-progress" | "planned"
  }>
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
