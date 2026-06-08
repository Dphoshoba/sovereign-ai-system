import { buildKnowledgeGraphIntelligence } from "@/lib/executive/knowledge-graph-intelligence"
import {
  calculateInitiativePerformance,
  type InitiativePerformance,
} from "@/lib/executive/initiative-performance"
import {
  computeDeliveryHealthScore,
  getExecutivePlatformSnapshot,
  type ExecutivePlatformSnapshot,
} from "@/lib/executive/platform-snapshot"
import { prisma } from "@/lib/prisma"

export const STRATEGIC_SIMULATION_SCENARIOS = [
  {
    id: "double-subscribers",
    label: "Double Subscribers",
    description:
      "Simulate doubling the subscriber base and estimate growth health impact.",
  },
  {
    id: "collect-outstanding-revenue",
    label: "Collect Outstanding Revenue",
    description:
      "Simulate all outstanding invoices being paid and estimate revenue health impact.",
  },
  {
    id: "clear-overdue-tasks",
    label: "Clear Overdue Tasks",
    description:
      "Simulate clearing all overdue delivery tasks and estimate delivery health impact.",
  },
  {
    id: "complete-active-initiatives",
    label: "Complete Active Initiatives",
    description:
      "Simulate completing all active strategic initiatives and estimate performance impact.",
  },
  {
    id: "increase-lead-magnets",
    label: "Increase Lead Magnets",
    description:
      "Simulate adding two lead magnets and estimate growth opportunity impact.",
  },
  {
    id: "complete-review-backlog",
    label: "Complete Review Backlog",
    description:
      "Simulate clearing the editorial review backlog and estimate content operations impact.",
  },
] as const

export type StrategicSimulationScenarioId =
  (typeof STRATEGIC_SIMULATION_SCENARIOS)[number]["id"]

export type StrategicSimulationMetrics = Record<string, string | number>

export type StrategicSimulationResult = {
  scenario: string
  scenarioLabel: string
  baseline: StrategicSimulationMetrics
  simulated: StrategicSimulationMetrics
  estimatedImpact: StrategicSimulationMetrics
  benefits: string[]
  risks: string[]
  recommendedActions: string[]
}

type SimulationContext = {
  snapshot: ExecutivePlatformSnapshot
  initiativePerformance: InitiativePerformance
}

