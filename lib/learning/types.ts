export type LearningAsset = {
  assetId: string
  assetName: string
  knowledgeGain: number
  retentionRate: number
  applicationValue: number
}

export type LearningRoadmapItem = {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export type MissionLearningWorkspace = {
  mission: string
  missionTitle: string
  learningAssets: number
  growthRate: number
  knowledgeGain: number
  improvementScore: number
  feedbackLoops: number
  retentionScore: number
  healthScore: number
  assets: LearningAsset[]
  recommendations: string[]
  roadmap: LearningRoadmapItem[]
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
