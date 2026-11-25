export type AcademyAsset = {
  name: string
  count: number
}

export type AcademyWorkspace = {
  mission: string
  missionTitle: string
  courseCount: number
  bookCount: number
  seriesCount: number
  seminarCount: number
  frameworkCount: number
  academyScore: number
  knowledgeReuse: number
  commercializationScore: number
  healthScore: number
  assets: AcademyAsset[]
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