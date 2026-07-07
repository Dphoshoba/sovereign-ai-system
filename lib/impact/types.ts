export type ImpactArea = {
  areaId: string
  areaName: string
  peopleReached: number
  influenceScore: number
  legacyValue: number
}

export type ImpactRoadmapItem = {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export type MissionImpactWorkspace = {
  mission: string
  missionTitle: string
  impactAreas: number
  peopleReached: number
  missionInfluence: number
  societalValue: number
  legacyScore: number
  impactScore: number
  healthScore: number
  areas: ImpactArea[]
  recommendations: string[]
  roadmap: ImpactRoadmapItem[]
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
