export type GapSeverity = "high" | "medium" | "low"

export type GapCategory =
  | "unused-discovery"
  | "unanswered-question"
  | "missing-framework"
  | "missing-creator-asset"
  | "missing-teaching"
  | "missing-executive-asset"
  | "missing-agency-asset"
  | "missing-knowledge-asset"

export type GapItem = {
  id: string
  category: GapCategory
  title: string
  description: string
  severity: GapSeverity
  suggestedAsset?: string
  suggestedAction: string
}

export type WorkspaceStrength = {
  workspace: string
  score: number
  status: "strong" | "watch" | "weak"
}

export type MissionGapAnalysisWorkspace = {
  mission: string
  missionTitle: string
  gapCount: number
  assetDeficit: number
  missingFrameworkCount: number
  missingCreatorAssets: number
  missingTeachings: number
  missingExecutiveAssets: number
  missingAgencyAssets: number
  missingKnowledgeAssets: number
  unusedDiscoveries: number
  unansweredQuestions: number
  coverageScore: number
  maturityScore: number
  priorityScore: number
  recommendationScore: number
  healthScore: number
  recommendationCount: number
  weakestWorkspace: WorkspaceStrength
  lowMaturityAreas: string[]
  missingAssets: string[]
  knowledgeGaps: GapItem[]
  recommendations: string[]
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
