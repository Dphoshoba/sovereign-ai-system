import { getAgencyWorkspace } from "./agency-reader"
import { getCreatorWorkspace } from "./creator-output-reader"
import { getExecutiveWorkspace } from "./executive-reader"
import { getMinistryWorkspace } from "./ministry-reader"
import { getMission, getResearchMissions } from "./research-registry"
import { getSharedKnowledgeWorkspace } from "./shared-knowledge-reader"
import type { SecondBrainConfidence, SecondBrainWorkspace, SecondBrainWorkspaceStatus } from "../second-brain/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

function deriveConfidence(score: number): SecondBrainConfidence {
  if (score >= 85) {
    return "very-high"
  }
  if (score >= 65) {
    return "high"
  }
  if (score >= 45) {
    return "moderate"
  }
  return "low"
}

function workspaceStatus(progress: number): "active" | "reviewing" | "planned" | "stalled" {
  if (progress < 30) {
    return "stalled"
  }
  if (progress < 50) {
    return "reviewing"
  }
  return "active"
}

export async function getSecondBrainWorkspace(slug: string): Promise<SecondBrainWorkspace | null> {
  const researchMission = await getMission(slug)
  const researchMissions = await getResearchMissions()
  const creator = await getCreatorWorkspace(slug)
  const ministry = await getMinistryWorkspace(slug)
  const executive = await getExecutiveWorkspace(slug)
  const agency = await getAgencyWorkspace(slug)
  const shared = await getSharedKnowledgeWorkspace(slug)

  if (!researchMission || !creator || !ministry || !executive || !agency || !shared) {
    return null
  }

  const missionCount = researchMissions.length
  const workspaceCount = 7

  const discoveryCount = researchMission.discoveryCount + shared.discoveryCount
  const assetCount =
    shared.assetCount +
    creator.bookOutlines.length +
    creator.courseOutlines.length +
    creator.youtubeSeries.length +
    creator.articleIdeas.length +
    agency.offerTemplates.length +
    agency.servicePackages.length

  const priorityCount = executive.priorityCount + executive.decisionCount
  const knowledgeAssets = unique([
    ...shared.frameworks.slice(0, 4),
    ...shared.templates.slice(0, 4),
    ...agency.offerTemplates.slice(0, 3),
  ])

  const suggestedActions = unique([
    ...executive.nextRecommendedActions,
    ...shared.suggestedApplications,
    `Advance ${agency.nextSuggestedService}`,
  ]).slice(0, 10)

  const recentDiscoveries = unique([
    ...researchMission.discoveries.slice(0, 6).map((item) => item.description),
    ...shared.discoveries.slice(0, 4),
  ]).slice(0, 10)

  const stalledMissions = researchMissions
    .filter((mission) => mission.progress < 30)
    .map((mission) => `${mission.title} (${mission.progress}%)`)

  const crossWorkspaceSummary = [
    `Research progress is ${researchMission.overallProgress}% with ${researchMission.discoveryCount} discoveries.`,
    `Creator progress is ${creator.progress}% with ${creator.creatorProjects.length} active projects.`,
    `Ministry progress is ${ministry.progress}% with ${ministry.teachingCount} teaching assets.`,
    `Executive readiness is ${executive.readinessScore} with ${executive.priorityCount} priorities.`,
    `Agency pipeline is ${agency.pipelineStage} with ${agency.proposalCount} proposals.`,
    `Shared knowledge has ${shared.assetCount} assets and score ${shared.knowledgeHealthScore}.`,
  ]

  const progressAverage = Math.floor(
    (researchMission.overallProgress + creator.progress + ministry.progress + executive.readinessScore + agency.progress + shared.knowledgeHealthScore) / 6
  )

  const healthScore = clamp(Math.floor((shared.knowledgeHealthScore * 0.6 + executive.readinessScore * 0.4)), 0, 100)
  const brainScore = clamp(Math.floor(progressAverage * 0.7 + Math.min(30, Math.floor(assetCount / 4))), 0, 100)
  const confidence = deriveConfidence(brainScore)

  const timeline: SecondBrainWorkspace["timeline"] = [
    { date: "2026-07-02", event: "Research workspace activated", status: "completed" },
    { date: "2026-07-03", event: "Creator workspace connected to mission", status: "completed" },
    { date: "2026-07-04", event: "Ministry and executive summaries integrated", status: "completed" },
    { date: "2026-07-05", event: "Agency delivery pipeline linked", status: "in-progress" },
    { date: "2026-07-05", event: "Shared knowledge assets promoted", status: "completed" },
    { date: "2026-07-05", event: "Second brain hub preview generated", status: "planned" },
  ]

  const workspaceStatuses: SecondBrainWorkspaceStatus[] = [
    { workspace: "research", status: workspaceStatus(researchMission.overallProgress), progress: researchMission.overallProgress },
    { workspace: "creator", status: workspaceStatus(creator.progress), progress: creator.progress },
    { workspace: "ministry", status: workspaceStatus(ministry.progress), progress: ministry.progress },
    { workspace: "executive", status: workspaceStatus(executive.readinessScore), progress: executive.readinessScore },
    { workspace: "agency", status: workspaceStatus(agency.progress), progress: agency.progress },
    { workspace: "shared-knowledge", status: workspaceStatus(shared.knowledgeHealthScore), progress: shared.knowledgeHealthScore },
    { workspace: "mission-registry", status: "active", progress: 100 },
  ]

  const growthIndicators: SecondBrainWorkspace["growthIndicators"] = [
    { date: "2026-07-03", discoveries: Math.max(2, Math.floor(discoveryCount * 0.5)), assets: Math.max(4, Math.floor(assetCount * 0.45)), score: clamp(brainScore - 8, 0, 100) },
    { date: "2026-07-04", discoveries: Math.max(3, Math.floor(discoveryCount * 0.75)), assets: Math.max(6, Math.floor(assetCount * 0.7)), score: clamp(brainScore - 4, 0, 100) },
    { date: "2026-07-05", discoveries: discoveryCount, assets: assetCount, score: brainScore },
  ]

  const dailyReview = [
    `Current mission: ${researchMission.name}`,
    `Top priority: ${executive.priorityList[0]}`,
    `Highest value asset: ${knowledgeAssets[0] ?? "Shared framework backlog"}`,
    `Pipeline focus: ${agency.pipelineStage}`,
  ]

  const weeklyReview = [
    `Mission coverage: ${missionCount} mission(s) tracked`,
    `Workspaces active: ${workspaceCount}`,
    `Knowledge assets promoted: ${assetCount}`,
    `Cross references linked: ${shared.crossReferenceCount}`,
    `Second brain score: ${brainScore}`,
  ]

  const actionCount = suggestedActions.length

  return {
    id: slug,
    name: "Second Brain Hub",
    currentMission: researchMission.name,
    missionCount,
    workspaceCount,
    discoveryCount,
    assetCount,
    timelineCount: timeline.length,
    priorityCount,
    actionCount,
    healthScore,
    brainScore,
    crossReferenceCount: shared.crossReferenceCount,
    confidence,
    researchProgress: researchMission.overallProgress,
    creatorProgress: creator.progress,
    ministryProgress: ministry.progress,
    executivePriorities: executive.priorityList,
    agencyPipeline: agency.pipelineStage,
    knowledgeAssets,
    suggestedActions,
    recentDiscoveries,
    stalledMissions,
    dailyReview,
    weeklyReview,
    dailyPrompts: [
      "What should I work on today?",
      "What have I learned?",
      "What can I create?",
      "What can I teach?",
      "What can I package?",
      "What can I reuse?",
    ],
    crossWorkspaceSummary,
    growthIndicators,
    timeline,
    workspaceStatus: workspaceStatuses,
    relatedMissions: researchMissions.map((mission) => ({
      id: mission.slug,
      title: mission.title,
      status: mission.status,
    })),
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
