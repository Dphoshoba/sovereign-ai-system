import { getAgencyWorkspace } from "./agency-reader"
import { getCreatorWorkspace } from "./creator-output-reader"
import { getExecutiveWorkspace } from "./executive-reader"
import { getMinistryWorkspace } from "./ministry-reader"
import { getMission, getResearchMissions } from "./research-registry"
import { getSecondBrainWorkspace } from "./second-brain-reader"
import { getSharedKnowledgeWorkspace } from "./shared-knowledge-reader"
import type {
  KnowledgeIntelligenceConfidence,
  KnowledgeIntelligenceGraphEdge,
  KnowledgeIntelligenceGraphNode,
  KnowledgeIntelligenceSignal,
  KnowledgeIntelligenceWorkspace,
  KnowledgeIntelligenceWorkspaceStatus,
} from "../knowledge-intelligence/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

function deriveConfidence(score: number): KnowledgeIntelligenceConfidence {
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

function workspaceState(progress: number): "active" | "reviewing" | "planned" | "stalled" {
  if (progress < 30) {
    return "stalled"
  }
  if (progress < 50) {
    return "reviewing"
  }
  return "active"
}

export async function getKnowledgeIntelligenceWorkspace(slug: string): Promise<KnowledgeIntelligenceWorkspace | null> {
  const researchMission = await getMission(slug)
  const researchMissions = await getResearchMissions()
  const creator = await getCreatorWorkspace(slug)
  const ministry = await getMinistryWorkspace(slug)
  const executive = await getExecutiveWorkspace(slug)
  const agency = await getAgencyWorkspace(slug)
  const shared = await getSharedKnowledgeWorkspace(slug)
  const brain = await getSecondBrainWorkspace(slug)

  if (!researchMission || !creator || !ministry || !executive || !agency || !shared || !brain) {
    return null
  }

  const missionCount = researchMissions.length
  const workspaceCount = 8
  const coverageCount = workspaceCount

  const frameworkCount = shared.frameworkCount
  const questionCount = researchMission.questionCount
  const teachingCount = ministry.teachingCount
  const courseCount = creator.courseOutlines.length + ministry.teachingCourses.length
  const presentationCount = agency.presentationOutlines.length
  const decisionCount = executive.decisionCount
  const promptCount = shared.promptCount
  const discoveryCount = researchMission.discoveryCount + shared.discoveryCount
  const assetCount = shared.assetCount
  const crossReferenceCount = shared.crossReferenceCount

  const researchCoverage = researchMission.overallProgress
  const creatorCoverage = creator.progress
  const ministryCoverage = ministry.progress
  const executiveCoverage = executive.readinessScore
  const agencyCoverage = agency.progress
  const knowledgeCoverage = shared.knowledgeHealthScore
  const overallScore = clamp(
    Math.floor((researchCoverage + creatorCoverage + ministryCoverage + executiveCoverage + agencyCoverage + knowledgeCoverage) / 6),
    0,
    100
  )

  const knowledgeHealthScore = clamp(Math.floor((shared.knowledgeHealthScore * 0.5 + brain.healthScore * 0.5)), 0, 100)
  const brainHealthScore = clamp(Math.floor((brain.brainScore * 0.6 + executive.readinessScore * 0.4)), 0, 100)
  const intelligenceScore = clamp(Math.floor((overallScore * 0.5 + knowledgeHealthScore * 0.25 + brainHealthScore * 0.25)), 0, 100)
  const confidence = deriveConfidence(intelligenceScore)

  const intelligenceSignals: KnowledgeIntelligenceSignal[] = [
    { id: "signal-1", title: "Research discovery density", source: "research", score: researchMission.discoveryCount * 6, status: researchMission.discoveryCount >= 10 ? "strong" : "watch" },
    { id: "signal-2", title: "Creator output variety", source: "creator", score: creator.creatorProjects.length * 18, status: creator.creatorProjects.length >= 4 ? "strong" : "watch" },
    { id: "signal-3", title: "Ministry teaching readiness", source: "ministry", score: ministry.teachingCount * 8, status: ministry.teachingCount >= 10 ? "strong" : "watch" },
    { id: "signal-4", title: "Executive decision pressure", source: "executive", score: executive.priorityCount * 10 + executive.decisionCount * 8, status: executive.readinessScore >= 60 ? "strong" : "needs-work" },
    { id: "signal-5", title: "Agency delivery capacity", source: "agency", score: agency.proposalCount * 10 + agency.packageCount * 8, status: agency.pipelineStage === "delivery" ? "strong" : "watch" },
    { id: "signal-6", title: "Shared knowledge reuse depth", source: "shared-knowledge", score: shared.assetCount + shared.frameworkCount + shared.templateCount, status: shared.knowledgeHealthScore >= 60 ? "strong" : "watch" },
    { id: "signal-7", title: "Second brain synthesis quality", source: "second-brain", score: brain.brainScore, status: brain.brainScore >= 60 ? "strong" : "watch" },
  ]
  const signalCount = intelligenceSignals.length

  const knowledgeDomains = unique([
    "research",
    "creator",
    "ministry",
    "executive",
    "agency",
    "shared-knowledge",
    "second-brain",
    ...shared.knowledgeDomains,
  ])

  const insights = unique([
    `Research mission progress is ${researchMission.overallProgress}%.`,
    `Creator outputs span ${creator.creatorProjects.length} core outputs.`,
    `Ministry teaching assets total ${ministry.teachingCount}.`,
    `Executive readiness sits at ${executive.readinessScore}.`,
    `Agency pipeline is ${agency.pipelineStage}.`,
    `Shared knowledge health is ${shared.knowledgeHealthScore}.`,
    `Second brain score is ${brain.brainScore}.`,
  ])

  const patterns = unique([
    "Research feeds creator, ministry, executive, agency and knowledge reuse.",
    "Shared knowledge transforms raw outputs into governed assets.",
    "Second brain synthesis confirms cross-workspace alignment.",
    "Mission registry ensures consistent coverage for the womanhood mission.",
  ])

  const recommendations = unique([
    ...brain.suggestedActions.slice(0, 3),
    ...shared.suggestedApplications.slice(0, 3),
    `Strengthen ${agency.nextSuggestedService}.`,
    "Promote the strongest discovery into reusable knowledge assets.",
  ])

  const crossWorkspaceSummary = [
    `Research: ${researchMission.discoveryCount} discoveries, ${researchMission.questionCount} questions.`,
    `Creator: ${creator.creatorProjects.length} outputs ready for reuse.`,
    `Ministry: ${ministry.teachingCount} teaching assets and ${ministry.scriptureCount} scripture references.`,
    `Executive: ${executive.priorityCount} priorities and ${executive.decisionCount} decisions.`,
    `Agency: ${agency.proposalCount} proposals, ${agency.packageCount} packages and ${agency.offerCount} offers.`,
    `Shared Knowledge: ${shared.assetCount} assets and ${shared.crossReferenceCount} references.`,
    `Second Brain: ${brain.brainScore} score across ${brain.workspaceCount} workspaces.`,
  ]

  const timeline: KnowledgeIntelligenceWorkspace["timeline"] = [
    { date: "2026-07-02", event: "Mission Created", status: "completed" },
    { date: "2026-07-02", event: "Research Started", status: "completed" },
    { date: "2026-07-03", event: "Research Completed", status: "completed" },
    { date: "2026-07-03", event: "Content Created", status: "completed" },
    { date: "2026-07-04", event: "Teaching Generated", status: "completed" },
    { date: "2026-07-05", event: "Assets Produced", status: "completed" },
    { date: "2026-07-06", event: "Knowledge Preserved", status: "planned" },
  ]

  const workspaceStatuses: KnowledgeIntelligenceWorkspaceStatus[] = [
    { workspace: "research", status: workspaceState(researchMission.overallProgress), progress: researchMission.overallProgress },
    { workspace: "creator", status: workspaceState(creator.progress), progress: creator.progress },
    { workspace: "ministry", status: workspaceState(ministry.progress), progress: ministry.progress },
    { workspace: "executive", status: workspaceState(executive.readinessScore), progress: executive.readinessScore },
    { workspace: "agency", status: workspaceState(agency.progress), progress: agency.progress },
    { workspace: "shared-knowledge", status: workspaceState(shared.knowledgeHealthScore), progress: shared.knowledgeHealthScore },
    { workspace: "second-brain", status: workspaceState(brain.brainScore), progress: brain.brainScore },
    { workspace: "mission-registry", status: "active", progress: 100 },
  ]

  const missionTitle = researchMission.name
  const relatedMissions = researchMissions.map((mission) => ({
    id: mission.slug,
    title: mission.title,
    status: mission.status,
  }))

  const insightCount = insights.length
  const patternCount = patterns.length
  const recommendationCount = recommendations.length
  const timelineCount = timeline.length

  const graphNodes: KnowledgeIntelligenceGraphNode[] = [
    { id: "mission-womanhood", label: missionTitle, type: "mission" },
    { id: "workspace-research", label: "Research Workspace", type: "workspace" },
    { id: "workspace-creator", label: "Creator Workspace", type: "workspace" },
    { id: "workspace-ministry", label: "Ministry Workspace", type: "workspace" },
    { id: "workspace-executive", label: "Executive Workspace", type: "workspace" },
    { id: "workspace-agency", label: "Agency Workspace", type: "workspace" },
    { id: "workspace-shared", label: "Shared Knowledge", type: "workspace" },
    { id: "workspace-brain", label: "Second Brain", type: "workspace" },
    { id: "layer-intelligence", label: "Knowledge Intelligence", type: "layer" },
  ]

  const graphEdges: KnowledgeIntelligenceGraphEdge[] = [
    { from: "workspace-research", to: "workspace-creator", relation: "feeds" },
    { from: "workspace-creator", to: "workspace-ministry", relation: "feeds" },
    { from: "workspace-ministry", to: "workspace-executive", relation: "feeds" },
    { from: "workspace-executive", to: "workspace-agency", relation: "feeds" },
    { from: "workspace-agency", to: "workspace-shared", relation: "feeds" },
    { from: "workspace-shared", to: "workspace-brain", relation: "feeds" },
    { from: "workspace-brain", to: "layer-intelligence", relation: "synthesizes" },
    { from: "layer-intelligence", to: "mission-womanhood", relation: "governs" },
  ]

  return {
    id: slug,
    name: "Knowledge Intelligence Layer",
    missionTitle,
    status: "active",
    confidence,
    intelligenceScore,
    knowledgeHealthScore,
    brainHealthScore,
    missionCount,
    workspaceCount,
    signalCount,
    insightCount,
    patternCount,
    recommendationCount,
    timelineCount,
    discoveryCount,
    assetCount,
    frameworkCount,
    questionCount,
    teachingCount,
    courseCount,
    presentationCount,
    decisionCount,
    promptCount,
    crossReferenceCount,
    coverageCount,
    researchCoverage,
    creatorCoverage,
    ministryCoverage,
    executiveCoverage,
    agencyCoverage,
    knowledgeCoverage,
    overallScore,
    knowledgeDomains,
    intelligenceSignals,
    insights,
    patterns,
    recommendations,
    dailyQuestions: [
      "What is the strongest signal today?",
      "Where is the weakest knowledge link?",
      "What should be reused next?",
      "What should be promoted into governance?",
    ],
    weeklyReview: [
      `Review ${signalCount} intelligence signals.`,
      `Review ${coverageCount} workspace coverage points.`,
      `Review ${intelligenceScore} intelligence score.`,
    ],
    relationshipView: [
      "Research",
      "Creator",
      "Ministry",
      "Executive",
      "Agency",
      "Shared Knowledge",
      "Second Brain",
    ],
    missionNavigator: [
      "Womanhood",
      "Research Assets",
      "Creator Assets",
      "Ministry Assets",
      "Executive Assets",
      "Agency Assets",
      "Knowledge Assets",
    ],
    crossWorkspaceSummary,
    workspaceStatus: workspaceStatuses,
    timeline,
    relatedMissions,
    signalPreview: intelligenceSignals.slice(0, 4).map((signal) => `${signal.source}: ${signal.title}`),
    knowledgeGraphPreview: {
      nodes: graphNodes,
      edges: graphEdges,
    },
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
