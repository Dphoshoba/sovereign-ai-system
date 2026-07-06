import { existsSync, readFileSync } from "fs"
import { join } from "path"
import { getAgencyWorkspace } from "./agency-reader"
import { getCreatorWorkspace } from "./creator-output-reader"
import { getExecutiveWorkspace } from "./executive-reader"
import { getKnowledgeIntelligenceWorkspace } from "./knowledge-intelligence-reader"
import { getMinistryWorkspace } from "./ministry-reader"
import { getMission, getResearchMissions } from "./research-registry"
import { getMissionRecommendations } from "./recommendation-reader"
import { getSecondBrainWorkspace } from "./second-brain-reader"
import { getSharedKnowledgeWorkspace } from "./shared-knowledge-reader"
import type { InferenceGap, InferenceItem, InferenceWorkspace, InferenceWorkspaceStatus } from "../inference/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

function confidenceScoreToLabel(score: number): "low" | "moderate" | "high" | "very-high" {
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

function workspaceStatus(score: number): "strong" | "watch" | "weak" {
  if (score < 50) {
    return "weak"
  }
  if (score < 65) {
    return "watch"
  }
  return "strong"
}

function keywordsFromText(text: string): string[] {
  return unique(
    normalize(text)
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length >= 5)
  ).slice(0, 8)
}

function discoveryAppearsUsed(discovery: string, corpus: string): boolean {
  const normalizedDiscovery = normalize(discovery)
  if (normalize(corpus).includes(normalizedDiscovery.slice(0, 40))) {
    return true
  }

  const keywords = keywordsFromText(discovery)
  let hitCount = 0
  for (const keyword of keywords) {
    if (normalize(corpus).includes(keyword)) {
      hitCount += 1
    }
  }

  return hitCount >= 2
}

function readFrameworkFile(slug: string): string {
  const filePath = join(process.cwd(), "gamma", "shared-knowledge", slug, "frameworks.md")
  if (!existsSync(filePath)) {
    return ""
  }
  try {
    return readFileSync(filePath, "utf-8")
  } catch {
    return ""
  }
}

function readTaxonomyFile(slug: string): string {
  const filePath = join(process.cwd(), "gamma", "shared-knowledge", slug, "taxonomy.md")
  if (!existsSync(filePath)) {
    return ""
  }
  try {
    return readFileSync(filePath, "utf-8")
  } catch {
    return ""
  }
}

function missingFrameworksForMission(slug: string, frameworkSignals: string[]): string[] {
  const expected = [
    "taxonomy.md",
    "hormone-framework.md",
    "maternal-bonding-framework.md",
    "women-civilization-framework.md",
  ]

  const frameworkText = normalize(readFrameworkFile(slug))
  const taxonomyText = normalize(readTaxonomyFile(slug))

  const missing: string[] = []

  if (!taxonomyText) {
    missing.push("taxonomy.md")
  }

  if (!frameworkText.includes("hormone") && !frameworkSignals.some((signal) => normalize(signal).includes("hormone"))) {
    missing.push("hormone-framework.md")
  }

  if (!frameworkText.includes("bond") && !frameworkSignals.some((signal) => normalize(signal).includes("bond"))) {
    missing.push("maternal-bonding-framework.md")
  }

  if (!frameworkText.includes("civilization") && !frameworkSignals.some((signal) => normalize(signal).includes("civilization"))) {
    missing.push("women-civilization-framework.md")
  }

  return unique(missing.filter((item) => expected.includes(item)))
}

function unansweredQuestionInference(question: string, index: number): InferenceItem {
  const normalized = normalize(question)
  let suggestedAction = "Expand research synthesis for this unanswered question."

  if (normalized.includes("hormone") || normalized.includes("emotional")) {
    suggestedAction = "Expand hormones.md with deeper biological and psychological pathways."
  } else if (normalized.includes("scripture") || normalized.includes("biblical")) {
    suggestedAction = "Add scripture cross references that directly answer this question."
  } else if (normalized.includes("mother") || normalized.includes("bond")) {
    suggestedAction = "Link motherhood findings to creator and ministry assets."
  }

  return {
    id: `inference-question-${index + 1}`,
    category: "knowledge-gap",
    sourceType: "question",
    source: question,
    inference: "Research incomplete for this question.",
    suggestedAction,
    confidence: "moderate",
    priority: index < 2 ? "high" : "medium",
  }
}

