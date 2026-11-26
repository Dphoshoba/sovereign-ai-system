export type SynthesisLink = {
  linkId: string
  linkName: string
  integrationScore: number
  reuseScore: number
  knowledgeDensity: number
}

export type SynthesisRoadmapItem = {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export type MissionSynthesisWorkspace = {
  mission: string
  missionTitle: string
  crossDomainLinks: number
  synthesisCount: number
  knowledgeDensity: number
  integrationScore: number
  reuseScore: number
  healthScore: number
  links: SynthesisLink[]
  recommendations: string[]
  roadmap: SynthesisRoadmapItem[]
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
