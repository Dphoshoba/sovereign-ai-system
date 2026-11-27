import { getGrowthRegistry } from "./growth-reader"
import { getEcosystemRegistry } from "./ecosystem-reader"
import { getResearchMissions } from "./research-registry"
import { buildCommunityRoadmap } from "../community/mock-data"
import type { MissionCommunityWorkspace, CommunityMember } from "../community/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionCommunity(slug: string): Promise<MissionCommunityWorkspace | null> {
  const growth = await getGrowthRegistry()
  const ecosystem = await getEcosystemRegistry()

  if (!growth || !ecosystem) {
    return null
  }

  const communityCount = 10
  const engagementScore = clamp(Math.floor((growth.adoptionScore * 0.5 + ecosystem.networkStrength * 0.5)), 0, 100)
  const participationScore = clamp(Math.floor((engagementScore * 0.6 + growth.communityScore * 0.4)), 0, 100)
  const networkGrowth = clamp(Math.floor((ecosystem.partnerCount * 3 + growth.growthVelocity * 0.5)), 0, 100)
  const connectionStrength = clamp(Math.floor((ecosystem.networkStrength * 0.7 + participationScore * 0.3)), 0, 100)
  const healthScore = clamp(Math.floor((engagementScore * 0.25 + participationScore * 0.25 + networkGrowth * 0.25 + connectionStrength * 0.25)), 0, 100)

  const members: CommunityMember[] = Array.from({ length: communityCount }, (_, i) => ({
    memberId: `member-${i + 1}`,
    memberName: `Community Member ${i + 1}`,
    engagementLevel: engagementScore - i * 3,
    participationScore: participationScore - i * 2,
    connectionCount: 3 + i,
  }))

  return {
    mission: slug,
    missionTitle: "Research Mission 001",
    communityCount,
    engagementScore,
    participationScore,
    networkGrowth,
    connectionStrength,
    healthScore,
    members,
    recommendations: ["Increase engagement", "Strengthen connections", "Grow network"],
    roadmap: buildCommunityRoadmap(slug),
    readOnly: true,
    previewOnly: true,
    noAuth: true,
    noSessions: true,
    noJwt: true,
    noDatabase: true,
    noExecution: true,
    noPublishing: true,
    noOpenAI: true,
    noGraphWrites: true,
    noSocialPosting: true,
  }
}

export async function getCommunityRegistry(): Promise<{
  communityCount: number
  engagementScore: number
  participationScore: number
  networkGrowth: number
  connectionStrength: number
  healthScore: number
  missions: MissionCommunityWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionCommunityWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionCommunity(mission.slug)
    if (workspace) {
      results.push(workspace)
    }
  }

  const missionCount = results.length
  const communityCount = missionCount > 0 ? 10 : 0
  const engagementScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.engagementScore, 0) / missionCount) : 0
  const participationScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.participationScore, 0) / missionCount) : 0
  const networkGrowth = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.networkGrowth, 0) / missionCount) : 0
  const connectionStrength = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.connectionStrength, 0) / missionCount) : 0
  const healthScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.healthScore, 0) / missionCount) : 0

  return {
    communityCount,
    engagementScore,
    participationScore,
    networkGrowth,
    connectionStrength,
    healthScore,
    missions: results,
  }
}