function discoveryOpportunityInference(discovery: string, index: number): InferenceItem {
  const normalized = normalize(discovery)

  if (normalized.includes("oxytocin") || normalized.includes("bond")) {
    return {
      id: `inference-discovery-${index + 1}`,
      category: "knowledge-opportunity",
      sourceType: "discovery",
      source: discovery,
      inference: "Potential creator asset is missing.",
      suggestedOutput: "article",
      suggestedAction: "Create a creator article from the bonding discovery.",
      confidence: "high",
      priority: "high",
    }
  }

  if (normalized.includes("civilization") || normalized.includes("society")) {
    return {
      id: `inference-discovery-${index + 1}`,
      category: "knowledge-opportunity",
      sourceType: "discovery",
      source: discovery,
      inference: "Executive workshop opportunity detected.",
      suggestedOutput: "seminar.md",
      suggestedAction: "Create agency seminar.md from this discovery cluster.",
      confidence: "high",
      priority: "high",
    }
  }

  return {
    id: `inference-discovery-${index + 1}`,
    category: "knowledge-opportunity",
    sourceType: "discovery",
    source: discovery,
    inference: "Discovery can be promoted into structured assets.",
    suggestedOutput: "framework",
    suggestedAction: "Distill discovery into shared framework and creator output.",
    confidence: "moderate",
    priority: "medium",
  }
}

