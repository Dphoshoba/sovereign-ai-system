export type CommunityMember = {
  memberId: string
  memberName: string
  engagementLevel: number
  participationScore: number
  connectionCount: number
}

export type CommunityRoadmapItem = {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export type MissionCommunityWorkspace = {
  mission: string
  missionTitle: string
  communityCount: number
  engagementScore: number
  participationScore: number
  networkGrowth: number
  connectionStrength: number
  healthScore: number
  members: CommunityMember[]
  recommendations: string[]
  roadmap: CommunityRoadmapItem[]
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
