export type GovernanceCheck = {
  title: string
  score: number
  status: "pass" | "watch" | "risk"
  note: string
}

export type GovernanceRoadmapItem = {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export type MissionGovernanceWorkspace = {
  mission: string
  missionTitle: string
  determinismScore: number
  hydrationScore: number
  ssrScore: number
  securityScore: number
  governanceScore: number
  freezeReadiness: number
  checks: GovernanceCheck[]
  recommendations: string[]
  roadmap: GovernanceRoadmapItem[]
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
