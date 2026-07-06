import { existsSync, readFileSync } from "fs"
import { join } from "path"
import { getAgencyWorkspace } from "./agency-reader"
import { getCreatorWorkspace } from "./creator-output-reader"
import { getExecutiveWorkspace } from "./executive-reader"
import { getMissionInference } from "./inference-reader"
import { getKnowledgeIntelligenceWorkspace } from "./knowledge-intelligence-reader"
import { getMinistryWorkspace } from "./ministry-reader"
import { getMission, getResearchMissions } from "./research-registry"
import { getMissionRecommendations } from "./recommendation-reader"
import { getMissionQueryWorkspace } from "./query-reader"
import { getSharedKnowledgeWorkspace } from "./shared-knowledge-reader"
import type { GapItem, MissionGapAnalysisWorkspace, WorkspaceStrength } from "../gap-analysis/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

function statusFromScore(score: number): "strong" | "watch" | "weak" {
  if (score < 50) {
    return "weak"
  }
  if (score < 65) {
    return "watch"
  }
  return "strong"
}

function isFileMissingOrEmpty(filePath: string): boolean {
  if (!existsSync(filePath)) {
    return true
  }
  try {
    const text = readFileSync(filePath, "utf-8").trim()
    return text.length === 0
  } catch {
    return true
  }
}

function expectedMissingCreatorAssets(slug: string): string[] {
  const base = join(process.cwd(), "gamma", "creator", slug)
  const expectations = [
    { file: "podcast-series.md", title: "podcast-series.md" },
    { file: "interactive-course.md", title: "interactive-course.md" },
  ]
  return expectations
    .filter((item) => isFileMissingOrEmpty(join(base, item.file)))
    .map((item) => item.title)
}

function expectedMissingTeachings(slug: string): string[] {
  const base = join(process.cwd(), "gamma", "ministry", slug)
  const expectations = [
    { file: "teachings.md", title: "teachings.md" },
  ]
  return expectations
    .filter((item) => isFileMissingOrEmpty(join(base, item.file)))
    .map((item) => item.title)
}

function expectedMissingExecutiveAssets(slug: string): string[] {
  const base = join(process.cwd(), "gamma", "executive", slug)
  const expectations = [
    { file: "decision-brief.md", title: "decision-brief.md" },
    { file: "executive-scorecard.md", title: "executive-scorecard.md" },
  ]
  return expectations
    .filter((item) => isFileMissingOrEmpty(join(base, item.file)))
    .map((item) => item.title)
}

function expectedMissingAgencyAssets(slug: string): string[] {
  const base = join(process.cwd(), "gamma", "agency", slug)
  const expectations = [
    { file: "seminar.md", title: "seminar.md" },
    { file: "agency-workshop-kit.md", title: "agency-workshop-kit.md" },
  ]
  return expectations
    .filter((item) => isFileMissingOrEmpty(join(base, item.file)))
    .map((item) => item.title)
}

function expectedMissingKnowledgeAssets(slug: string): string[] {
  const base = join(process.cwd(), "gamma", "shared-knowledge", slug)
  const expectations = [
    { file: "taxonomy.md", title: "taxonomy.md" },
  ]
  return expectations
    .filter((item) => isFileMissingOrEmpty(join(base, item.file)))
    .map((item) => item.title)
}

function toGap(
  id: string,
  category: GapItem["category"],
  title: string,
  description: string,
  severity: GapItem["severity"],
  suggestedAction: string,
  suggestedAsset?: string
): GapItem {
  return {
    id,
    category,
    title,
    description,
    severity,
    suggestedAsset,
    suggestedAction,
  }
}

