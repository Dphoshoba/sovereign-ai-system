export type GammaTemplateItem = {
  slug: string
  title: string
  category: "research" | "creator" | "ministry" | "executive" | "agency" | "shared"
  filePath: string
}

export type GammaTemplateWorkspace = {
  mission: string
  missionTitle: string
  templateCount: number
  coverageScore: number
  adoptionScore: number
  reuseScore: number
  healthScore: number
  templates: GammaTemplateItem[]
  recommendations: string[]
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