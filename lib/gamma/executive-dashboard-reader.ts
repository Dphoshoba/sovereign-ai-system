import { getMissionAdvisor } from "./advisor-reader"
import { getMissionGapAnalysis } from "./gap-analysis-reader"
import { getMissionKnowledgeGraph } from "./graph-reader"
import { getKnowledgeIntelligenceWorkspace } from "./knowledge-intelligence-reader"
import { getMissionMaturity } from "./maturity-reader"
import { getMissionPlanner } from "./planner-reader"
import { getResearchMissions } from "./research-registry"
import { getMissionRecommendations } from "./recommendation-reader"
import { getMissionRelationships } from "./relationship-reader"
import { getMissionReview } from "./review-reader"
import { getSecondBrainWorkspace } from "./second-brain-reader"
import { buildExecutiveDashboardRoadmap } from "../executive-dashboard/mock-data"
import type {
  ExecutiveDashboardDecision,
  ExecutiveDashboardOpportunity,
  ExecutiveDashboardPriority,
  ExecutiveDashboardRisk,
  MissionExecutiveDashboardWorkspace,
} from "../executive-dashboard/types"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

export async function getMissionExecutiveDashboard(slug: string): Promise<MissionExecutiveDashboardWorkspace | null> {
  const advisor = await getMissionAdvisor(slug)
  const planner = await getMissionPlanner(slug)
  const review = await getMissionReview(slug)
  const maturity = await getMissionMaturity(slug)
  const gap = await getMissionGapAnalysis(slug)
  const recommendations = await getMissionRecommendations(slug)
  const secondBrain = await getSecondBrainWorkspace(slug)
  const intelligence = await getKnowledgeIntelligenceWorkspace(slug)
  const relationships = await getMissionRelationships(slug)
  const graph = await getMissionKnowledgeGraph(slug)

  if (!advisor || !planner || !review || !maturity || !gap || !recommendations || !secondBrain || !intelligence || !relationships || !graph) {
    return null
  }

  const strategicAlignment = clamp(
    Math.floor((maturity.coverageScore * 0.35 + relationships.coverageScore * 0.25 + intelligence.overallScore * 0.2 + planner.roadmapScore * 0.2)),
    0,
    100
  )

  const knowledgeVelocity = clamp(
    Math.floor((intelligence.discoveryCount * 2 + review.improvementScore * 0.35 + secondBrain.brainScore * 0.25 + planner.momentum * 0.2)),
    0,
    100
  )

  const growthTrajectory = clamp(
    Math.floor((planner.deliveryScore * 0.35 + maturity.scalabilityScore * 0.25 + review.momentumScore * 0.2 + advisor.impactScore * 0.2)),
    0,
    100
  )

  const decisionQuality = clamp(
    Math.floor((planner.executionReadiness * 0.3 + maturity.readinessScore * 0.25 + (100 - review.overdueCount * 14) * 0.2 + intelligence.executiveCoverage * 0.25)),
    0,
    100
  )

  const missionRisk = clamp(
    Math.floor((review.regressionScore * 0.35 + gap.priorityScore * 0.2 + review.overdueCount * 12 + (100 - planner.healthScore) * 0.2)),
    0,
    100
  )

  const opportunityIndex = clamp(
    Math.floor((advisor.impactScore * 0.3 + maturity.reuseScore * 0.2 + recommendations.coveragePercent * 0.15 + knowledgeVelocity * 0.2 + (100 - missionRisk) * 0.15)),
    0,
    100
  )

  const capitalizationScore = clamp(
    Math.floor((maturity.commercialScore * 0.35 + planner.deliveryScore * 0.3 + advisor.executionScore * 0.2 + recommendations.readinessScore * 0.15)),
    0,
    100
  )

  const focusScore = clamp(
    Math.floor((advisor.missionFocusScore * 0.4 + planner.priorityScore * 0.3 + review.attentionScore * 0.1 + (100 - missionRisk) * 0.2)),
    0,
    100
  )

  const sustainabilityScore = clamp(
    Math.floor((maturity.scalabilityScore * 0.45 + review.healthScore * 0.25 + secondBrain.healthScore * 0.15 + intelligence.knowledgeHealthScore * 0.15)),
    0,
    100
  )

  const healthScore = clamp(
    Math.floor((review.healthScore * 0.35 + planner.healthScore * 0.25 + maturity.healthScore * 0.2 + intelligence.knowledgeHealthScore * 0.2)),
    0,
    100
  )

  const readinessScore = clamp(
    Math.floor((planner.executionReadiness * 0.3 + maturity.readinessScore * 0.35 + decisionQuality * 0.2 + (100 - review.overdueCount * 10) * 0.15)),
    0,
    100
  )

  const executiveScore = clamp(
    Math.floor((strategicAlignment * 0.16 + knowledgeVelocity * 0.08 + growthTrajectory * 0.1 + decisionQuality * 0.12 + (100 - missionRisk) * 0.14 + opportunityIndex * 0.1 + capitalizationScore * 0.1 + focusScore * 0.1 + sustainabilityScore * 0.1)),
    0,
    100
  )

  const priorityRadar: ExecutiveDashboardPriority[] = [
    {
      title: `Resolve highest ROI gap (${advisor.highestRoiGap})`,
      score: clamp(Math.floor(opportunityIndex * 0.4 + advisor.urgencyScore * 0.6), 0, 100),
      rationale: "Closing the highest ROI gap unlocks knowledge reuse and strategic continuity.",
    },
    {
      title: "Stabilize executive overdue tasks",
      score: clamp(Math.floor(missionRisk * 0.55 + review.attentionScore * 0.45), 0, 100),
      rationale: "Overdue executive work drives mission risk and blocks downstream delivery.",
    },
    {
      title: "Convert weekly tasks into delivery outcomes",
      score: clamp(Math.floor(planner.deliveryScore * 0.6 + growthTrajectory * 0.4), 0, 100),
      rationale: "Delivery execution is the main bridge from planning to mission value capture.",
    },
  ]

  const missionRisks: ExecutiveDashboardRisk[] = [
    {
      title: "Executive readiness lag",
      severity: review.overdueCount >= 2 ? "high" : "medium",
      score: clamp(Math.floor(missionRisk * 0.7 + (100 - maturity.readinessScore) * 0.3), 0, 100),
      mitigation: "Close overdue executive tasks and update decision queue first.",
    },
    {
      title: "Unanswered research pressure",
      severity: gap.unansweredQuestions > 10 ? "high" : "medium",
      score: clamp(Math.floor(gap.unansweredQuestions * 4 + (100 - strategicAlignment) * 0.25), 0, 100),
      mitigation: "Prioritize unresolved questions that block decisions and roadmap items.",
    },
    {
      title: "Dependency congestion",
      severity: planner.dependencyCount > 8 ? "medium" : "low",
      score: clamp(Math.floor(planner.dependencyCount * 7), 0, 100),
      mitigation: "Collapse dependencies by sequencing critical tasks into a single execution track.",
    },
  ]

  const opportunities: ExecutiveDashboardOpportunity[] = [
    {
      title: `Capitalize ${advisor.highestRoiGap}`,
      score: clamp(Math.floor(opportunityIndex * 0.55 + capitalizationScore * 0.45), 0, 100),
      value: "High reuse and strategic leverage",
      nextMove: `Prioritize build of ${advisor.highestRoiGap} and connect it to decision and teaching layers.`,
    },
    {
      title: "Package seminar and course pipeline",
      score: clamp(Math.floor(planner.deliveryScore * 0.5 + maturity.commercialScore * 0.5), 0, 100),
      value: "Converts planning into delivery and revenue surfaces",
      nextMove: "Complete seminar and promote course outline in the same weekly cycle.",
    },
    {
      title: "Increase discovery-to-decision throughput",
      score: clamp(Math.floor(decisionQuality * 0.45 + knowledgeVelocity * 0.55), 0, 100),
      value: "Raises strategic response speed and confidence",
      nextMove: "Map top discoveries to executive queue and close decision lag.",
    },
  ]

  const decisionQueue: ExecutiveDashboardDecision[] = [
    {
      title: "Approve highest ROI gap execution",
      workspace: "executive",
      priority: "high",
      rationale: "Unlocks alignment, opportunity, and readiness gains across the mission.",
    },
    {
      title: "Rebalance overdue executive tasks",
      workspace: "executive",
      priority: "high",
      rationale: "Directly reduces mission risk and improves decision quality.",
    },
    {
      title: "Sequence delivery for seminar and course outputs",
      workspace: "agency",
      priority: "medium",
      rationale: "Raises capitalization score through coordinated delivery packaging.",
    },
    {
      title: "Prioritize unanswered research questions by executive impact",
      workspace: "research",
      priority: "medium",
      rationale: "Improves strategic alignment and reduces regression pressure.",
    },
  ]

  const nextExecutiveMoves = unique([
    ...decisionQueue.slice(0, 3).map((item) => item.title),
    ...planner.executionPlan.slice(0, 2),
    ...advisor.topActions.slice(0, 2).map((item) => item.title),
  ]).slice(0, 8)

  const executiveSummary = [
    `Overall mission executive score is ${executiveScore}.`,
    `Strategic alignment is ${strategicAlignment} with mission risk at ${missionRisk}.`,
    `Opportunity index is ${opportunityIndex} and focus score is ${focusScore}.`,
    `Knowledge velocity is ${knowledgeVelocity} with growth trajectory at ${growthTrajectory}.`,
  ]

  return {
    mission: slug,
    missionTitle: advisor.missionTitle,
    executiveScore,
    strategicAlignment,
    knowledgeVelocity,
    growthTrajectory,
    decisionQuality,
    missionRisk,
    opportunityIndex,
    capitalizationScore,
    focusScore,
    sustainabilityScore,
    priorityCount: priorityRadar.length,
    decisionCount: decisionQueue.length + intelligence.decisionCount,
    riskCount: missionRisks.length,
    opportunityCount: opportunities.length,
    healthScore,
    readinessScore,
    executiveSummary,
    priorityRadar,
    missionRisks,
    opportunities,
    decisionQueue,
    nextExecutiveMoves,
    roadmap: buildExecutiveDashboardRoadmap(slug),
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

export async function getExecutiveDashboardRegistry(): Promise<{
  missionCount: number
  executiveScore: number
  strategicAlignment: number
  knowledgeVelocity: number
  growthTrajectory: number
  decisionQuality: number
  missionRisk: number
  opportunityIndex: number
  capitalizationScore: number
  focusScore: number
  sustainabilityScore: number
  priorityCount: number
  decisionCount: number
  riskCount: number
  opportunityCount: number
  healthScore: number
  readinessScore: number
  missions: MissionExecutiveDashboardWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: MissionExecutiveDashboardWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionExecutiveDashboard(mission.slug)
    if (workspace) {
      results.push(workspace)
    }
  }

  const missionCount = results.length
  const priorityCount = results.reduce((sum, item) => sum + item.priorityCount, 0)
  const decisionCount = results.reduce((sum, item) => sum + item.decisionCount, 0)
  const riskCount = results.reduce((sum, item) => sum + item.riskCount, 0)
  const opportunityCount = results.reduce((sum, item) => sum + item.opportunityCount, 0)

  const executiveScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.executiveScore, 0) / missionCount) : 0
  const strategicAlignment = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.strategicAlignment, 0) / missionCount) : 0
  const knowledgeVelocity = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.knowledgeVelocity, 0) / missionCount) : 0
  const growthTrajectory = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.growthTrajectory, 0) / missionCount) : 0
  const decisionQuality = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.decisionQuality, 0) / missionCount) : 0
  const missionRisk = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.missionRisk, 0) / missionCount) : 0
  const opportunityIndex = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.opportunityIndex, 0) / missionCount) : 0
  const capitalizationScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.capitalizationScore, 0) / missionCount) : 0
  const focusScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.focusScore, 0) / missionCount) : 0
  const sustainabilityScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.sustainabilityScore, 0) / missionCount) : 0
  const healthScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.healthScore, 0) / missionCount) : 0
  const readinessScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.readinessScore, 0) / missionCount) : 0

  return {
    missionCount,
    executiveScore,
    strategicAlignment,
    knowledgeVelocity,
    growthTrajectory,
    decisionQuality,
    missionRisk,
    opportunityIndex,
    capitalizationScore,
    focusScore,
    sustainabilityScore,
    priorityCount,
    decisionCount,
    riskCount,
    opportunityCount,
    healthScore,
    readinessScore,
    missions: results,
  }
}