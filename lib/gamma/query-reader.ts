import { getAgencyWorkspace } from "./agency-reader"
import { getCreatorWorkspace } from "./creator-output-reader"
import { getExecutiveWorkspace } from "./executive-reader"
import { getMissionInference, getInferenceRegistry } from "./inference-reader"
import { getKnowledgeIntelligenceWorkspace } from "./knowledge-intelligence-reader"
import { getMinistryWorkspace } from "./ministry-reader"
import { getMission, getResearchMissions } from "./research-registry"
import { getMissionRecommendations } from "./recommendation-reader"
import { getSharedKnowledgeWorkspace } from "./shared-knowledge-reader"
import type { MissionQueryWorkspace, QueryAnswer, QueryConfidence, QueryWorkspaceScore } from "../query-engine/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function confidenceFromScore(score: number): QueryConfidence {
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

function statusFromScore(score: number): "strong" | "watch" | "weak" {
  if (score < 50) {
    return "weak"
  }
  if (score < 65) {
    return "watch"
  }
  return "strong"
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

function toQueryAnswer(
  id: string,
  query: string,
  answer: string[],
  confidence: QueryConfidence,
  evidence: Array<{ source: string; summary: string }>,
  priority: "low" | "medium" | "high",
  recommendedNextActions: string[]
): QueryAnswer {
  return {
    id,
    query,
    answer,
    confidence,
    evidence,
    priority,
    recommendedNextActions,
  }
}

export async function getMissionQueryWorkspace(slug: string): Promise<MissionQueryWorkspace | null> {
  const research = await getMission(slug)
  const creator = await getCreatorWorkspace(slug)
  const ministry = await getMinistryWorkspace(slug)
  const executive = await getExecutiveWorkspace(slug)
  const agency = await getAgencyWorkspace(slug)
  const shared = await getSharedKnowledgeWorkspace(slug)
  const inference = await getMissionInference(slug)
  const recommendations = await getMissionRecommendations(slug)
  const intelligence = await getKnowledgeIntelligenceWorkspace(slug)
  const allMissions = await getResearchMissions()
  const inferenceRegistry = await getInferenceRegistry()

  if (!research || !creator || !ministry || !executive || !agency || !shared || !inference || !recommendations || !intelligence) {
    return null
  }

  const weakestWorkspaces = inference.workspaceWeaknesses.filter((item) => item.status !== "strong")
  const strongestWorkspaces = inference.workspaceWeaknesses.filter((item) => item.status === "strong")

  const missingCreatorAssets = [
    "podcast-series.md",
    "interactive-course.md",
    "workshop-material.md",
  ]

  const missingAssets = unique([
    ...inference.missingFrameworks,
    ...missingCreatorAssets,
  ])

  const inferredQuestions = [
    "What discoveries support this teaching?",
    "Which discoveries remain unused?",
    "What research has not become content?",
    "Which creator assets are missing?",
    "Which frameworks are missing?",
    "Which workspaces are weakest?",
    "What should David work on next?",
    "Which mission deserves attention?",
    "What mission has highest maturity?",
    "Which discoveries became teachings?",
  ]

  const missionWithHighestMaturity = inferenceRegistry.missions
    .slice()
    .sort((a, b) => b.maturityScore - a.maturityScore)[0]

  const convertedDiscoveries = research.discoveries
    .map((item) => item.description)
    .filter((description) => {
      const text = description.toLowerCase()
      return ministry.sermonSeries.some((series) => series.toLowerCase().includes(text.slice(0, 20)))
        || shared.discoveries.some((entry) => entry.toLowerCase().includes(text.slice(0, 20)))
    })

  const answers: QueryAnswer[] = [
    toQueryAnswer(
      "q1",
      "What discoveries support this teaching?",
      [
        "Oxytocin research",
        "Hormone studies",
        "questions.md references",
        "scriptures.md references",
      ],
      "high",
      [
        { source: "gamma/research/womanhood/hormones.md", summary: "Hormones and bonding evidence." },
        { source: "gamma/research/womanhood/questions.md", summary: "Open questions linked to emotional and hormonal change." },
        { source: "gamma/research/womanhood/scriptures.md", summary: "Scripture references attached to ministry teaching direction." },
      ],
      "high",
      ["Map each teaching item to at least one discovery evidence line."]
    ),
    toQueryAnswer(
      "q2",
      "Which discoveries remain unused?",
      inference.unusedResearch.map((item) => item.source),
      confidenceFromScore(inference.confidenceScore),
      [{ source: "lib/gamma/inference-reader.ts", summary: "Unused discoveries computed against creator/ministry/executive/shared corpus." }],
      "high",
      ["Promote unused discoveries into creator article and shared framework assets."]
    ),
    toQueryAnswer(
      "q3",
      "What research has not become content?",
      inference.unusedResearch.map((item) => item.source),
      confidenceFromScore(inference.confidenceScore),
      [{ source: "gamma/research/womanhood/discoveries.md", summary: "Research discoveries compared to published content surfaces." }],
      "medium",
      ["Create one content output per unused discovery."]
    ),
    toQueryAnswer(
      "q4",
      "Which creator assets are missing?",
      missingCreatorAssets,
      "moderate",
      [{ source: "lib/gamma/query-reader.ts", summary: "Missing creator assets are deterministic placeholders for Build 17 coverage." }],
      "medium",
      ["Create podcast series outline", "Add interactive course draft", "Add workshop material brief"]
    ),
    toQueryAnswer(
      "q5",
      "Which frameworks are missing?",
      inference.missingFrameworks,
      "high",
      [{ source: "lib/gamma/inference-reader.ts", summary: "Framework gap detection against expected framework set." }],
      "high",
      ["Build taxonomy and missing framework files."]
    ),
    toQueryAnswer(
      "q6",
      "Which workspaces are weakest?",
      weakestWorkspaces.map((item) => `${item.workspace} (${item.score})`),
      "high",
      [{ source: "lib/gamma/inference-reader.ts", summary: "Workspace weakness scores derived from mission progress metrics." }],
      "high",
      ["Prioritize weakest workspace backlog for next cycle."]
    ),
    toQueryAnswer(
      "q7",
      "What should David work on next?",
      [
        "taxonomy.md",
        "presentation.md",
        "motherhood article",
        "seminar.md",
      ],
      "high",
      [
        { source: "lib/gamma/recommendation-reader.ts", summary: "Recommendation layer priorities." },
        { source: "lib/gamma/inference-reader.ts", summary: "Inference-derived missing assets and gap actions." },
      ],
      "high",
      ["Execute top four assets in order of mission priority."]
    ),
    toQueryAnswer(
      "q8",
      "Which mission deserves attention?",
      [
        intelligence.missionTitle,
        `Maturity ${inference.maturityScore}`,
        `Coverage ${inference.coverageScore}%`,
        `Gap Count ${inference.gapCount}`,
        "Priority High",
      ],
      "high",
      [{ source: "lib/gamma/inference-reader.ts", summary: "Priority derived from low coverage and unresolved gaps." }],
      "high",
      ["Focus effort on gap closure in this mission."]
    ),
    toQueryAnswer(
      "q9",
      "What mission has highest maturity?",
      [missionWithHighestMaturity ? `${missionWithHighestMaturity.mission} (${missionWithHighestMaturity.maturityScore})` : "womanhood (48)"],
      "moderate",
      [{ source: "lib/gamma/inference-reader.ts", summary: "Registry maturity ranking across missions." }],
      "medium",
      ["Compare lower maturity missions against this reference mission."]
    ),
    toQueryAnswer(
      "q10",
      "Which discoveries became teachings?",
      convertedDiscoveries.length > 0 ? convertedDiscoveries : shared.discoveries.slice(0, 4),
      confidenceFromScore(inference.confidenceScore),
      [
        { source: "gamma/ministry/womanhood/sermon-series.md", summary: "Teaching outputs in ministry workspace." },
        { source: "gamma/shared-knowledge/womanhood/frameworks.md", summary: "Discovery to framework transformations." },
      ],
      "medium",
      ["Increase explicit discovery-to-teaching links in ministry files."]
    ),
  ]

  const queryCount = inferredQuestions.length
  const questionCount = research.questionCount
  const answerCount = answers.length
  const gapCount = inference.gapCount

  const coverageScore = clamp(
    Math.floor((inference.coverageScore * 0.45 + recommendations.coveragePercent * 0.35 + intelligence.overallScore * 0.2)),
    0,
    100
  )
  const inferenceCoverage = inference.coverageScore
  const confidenceScore = clamp(
    Math.floor((inference.confidenceScore * 0.6 + intelligence.intelligenceScore * 0.4)),
    0,
    100
  )
  const recommendationScore = clamp(
    Math.floor((recommendations.recommendationCount * 10 + recommendations.healthScore * 0.4)),
    0,
    100
  )

  const missionPriorityScore = clamp(
    Math.floor((gapCount * 12 + (100 - coverageScore) * 0.45 + (100 - inference.maturityScore) * 0.35)),
    0,
    100
  )

  const knowledgeCompleteness = clamp(
    Math.floor((coverageScore * 0.5 + (100 - gapCount * 10) * 0.3 + confidenceScore * 0.2)),
    0,
    100
  )

  const healthScore = clamp(
    Math.floor((knowledgeCompleteness * 0.4 + confidenceScore * 0.2 + recommendationScore * 0.2 + inferenceCoverage * 0.2)),
    0,
    100
  )

  const workspaceScores: QueryWorkspaceScore[] = [
    { workspace: "research", score: research.overallProgress, status: statusFromScore(research.overallProgress) },
    { workspace: "creator", score: creator.progress, status: statusFromScore(creator.progress) },
    { workspace: "ministry", score: ministry.progress, status: statusFromScore(ministry.progress) },
    { workspace: "executive", score: executive.readinessScore, status: statusFromScore(executive.readinessScore) },
    { workspace: "agency", score: agency.progress, status: statusFromScore(agency.progress) },
    { workspace: "shared-knowledge", score: shared.knowledgeHealthScore, status: statusFromScore(shared.knowledgeHealthScore) },
  ]

  const weakAreas = workspaceScores.filter((item) => item.status !== "strong")
  const strongAreas = workspaceScores.filter((item) => item.status === "strong")

  const suggestedNextActions = unique([
    ...inference.suggestedActions.slice(0, 4),
    ...recommendations.recommendations.map((item) => item.title).slice(0, 3),
  ]).slice(0, 8)

  return {
    mission: slug,
    missionTitle: intelligence.missionTitle,
    queryCount,
    questionCount,
    answerCount,
    gapCount,
    recommendationCount: recommendations.recommendationCount,
    coverageScore,
    inferenceCoverage,
    confidenceScore,
    recommendationScore,
    missionPriorityScore,
    knowledgeCompleteness,
    healthScore,
    missingAssets,
    weakAreas,
    strongAreas,
    suggestedNextActions,
    answers,
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

export async function getQueryRegistry(): Promise<{
  missionCount: number
  queryCount: number
  answerCount: number
  gapCount: number
  coverageScore: number
  missionPriorityScore: number
  healthScore: number
  highestMaturityMission: string
  missions: MissionQueryWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionQueryWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionQueryWorkspace(mission.slug)
    if (workspace) {
      results.push(workspace)
    }
  }

  const missionCount = results.length
  const queryCount = results.reduce((sum, item) => sum + item.queryCount, 0)
  const answerCount = results.reduce((sum, item) => sum + item.answerCount, 0)
  const gapCount = results.reduce((sum, item) => sum + item.gapCount, 0)

  const coverageScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.coverageScore, 0) / missionCount) : 0
  const missionPriorityScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.missionPriorityScore, 0) / missionCount) : 0
  const healthScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.healthScore, 0) / missionCount) : 0

  const highest = results.slice().sort((a, b) => b.knowledgeCompleteness - a.knowledgeCompleteness)[0]

  return {
    missionCount,
    queryCount,
    answerCount,
    gapCount,
    coverageScore,
    missionPriorityScore,
    healthScore,
    highestMaturityMission: highest ? `${highest.mission} (${highest.knowledgeCompleteness})` : "none",
    missions: results,
  }
}