export async function getMissionGapAnalysis(slug: string): Promise<MissionGapAnalysisWorkspace | null> {
  const research = await getMission(slug)
  const creator = await getCreatorWorkspace(slug)
  const ministry = await getMinistryWorkspace(slug)
  const executive = await getExecutiveWorkspace(slug)
  const agency = await getAgencyWorkspace(slug)
  const shared = await getSharedKnowledgeWorkspace(slug)
  const intelligence = await getKnowledgeIntelligenceWorkspace(slug)
  const inference = await getMissionInference(slug)
  const query = await getMissionQueryWorkspace(slug)
  const recommendations = await getMissionRecommendations(slug)

  if (!research || !creator || !ministry || !executive || !agency || !shared || !intelligence || !inference || !query || !recommendations) {
    return null
  }

  const missingCreatorAssetList = expectedMissingCreatorAssets(slug)
  const missingTeachingList = expectedMissingTeachings(slug)
  const missingExecutiveAssetList = expectedMissingExecutiveAssets(slug)
  const missingAgencyAssetList = expectedMissingAgencyAssets(slug)
  const missingKnowledgeAssetList = expectedMissingKnowledgeAssets(slug)

  const missingFrameworkCount = inference.missingFrameworkCount
  const missingCreatorAssets = missingCreatorAssetList.length
  const missingTeachings = missingTeachingList.length
  const missingExecutiveAssets = missingExecutiveAssetList.length
  const missingAgencyAssets = missingAgencyAssetList.length
  const missingKnowledgeAssets = missingKnowledgeAssetList.length

  const assetDeficit =
    missingFrameworkCount +
    missingCreatorAssets +
    missingTeachings +
    missingExecutiveAssets +
    missingAgencyAssets +
    missingKnowledgeAssets

  const workspaceScores: WorkspaceStrength[] = [
    { workspace: "research", score: research.overallProgress, status: statusFromScore(research.overallProgress) },
    { workspace: "creator", score: creator.progress, status: statusFromScore(creator.progress) },
    { workspace: "ministry", score: ministry.progress, status: statusFromScore(ministry.progress) },
    { workspace: "executive", score: executive.readinessScore, status: statusFromScore(executive.readinessScore) },
    { workspace: "agency", score: agency.progress, status: statusFromScore(agency.progress) },
    { workspace: "shared-knowledge", score: shared.knowledgeHealthScore, status: statusFromScore(shared.knowledgeHealthScore) },
  ].sort((a, b) => a.score - b.score)

  const weakestWorkspace = workspaceScores[0]
  const lowMaturityAreas = workspaceScores.filter((item) => item.status !== "strong").map((item) => item.workspace)

  const knowledgeGaps: GapItem[] = [
    ...inference.missingFrameworks.map((framework, index) =>
      toGap(
        `gap-framework-${index + 1}`,
        "missing-framework",
        `Missing framework: ${framework}`,
        "Knowledge organization and reasoning coverage are incomplete for this framework.",
        index === 0 ? "high" : "medium",
        `Create ${framework} and connect it to mission references.`,
        framework
      )
    ),
    ...missingCreatorAssetList.map((asset, index) =>
      toGap(
        `gap-creator-${index + 1}`,
        "missing-creator-asset",
        `Missing creator asset: ${asset}`,
        "Research exists but creator transformation is incomplete.",
        "high",
        `Create ${asset} from high-value discoveries.`,
        asset
      )
    ),
    ...missingTeachingList.map((asset, index) =>
      toGap(
        `gap-teaching-${index + 1}`,
        "missing-teaching",
        `Missing teaching asset: ${asset}`,
        "Teaching development is incomplete for mission transfer.",
        "medium",
        `Expand and complete ${asset} with discovery-backed modules.`,
        asset
      )
    ),
    ...missingExecutiveAssetList.map((asset, index) =>
      toGap(
        `gap-executive-${index + 1}`,
        "missing-executive-asset",
        `Missing executive asset: ${asset}`,
        "Executive governance outputs are incomplete.",
        "medium",
        `Create ${asset} for executive decision readiness.`,
        asset
      )
    ),
    ...missingAgencyAssetList.map((asset, index) =>
      toGap(
        `gap-agency-${index + 1}`,
        "missing-agency-asset",
        `Missing agency deliverable: ${asset}`,
        "Packaging opportunity is not yet realized.",
        "medium",
        `Build ${asset} from ministry and creator outputs.`,
        asset
      )
    ),
    ...missingKnowledgeAssetList.map((asset, index) =>
      toGap(
        `gap-knowledge-${index + 1}`,
        "missing-knowledge-asset",
        `Missing knowledge asset: ${asset}`,
        "Knowledge layer completeness remains below target.",
        "high",
        `Create ${asset} and wire cross references.`,
        asset
      )
    ),
    toGap(
      "gap-unused-discoveries",
      "unused-discovery",
      "Unused discoveries remain",
      `${inference.unusedDiscoveries} discoveries have not become assets.`,
      inference.unusedDiscoveries > 0 ? "high" : "low",
      "Promote unused discoveries into creator and knowledge assets."
    ),
    toGap(
      "gap-unanswered-questions",
      "unanswered-question",
      "Unanswered questions remain",
      `${inference.unansweredQuestions} research questions remain unresolved.`,
      inference.unansweredQuestions > 2 ? "high" : "medium",
      "Expand research evidence to close unresolved mission questions."
    ),
  ]

  const gapCount = knowledgeGaps.length

  const coverageScore = clamp(
    Math.floor((query.coverageScore * 0.4 + inference.coverageScore * 0.3 + intelligence.overallScore * 0.3)),
    0,
    100
  )

  const maturityScore = clamp(
    Math.floor((creator.progress * 0.2 + ministry.progress * 0.2 + executive.readinessScore * 0.2 + agency.progress * 0.2 + shared.knowledgeHealthScore * 0.2)),
    0,
    100
  )

  const recommendationScore = clamp(
    Math.floor((recommendations.recommendationCount * 10 + recommendations.healthScore * 0.4)),
    0,
    100
  )

  const priorityScore = clamp(
    Math.floor((gapCount * 8 + (100 - coverageScore) * 0.5 + (100 - maturityScore) * 0.35)),
    0,
    100
  )

  const healthScore = clamp(
    Math.floor((coverageScore * 0.35 + maturityScore * 0.25 + recommendationScore * 0.2 + (100 - gapCount * 4) * 0.2)),
    0,
    100
  )

  const missingAssets = unique([
    ...inference.missingFrameworks,
    ...missingCreatorAssetList,
    ...missingTeachingList,
    ...missingExecutiveAssetList,
    ...missingAgencyAssetList,
    ...missingKnowledgeAssetList,
  ])

  const gapTimeline: MissionGapAnalysisWorkspace["timeline"] = [
    { date: "2026-07-06", event: "Inference and query deficits merged", status: "completed" },
    { date: "2026-07-06", event: "Workspace weakness ranking computed", status: "completed" },
    { date: "2026-07-06", event: "Gap analysis recommendations generated", status: "planned" },
  ]

  const recommendationList = unique([
    ...knowledgeGaps.slice(0, 6).map((gap) => gap.suggestedAction),
    ...recommendations.recommendations.slice(0, 3).map((item) => item.title),
  ]).slice(0, 10)

  return {
    mission: slug,
    missionTitle: intelligence.missionTitle,
    gapCount,
    assetDeficit,
    missingFrameworkCount,
    missingCreatorAssets,
    missingTeachings,
    missingExecutiveAssets,
    missingAgencyAssets,
    missingKnowledgeAssets,
    unusedDiscoveries: inference.unusedDiscoveries,
    unansweredQuestions: inference.unansweredQuestions,
    coverageScore,
    maturityScore,
    priorityScore,
    recommendationScore,
    healthScore,
    recommendationCount: recommendationList.length,
    weakestWorkspace,
    lowMaturityAreas,
    missingAssets,
    knowledgeGaps,
    recommendations: recommendationList,
    timeline: gapTimeline,
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

export async function getGapAnalysisRegistry(): Promise<{
  missionCount: number
  gapCount: number
  missingFrameworkCount: number
  coverageScore: number
  priorityScore: number
  maturityScore: number
  healthScore: number
  recommendationCount: number
  missions: MissionGapAnalysisWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionGapAnalysisWorkspace[] = []

  for (const mission of missions) {
    const analysis = await getMissionGapAnalysis(mission.slug)
    if (analysis) {
      results.push(analysis)
    }
  }

  const missionCount = results.length
  const gapCount = results.reduce((sum, item) => sum + item.gapCount, 0)
  const missingFrameworkCount = results.reduce((sum, item) => sum + item.missingFrameworkCount, 0)
  const recommendationCount = results.reduce((sum, item) => sum + item.recommendationCount, 0)

  const coverageScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.coverageScore, 0) / missionCount) : 0
  const priorityScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.priorityScore, 0) / missionCount) : 0
  const maturityScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.maturityScore, 0) / missionCount) : 0
  const healthScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.healthScore, 0) / missionCount) : 0

  return {
    missionCount,
    gapCount,
    missingFrameworkCount,
    coverageScore,
    priorityScore,
    maturityScore,
    healthScore,
    recommendationCount,
    missions: results,
  }
}
