export type GammaCreateCommand = {
  command: string
  template: string
  workspaceGenerationScore: number
}

export type GammaCreateWorkspace = {
  mission: string
  missionTitle: string
  commandCount: number
  templateCoverage: number
  workspaceGenerationScore: number
  automationScore: number
  healthScore: number
  commands: GammaCreateCommand[]
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