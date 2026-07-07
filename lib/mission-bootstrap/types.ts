export type MissionBootstrapTemplate = {
  slug: string
  name: string
  workspaceCount: number
  generatedAssets: number
  reuseScore: number
}

export type MissionBootstrapRoadmapItem = {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export type MissionBootstrapWorkspace = {
  mission: string
  missionTitle: string
  templateCount: number
  workspaceCount: number
  generatedAssets: number
  reuseScore: number
  bootstrapCoverage: number
  healthScore: number
  templates: MissionBootstrapTemplate[]
  recommendations: string[]
  roadmap: MissionBootstrapRoadmapItem[]
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