function formatAud(value: number) {
  return `AUD ${value.toLocaleString("en-AU")}`
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function computeGrowthHealthScore(snapshot: ExecutivePlatformSnapshot) {
  let score = 100

  if (snapshot.growthRate === 0) {
    score -= 20
  }

  if (snapshot.monthlySubscribers === 0) {
    score -= 15
  }

  if (snapshot.totalSubscribers < 50) {
    score -= 10
  }

  if (snapshot.leadMagnetCount === 0) {
    score -= 10
  }

  return clampScore(score)
}

function computeRevenueHealthScore(snapshot: ExecutivePlatformSnapshot) {
  let score = 100

  if (snapshot.outstandingRevenue > 0) {
    score -= 20
  }

  if (snapshot.openPipeline === 0) {
    score -= 15
  }

  score -= snapshot.overdueInvoices * 10

  return clampScore(score)
}

function computeContentOpsScore(snapshot: ExecutivePlatformSnapshot) {
  let score = 100

  score -= Math.min(snapshot.reviewRequiredCount * 5, 30)

  if (snapshot.scheduledCount === 0) {
    score -= 10
  }

  if (snapshot.draftCount > snapshot.publishedArticles) {
    score -= 10
  }

  return clampScore(score)
}

function computeGrowthOpportunityScore(snapshot: ExecutivePlatformSnapshot) {
  return clampScore(
    40 + snapshot.leadMagnetCount * 12 + Math.min(snapshot.leadMagnetSubscribers, 40)
  )
}

function deltaMetric(baseline: number, simulated: number) {
  const delta = simulated - baseline

  return {
    baseline,
    simulated,
    delta,
    label: `${delta >= 0 ? "+" : ""}${delta}`,
  }
}

function getScenarioMeta(scenario: string) {
  return (
    STRATEGIC_SIMULATION_SCENARIOS.find((item) => item.id === scenario) ?? null
  )
}

async function loadSimulationContext(): Promise<SimulationContext> {
  const [snapshot, goals, initiatives] = await Promise.all([
    getExecutivePlatformSnapshot(),
    prisma.quarterlyGoal.findMany(),
    prisma.strategicInitiative.findMany({
      select: {
        id: true,
        goalId: true,
        status: true,
        progress: true,
      },
    }),
  ])

  const initiativePerformance = calculateInitiativePerformance(
    initiatives,
    goals.map((goal) => ({
      id: goal.id,
      title: goal.title,
      targetValue: goal.targetValue,
      currentValue: goal.currentValue,
      progress: goal.progress,
      status: goal.status,
    }))
  )

  return {
    snapshot,
    initiativePerformance,
  }
}

function simulateDoubleSubscribers(snapshot: ExecutivePlatformSnapshot) {
  const baselineGrowthHealth = computeGrowthHealthScore(snapshot)
  const simulatedTotalSubscribers = snapshot.totalSubscribers * 2
  const simulatedGrowthRate =
    simulatedTotalSubscribers > 0
      ? Math.round(
          (snapshot.monthlySubscribers / simulatedTotalSubscribers) * 100
        )
      : 0

  const simulatedSnapshot: ExecutivePlatformSnapshot = {
    ...snapshot,
    totalSubscribers: simulatedTotalSubscribers,
    activeSubscribers: snapshot.activeSubscribers * 2,
    growthRate: simulatedGrowthRate,
  }

  const simulatedGrowthHealth = computeGrowthHealthScore(simulatedSnapshot)
  const growthDelta = deltaMetric(baselineGrowthHealth, simulatedGrowthHealth)

  return {
    baseline: {
      totalSubscribers: snapshot.totalSubscribers,
      growthRate: snapshot.growthRate,
      growthHealthScore: baselineGrowthHealth,
    },
    simulated: {
      totalSubscribers: simulatedTotalSubscribers,
      growthRate: simulatedGrowthRate,
      growthHealthScore: simulatedGrowthHealth,
    },
    estimatedImpact: {
      growthHealthScoreDelta: growthDelta.label,
      subscriberIncrease: simulatedTotalSubscribers - snapshot.totalSubscribers,
    },
    benefits: [
      `Subscriber base would increase from ${snapshot.totalSubscribers} to ${simulatedTotalSubscribers}.`,
      `Growth health score would move from ${baselineGrowthHealth} to ${simulatedGrowthHealth}.`,
    ],
    risks: [
      "Doubling subscribers without retention systems may reduce measured growth rate percentage.",
      "Audience quality and engagement are not modeled in this simulation.",
    ],
    recommendedActions: [
      "Launch lead magnets and newsletter CTAs to drive subscriber acquisition.",
      "Review growth dashboard after campaigns to compare actual vs simulated outcomes.",
    ],
  }
}

function simulateCollectOutstandingRevenue(snapshot: ExecutivePlatformSnapshot) {
  const baselineRevenueHealth = computeRevenueHealthScore(snapshot)
  const collectedAmount = snapshot.outstandingRevenue

  const simulatedSnapshot: ExecutivePlatformSnapshot = {
    ...snapshot,
    outstandingRevenue: 0,
    totalPaid: snapshot.totalPaid + collectedAmount,
    overdueInvoices: 0,
  }

  const simulatedRevenueHealth = computeRevenueHealthScore(simulatedSnapshot)
  const revenueDelta = deltaMetric(baselineRevenueHealth, simulatedRevenueHealth)

  return {
    baseline: {
      outstandingRevenue: collectedAmount,
      totalPaid: snapshot.totalPaid,
      revenueHealthScore: baselineRevenueHealth,
    },
    simulated: {
      outstandingRevenue: 0,
      totalPaid: snapshot.totalPaid + collectedAmount,
      revenueHealthScore: simulatedRevenueHealth,
    },
    estimatedImpact: {
      revenueHealthScoreDelta: revenueDelta.label,
      cashCollectedAud: collectedAmount,
    },
    benefits: [
      collectedAmount > 0
        ? `${formatAud(collectedAmount)} in outstanding revenue would convert to paid revenue.`
        : "No outstanding revenue is currently recorded to collect.",
      `Revenue health score would move from ${baselineRevenueHealth} to ${simulatedRevenueHealth}.`,
    ],
    risks: [
      "Simulation assumes full collection without payment delays or write-offs.",
      "Pipeline conversion is not included in this revenue collection scenario.",
    ],
    recommendedActions: [
      "Follow up on sent and overdue invoices from the revenue dashboard.",
      "Convert proposal-ready leads to reduce future outstanding revenue risk.",
    ],
  }
}

function simulateClearOverdueTasks(snapshot: ExecutivePlatformSnapshot) {
  const baselineDeliveryHealth = snapshot.deliveryHealthScore
  const simulatedDeliveryHealth = computeDeliveryHealthScore(
    0,
    snapshot.overdueInvoices,
    snapshot.atRiskProjects.length
  )
  const deliveryDelta = deltaMetric(
    baselineDeliveryHealth,
    simulatedDeliveryHealth
  )

  return {
    baseline: {
      overdueTasks: snapshot.overdueTasks,
      deliveryHealthScore: baselineDeliveryHealth,
    },
    simulated: {
      overdueTasks: 0,
      deliveryHealthScore: simulatedDeliveryHealth,
    },
    estimatedImpact: {
      deliveryHealthScoreDelta: deliveryDelta.label,
      overdueTasksCleared: snapshot.overdueTasks,
    },
    benefits: [
      `${snapshot.overdueTasks} overdue task${snapshot.overdueTasks === 1 ? "" : "s"} would be cleared.`,
      `Delivery health score would move from ${baselineDeliveryHealth} to ${simulatedDeliveryHealth}.`,
    ],
    risks: [
      "Clearing overdue tasks quickly may require reprioritizing active client work.",
      "At-risk projects would still affect delivery health until resolved.",
    ],
    recommendedActions: [
      "Assign owners to overdue tasks in the delivery dashboard.",
      "Escalate at-risk projects before due dates pass.",
    ],
  }
}

function simulateCompleteActiveInitiatives(
  initiativePerformance: InitiativePerformance
) {
  const baselineCompletionRate = initiativePerformance.completionRate
  const simulatedCompleted =
    initiativePerformance.completedInitiatives +
    initiativePerformance.activeInitiatives
  const simulatedCompletionRate =
    initiativePerformance.totalInitiatives > 0
      ? Math.round(
          (simulatedCompleted / initiativePerformance.totalInitiatives) * 100
        )
      : 0

  const completionDelta = deltaMetric(
    baselineCompletionRate,
    simulatedCompletionRate
  )

  return {
    baseline: {
      activeInitiatives: initiativePerformance.activeInitiatives,
      completedInitiatives: initiativePerformance.completedInitiatives,
      completionRate: baselineCompletionRate,
      initiativeHealth: initiativePerformance.initiativeHealth,
    },
    simulated: {
      activeInitiatives: 0,
      completedInitiatives: simulatedCompleted,
      completionRate: simulatedCompletionRate,
      initiativeHealth: "Excellent",
    },
    estimatedImpact: {
      completionRateDelta: completionDelta.label,
      initiativesCompleted: initiativePerformance.activeInitiatives,
    },
    benefits: [
      `${initiativePerformance.activeInitiatives} active initiative${initiativePerformance.activeInitiatives === 1 ? "" : "s"} would move to completed.`,
      `Initiative completion rate would move from ${baselineCompletionRate}% to ${simulatedCompletionRate}%.`,
    ],
    risks: [
      "Completing initiatives without verified outcomes may overstate execution progress.",
      `${initiativePerformance.blockedInitiatives} blocked initiative${initiativePerformance.blockedInitiatives === 1 ? "" : "s"} would remain outside this simulation.`,
    ],
    recommendedActions: [
      "Review active initiatives in the execution engine and close completed work.",
      "Sync quarterly goal progress after initiative completion.",
    ],
  }
}

function simulateIncreaseLeadMagnets(snapshot: ExecutivePlatformSnapshot) {
  const baselineOpportunityScore = computeGrowthOpportunityScore(snapshot)
  const simulatedLeadMagnetCount = snapshot.leadMagnetCount + 2

  const simulatedSnapshot: ExecutivePlatformSnapshot = {
    ...snapshot,
    leadMagnetCount: simulatedLeadMagnetCount,
  }

  const simulatedOpportunityScore =
    computeGrowthOpportunityScore(simulatedSnapshot)
  const opportunityDelta = deltaMetric(
    baselineOpportunityScore,
    simulatedOpportunityScore
  )

  return {
    baseline: {
      leadMagnetCount: snapshot.leadMagnetCount,
      leadMagnetSubscribers: snapshot.leadMagnetSubscribers,
      growthOpportunityScore: baselineOpportunityScore,
    },
    simulated: {
      leadMagnetCount: simulatedLeadMagnetCount,
      leadMagnetSubscribers: snapshot.leadMagnetSubscribers,
      growthOpportunityScore: simulatedOpportunityScore,
    },
    estimatedImpact: {
      growthOpportunityScoreDelta: opportunityDelta.label,
      leadMagnetsAdded: 2,
    },
    benefits: [
      `Lead magnet count would increase from ${snapshot.leadMagnetCount} to ${simulatedLeadMagnetCount}.`,
      `Growth opportunity score would move from ${baselineOpportunityScore} to ${simulatedOpportunityScore}.`,
    ],
    risks: [
      "New lead magnets require production effort and promotion before subscriber impact appears.",
      "This simulation does not model new subscriber acquisition from added magnets.",
    ],
    recommendedActions: [
      "Create and publish new lead magnets from the admin lead magnets dashboard.",
      "Promote top-performing magnets through newsletter and blog CTAs.",
    ],
  }
}

function simulateCompleteReviewBacklog(snapshot: ExecutivePlatformSnapshot) {
  const baselineContentOps = computeContentOpsScore(snapshot)

  const simulatedSnapshot: ExecutivePlatformSnapshot = {
    ...snapshot,
    reviewRequiredCount: 0,
    reviewRequiredArticles: [],
  }

  const simulatedContentOps = computeContentOpsScore(simulatedSnapshot)
  const contentDelta = deltaMetric(baselineContentOps, simulatedContentOps)

  return {
    baseline: {
      reviewRequiredCount: snapshot.reviewRequiredCount,
      scheduledCount: snapshot.scheduledCount,
      contentOpsScore: baselineContentOps,
    },
    simulated: {
      reviewRequiredCount: 0,
      scheduledCount: snapshot.scheduledCount,
      contentOpsScore: simulatedContentOps,
    },
    estimatedImpact: {
      contentOpsScoreDelta: contentDelta.label,
      articlesCleared: snapshot.reviewRequiredCount,
    },
    benefits: [
      `${snapshot.reviewRequiredCount} review-required article${snapshot.reviewRequiredCount === 1 ? "" : "s"} would be cleared.`,
      `Content operations score would move from ${baselineContentOps} to ${simulatedContentOps}.`,
    ],
    risks: [
      "Clearing review backlog quickly may reduce editorial quality if approvals are rushed.",
      "Scheduled publishing volume is unchanged in this simulation.",
    ],
    recommendedActions: [
      "Clear the editorial review queue in the articles admin.",
      "Schedule approved content to maintain publishing momentum.",
    ],
  }
}

function appendIntelligenceRecommendations(
  recommendations: string[],
  intelligence: Awaited<ReturnType<typeof buildKnowledgeGraphIntelligence>>
) {
  if (intelligence.goalGaps.length > 0) {
    recommendations.push(
      "Link quarterly goals without initiatives before relying on simulated execution gains."
    )
  }

  if (intelligence.totalNodes === 0) {
    recommendations.push(
      "Sync the executive knowledge graph to enrich simulation context."
    )
  }

  return recommendations.slice(0, 8)
}

export async function runStrategicSimulation(
  scenario: string
): Promise<StrategicSimulationResult> {
  const scenarioMeta = getScenarioMeta(scenario)

  if (!scenarioMeta) {
    throw new Error(`Unsupported simulation scenario: ${scenario}`)
  }

  const [{ snapshot, initiativePerformance }, intelligence] = await Promise.all([
    loadSimulationContext(),
    buildKnowledgeGraphIntelligence().catch(() => null),
  ])

  let result: Omit<
    StrategicSimulationResult,
    "scenario" | "scenarioLabel" | "recommendedActions"
  > & { recommendedActions: string[] }

  switch (scenario as StrategicSimulationScenarioId) {
    case "double-subscribers":
      result = simulateDoubleSubscribers(snapshot)
      break
    case "collect-outstanding-revenue":
      result = simulateCollectOutstandingRevenue(snapshot)
      break
    case "clear-overdue-tasks":
      result = simulateClearOverdueTasks(snapshot)
      break
    case "complete-active-initiatives":
      result = simulateCompleteActiveInitiatives(initiativePerformance)
      break
    case "increase-lead-magnets":
      result = simulateIncreaseLeadMagnets(snapshot)
      break
    case "complete-review-backlog":
      result = simulateCompleteReviewBacklog(snapshot)
      break
    default:
      throw new Error(`Unsupported simulation scenario: ${scenario}`)
  }

  return {
    scenario,
    scenarioLabel: scenarioMeta.label,
    baseline: result.baseline,
    simulated: result.simulated,
    estimatedImpact: result.estimatedImpact,
    benefits: result.benefits,
    risks: result.risks,
    recommendedActions: intelligence
      ? appendIntelligenceRecommendations(result.recommendedActions, intelligence)
      : result.recommendedActions,
  }
}

export function listStrategicSimulationScenarios() {
  return STRATEGIC_SIMULATION_SCENARIOS.map((scenario) => ({ ...scenario }))
}