export async function getMissionInference(slug: string): Promise<InferenceWorkspace | null> {
  const research = await getMission(slug)
  const creator = await getCreatorWorkspace(slug)
  const ministry = await getMinistryWorkspace(slug)
  const executive = await getExecutiveWorkspace(slug)
  const agency = await getAgencyWorkspace(slug)
  const shared = await getSharedKnowledgeWorkspace(slug)
  const secondBrain = await getSecondBrainWorkspace(slug)
  const intelligence = await getKnowledgeIntelligenceWorkspace(slug)
  const recommendations = await getMissionRecommendations(slug)

  if (!research || !creator || !ministry || !executive || !agency || !shared || !secondBrain || !intelligence || !recommendations) {
    return null
  }

  const questions = research.questions.length
  const unanswered = research.questions.filter((question) => question.status !== "answered")
  const unansweredQuestions = unanswered.length
  const answeredQuestions = questions - unansweredQuestions

  const creatorCorpus = [
    ...creator.articleIdeas,
    ...creator.bookOutlines,
    ...creator.courseOutlines,
    ...creator.youtubeSeries,
  ].join("\n")
  const ministryCorpus = [
    ...ministry.sermonSeries,
    ...ministry.teachingCourses,
    ...ministry.bibleStudies,
  ].join("\n")
  const executiveCorpus = [...executive.priorityList, ...executive.nextRecommendedActions].join("\n")
  const sharedCorpus = [...shared.frameworks, ...shared.prompts, ...shared.templates].join("\n")
  const agencyCorpus = [...agency.workshopPlans, ...agency.presentationOutlines, ...agency.servicePackages].join("\n")
  const allCorpus = [creatorCorpus, ministryCorpus, executiveCorpus, sharedCorpus, agencyCorpus].join("\n")

  const discoveryDescriptions = research.discoveries.map((item) => item.description)
  const unusedDiscoveryList = discoveryDescriptions.filter((discovery) => !discoveryAppearsUsed(discovery, allCorpus))
  const unusedDiscoveries = unusedDiscoveryList.length

  const missingFrameworks = missingFrameworksForMission(slug, shared.frameworks)
  const missingFrameworkCount = missingFrameworks.length

  const knowledgeGapInferences = unanswered.slice(0, 4).map((question, index) => unansweredQuestionInference(question.question, index))
  const opportunityInferences = unusedDiscoveryList.slice(0, 4).map((discovery, index) => discoveryOpportunityInference(discovery, index))

  const missingAssetInferences: InferenceItem[] = missingFrameworks.map((framework, index) => ({
    id: `inference-missing-${index + 1}`,
    category: "missing-asset",
    sourceType: "framework",
    source: framework,
    inference: "Framework gap detected in mission knowledge layer.",
    suggestedOutput: framework,
    suggestedAction: `Create ${framework} to improve reasoning coverage and reuse quality.`,
    confidence: "high",
    priority: index < 2 ? "high" : "medium",
  }))

  const workspaceWeaknesses: InferenceWorkspaceStatus[] = [
    { workspace: "research", score: research.overallProgress, status: workspaceStatus(research.overallProgress) },
    { workspace: "creator", score: creator.progress, status: workspaceStatus(creator.progress) },
    { workspace: "ministry", score: ministry.progress, status: workspaceStatus(ministry.progress) },
    { workspace: "executive", score: executive.readinessScore, status: workspaceStatus(executive.readinessScore) },
    { workspace: "agency", score: agency.progress, status: workspaceStatus(agency.progress) },
    { workspace: "shared-knowledge", score: shared.knowledgeHealthScore, status: workspaceStatus(shared.knowledgeHealthScore) },
    { workspace: "second-brain", score: secondBrain.healthScore, status: workspaceStatus(secondBrain.healthScore) },
    { workspace: "knowledge-intelligence", score: intelligence.intelligenceScore, status: workspaceStatus(intelligence.intelligenceScore) },
  ].sort((a, b) => a.score - b.score)

  const missionAreasNeedingAttention = workspaceWeaknesses
    .filter((item) => item.status !== "strong")
    .slice(0, 4)
    .map((item) => item.workspace)

  const knowledgeGaps: InferenceGap[] = [
    {
      id: "gap-unanswered-questions",
      title: "Unanswered research questions",
      description: `${unansweredQuestions} questions remain unresolved and need deeper evidence synthesis.`,
      severity: unansweredQuestions >= 4 ? "high" : unansweredQuestions >= 2 ? "medium" : "low",
    },
    {
      id: "gap-unused-discoveries",
      title: "Unused discoveries",
      description: `${unusedDiscoveries} discoveries have not yet become creator, ministry, executive, agency or shared assets.`,
      severity: unusedDiscoveries >= 3 ? "high" : unusedDiscoveries >= 1 ? "medium" : "low",
    },
    {
      id: "gap-framework-coverage",
      title: "Framework coverage gaps",
      description: `${missingFrameworkCount} expected frameworks are still missing from shared knowledge.`,
      severity: missingFrameworkCount >= 2 ? "high" : missingFrameworkCount >= 1 ? "medium" : "low",
    },
  ]

  const inferenceCount = knowledgeGapInferences.length + opportunityInferences.length + missingAssetInferences.length + 2
  const gapCount = knowledgeGaps.length

  const baseCoverage = clamp(
    Math.floor(
      (intelligence.overallScore * 0.35 +
        recommendations.coveragePercent * 0.25 +
        (100 - missingFrameworkCount * 20) * 0.2 +
        (100 - unansweredQuestions * 8) * 0.2)
    ),
    0,
    100
  )

  const maturityScore = clamp(
    Math.floor(
      (creator.progress * 0.2 +
        ministry.progress * 0.2 +
        executive.readinessScore * 0.2 +
        shared.knowledgeHealthScore * 0.2 +
        secondBrain.healthScore * 0.2)
    ),
    0,
    100
  )

  const confidenceScore = clamp(
    Math.floor((intelligence.intelligenceScore * 0.5 + recommendations.readinessScore * 0.25 + recommendations.healthScore * 0.25)),
    0,
    100
  )

  const recommendationScore = clamp(
    Math.floor((recommendations.recommendationCount * 10 + recommendations.coveragePercent * 0.4)),
    0,
    100
  )

  const healthScore = clamp(
    Math.floor((baseCoverage * 0.3 + maturityScore * 0.3 + confidenceScore * 0.2 + recommendationScore * 0.2)),
    0,
    100
  )

  const suggestedActions = unique([
    ...knowledgeGapInferences.map((item) => item.suggestedAction),
    ...opportunityInferences.map((item) => item.suggestedAction),
    ...missingAssetInferences.map((item) => item.suggestedAction),
    ...recommendations.recommendations.slice(0, 3).map((item) => item.title),
  ]).slice(0, 10)

  const inferredConfidence = confidenceScoreToLabel(confidenceScore)

  const unusedResearch: InferenceItem[] = unusedDiscoveryList.slice(0, 4).map((discovery, index) => ({
    id: `unused-discovery-${index + 1}`,
    category: "unused-research",
    sourceType: "discovery",
    source: discovery,
    inference: "Discovery has not yet been transformed into mission assets.",
    suggestedOutput: "creator/ministry/shared asset",
    suggestedAction: "Promote this discovery into at least one creator and one shared-knowledge asset.",
    confidence: inferredConfidence,
    priority: index < 2 ? "high" : "medium",
  }))

  const timeline: InferenceWorkspace["timeline"] = [
    { date: "2026-07-04", event: "Relationship and search layers established", status: "completed" },
    { date: "2026-07-05", event: "Recommendation layer generated", status: "completed" },
    { date: "2026-07-06", event: "Inference engine baseline generated", status: "completed" },
    { date: "2026-07-06", event: "Gap and opportunity reasoning expanded", status: "in-progress" },
    { date: "2026-07-06", event: "Mission maturity scoring prepared", status: "planned" },
  ]

  return {
    mission: slug,
    missionTitle: intelligence.missionTitle,
    inferenceCount,
    gapCount,
    unansweredQuestions,
    unusedDiscoveries,
    missingFrameworkCount,
    coverageScore: baseCoverage,
    maturityScore,
    confidenceScore,
    recommendationScore,
    healthScore,
    discoveries: research.discoveryCount,
    questions,
    answeredQuestions,
    frameworks: shared.frameworkCount,
    missingFrameworks,
    creatorAssets: creator.creatorProjects.length,
    teachings: ministry.teachingCount,
    executivePriorities: executive.priorityCount,
    recommendationCount: recommendations.recommendationCount,
    missionAreasNeedingAttention,
    workspaceWeaknesses,
    knowledgeGaps,
    knowledgeOpportunities: [...knowledgeGapInferences, ...opportunityInferences],
    unusedResearch,
    missingAssets: missingAssetInferences,
    suggestedActions,
    timeline,
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

export async function getInferenceRegistry(): Promise<{
  missionCount: number
  inferenceCount: number
  gapCount: number
  coverageScore: number
  maturityScore: number
  recommendationCount: number
  healthScore: number
  missions: InferenceWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: InferenceWorkspace[] = []

  for (const mission of missions) {
    const inference = await getMissionInference(mission.slug)
    if (inference) {
      results.push(inference)
    }
  }

  const missionCount = results.length
  const inferenceCount = results.reduce((sum, item) => sum + item.inferenceCount, 0)
  const gapCount = results.reduce((sum, item) => sum + item.gapCount, 0)
  const recommendationCount = results.reduce((sum, item) => sum + item.recommendationCount, 0)

  const coverageScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.coverageScore, 0) / missionCount) : 0
  const maturityScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.maturityScore, 0) / missionCount) : 0
  const healthScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.healthScore, 0) / missionCount) : 0

  return {
    missionCount,
    inferenceCount,
    gapCount,
    coverageScore,
    maturityScore,
    recommendationCount,
    healthScore,
    missions: results,
  }
}
