import type { StrategicSimulationResult } from "@/lib/executive/strategic-simulation"

export type SimulationStrategyInitiative = {
  title: string
  description: string
  priority: string
  actions: string[]
}

export type SimulationStrategyGoal = {
  title: string
  description: string | null
  category: string | null
  targetValue: number | null
}

export type SimulationStrategy = {
  title: string
  summary: string
  impactScore: number
  recommendation: string
  initiatives: SimulationStrategyInitiative[]
  goals: SimulationStrategyGoal[]
  actions: string[]
}

type ScenarioStrategyTemplate = {
  title: string
  initiativeTitle: string
  category: string
  buildSummary: (simulation: StrategicSimulationResult) => string
  buildRecommendation: (simulation: StrategicSimulationResult) => string
  buildInitiatives: (
    simulation: StrategicSimulationResult
  ) => SimulationStrategyInitiative[]
  buildGoals: (simulation: StrategicSimulationResult) => SimulationStrategyGoal[]
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function parseDelta(value: string | number) {
  if (typeof value === "number") {
    return value
  }

  const parsed = Number(String(value).replace(/[^0-9-]/g, ""))

  return Number.isNaN(parsed) ? 0 : parsed
}

export function computeSimulationImpactScore(
  simulation: StrategicSimulationResult
) {
  let scoreImprovement = 0
  let scoreCount = 0

  for (const key of Object.keys(simulation.baseline)) {
    if (!key.toLowerCase().includes("score")) {
      continue
    }

    const baseline = Number(simulation.baseline[key])
    const simulated = Number(simulation.simulated[key])

    if (!Number.isNaN(baseline) && !Number.isNaN(simulated)) {
      scoreImprovement += simulated - baseline
      scoreCount += 1
    }
  }

  if (scoreCount > 0) {
    return clampScore(50 + scoreImprovement)
  }

  let deltaSum = 0

  for (const [key, value] of Object.entries(simulation.estimatedImpact)) {
    if (key.toLowerCase().includes("delta")) {
      deltaSum += parseDelta(value)
    }
  }

  return clampScore(50 + deltaSum)
}

function uniqueActions(values: string[]) {
  return [...new Set(values.filter(Boolean))]
}

const SCENARIO_TEMPLATES: Record<string, ScenarioStrategyTemplate> = {
  "double-subscribers": {
    title: "Audience Growth Strategy",
    initiativeTitle: "Audience Growth Initiative",
    category: "growth",
    buildSummary: (simulation) =>
      `Convert the ${simulation.scenarioLabel} simulation into a subscriber growth plan targeting ${simulation.simulated.totalSubscribers ?? simulation.baseline.totalSubscribers} total subscribers.`,
    buildRecommendation: (simulation) =>
      simulation.recommendedActions[0] ??
      "Launch lead magnets and newsletter CTAs to accelerate audience growth.",
    buildInitiatives: (simulation) => [
      {
        title: "Audience Growth Initiative",
        description:
          "Expand subscriber acquisition through lead magnets, newsletter promotion, and publishing CTAs.",
        priority: "high",
        actions: uniqueActions([
          "Review growth dashboard and top-performing acquisition channels.",
          "Launch a subscriber acquisition push via lead magnets and newsletter CTAs.",
          ...simulation.recommendedActions,
        ]).slice(0, 4),
      },
      {
        title: "Newsletter Promotion Initiative",
        description:
          "Promote newsletter signup across published content and lead magnet flows.",
        priority: "medium",
        actions: [
          "Add newsletter CTAs to high-traffic articles.",
          "Promote the top lead magnet in the next newsletter send.",
        ],
      },
    ],
    buildGoals: (simulation) => [
      {
        title: "Grow subscriber base",
        description: `Increase total subscribers from ${simulation.baseline.totalSubscribers} toward ${simulation.simulated.totalSubscribers}.`,
        category: "growth",
        targetValue:
          typeof simulation.simulated.totalSubscribers === "number"
            ? simulation.simulated.totalSubscribers
            : null,
      },
      {
        title: "Improve growth health score",
        description: `Raise growth health from ${simulation.baseline.growthHealthScore} toward ${simulation.simulated.growthHealthScore}.`,
        category: "growth",
        targetValue:
          typeof simulation.simulated.growthHealthScore === "number"
            ? simulation.simulated.growthHealthScore
            : null,
      },
    ],
  },
  "collect-outstanding-revenue": {
    title: "Revenue Collection Strategy",
    initiativeTitle: "Collections Initiative",
    category: "revenue",
    buildSummary: (simulation) =>
      `Convert the ${simulation.scenarioLabel} simulation into a collections plan for outstanding client revenue.`,
    buildRecommendation: (simulation) =>
      simulation.recommendedActions[0] ??
      "Follow up on sent and overdue invoices from the revenue dashboard.",
    buildInitiatives: (simulation) => [
      {
        title: "Collections Initiative",
        description:
          "Collect outstanding and overdue invoice revenue through structured follow-up.",
        priority: "high",
        actions: uniqueActions([
          "Follow up on outstanding and overdue invoices this week.",
          "Convert proposal-ready leads to reduce future outstanding revenue risk.",
          ...simulation.recommendedActions,
        ]).slice(0, 4),
      },
    ],
    buildGoals: (simulation) => [
      {
        title: "Collect outstanding revenue",
        description: "Move outstanding invoice revenue to paid status.",
        category: "revenue",
        targetValue:
          typeof simulation.baseline.outstandingRevenue === "number"
            ? 0
            : null,
      },
      {
        title: "Improve revenue health score",
        description: `Raise revenue health from ${simulation.baseline.revenueHealthScore} toward ${simulation.simulated.revenueHealthScore}.`,
        category: "revenue",
        targetValue:
          typeof simulation.simulated.revenueHealthScore === "number"
            ? simulation.simulated.revenueHealthScore
            : null,
      },
    ],
  },
  "clear-overdue-tasks": {
    title: "Delivery Excellence Strategy",
    initiativeTitle: "Delivery Excellence Initiative",
    category: "delivery",
    buildSummary: (simulation) =>
      `Convert the ${simulation.scenarioLabel} simulation into a delivery cleanup and excellence plan.`,
    buildRecommendation: (simulation) =>
      simulation.recommendedActions[0] ??
      "Assign owners to overdue tasks in the delivery dashboard.",
    buildInitiatives: (simulation) => [
      {
        title: "Delivery Excellence Initiative",
        description:
          "Clear overdue delivery tasks and stabilize client project execution.",
        priority: "high",
        actions: uniqueActions([
          "Review delivery dashboard for project health and task backlog.",
          "Assign owners to overdue tasks and reset delivery timelines.",
          ...simulation.recommendedActions,
        ]).slice(0, 4),
      },
      {
        title: "At-Risk Project Escalation",
        description:
          "Escalate at-risk projects before due dates pass to protect delivery health.",
        priority: "medium",
        actions: [
          "Escalate at-risk projects before due dates pass.",
          "Review open tasks on active client projects.",
        ],
      },
    ],
    buildGoals: (simulation) => [
      {
        title: "Clear overdue delivery tasks",
        description: `Reduce overdue tasks from ${simulation.baseline.overdueTasks} to 0.`,
        category: "delivery",
        targetValue: 0,
      },
      {
        title: "Improve delivery health score",
        description: `Raise delivery health from ${simulation.baseline.deliveryHealthScore} toward ${simulation.simulated.deliveryHealthScore}.`,
        category: "delivery",
        targetValue:
          typeof simulation.simulated.deliveryHealthScore === "number"
            ? simulation.simulated.deliveryHealthScore
            : null,
      },
    ],
  },
  "complete-active-initiatives": {
    title: "Execution Acceleration Strategy",
    initiativeTitle: "Execution Acceleration Initiative",
    category: "execution",
    buildSummary: (simulation) =>
      `Convert the ${simulation.scenarioLabel} simulation into an execution acceleration plan for strategic initiatives.`,
    buildRecommendation: (simulation) =>
      simulation.recommendedActions[0] ??
      "Review active initiatives in the execution engine and close completed work.",
    buildInitiatives: (simulation) => [
      {
        title: "Execution Acceleration Initiative",
        description:
          "Complete active strategic initiatives and sync goal progress from execution outcomes.",
        priority: "high",
        actions: uniqueActions([
          "Review active initiatives in the execution engine and close completed work.",
          "Sync quarterly goal progress after initiative completion.",
          ...simulation.recommendedActions,
        ]).slice(0, 4),
      },
    ],
    buildGoals: (simulation) => [
      {
        title: "Complete active initiatives",
        description: `Move ${simulation.baseline.activeInitiatives} active initiative(s) to completed status.`,
        category: "execution",
        targetValue:
          typeof simulation.simulated.completedInitiatives === "number"
            ? simulation.simulated.completedInitiatives
            : null,
      },
      {
        title: "Raise initiative completion rate",
        description: `Increase completion rate from ${simulation.baseline.completionRate}% to ${simulation.simulated.completionRate}%.`,
        category: "execution",
        targetValue:
          typeof simulation.simulated.completionRate === "number"
            ? simulation.simulated.completionRate
            : null,
      },
    ],
  },
  "increase-lead-magnets": {
    title: "Lead Generation Strategy",
    initiativeTitle: "Lead Generation Initiative",
    category: "growth",
    buildSummary: (simulation) =>
      `Convert the ${simulation.scenarioLabel} simulation into a lead magnet expansion plan.`,
    buildRecommendation: (simulation) =>
      simulation.recommendedActions[0] ??
      "Create and publish new lead magnets from the admin lead magnets dashboard.",
    buildInitiatives: (simulation) => [
      {
        title: "Lead Generation Initiative",
        description:
          "Launch additional lead magnets and promote top-performing acquisition assets.",
        priority: "medium",
        actions: uniqueActions([
          "Create and publish new lead magnets from the admin lead magnets dashboard.",
          "Promote top-performing magnets through newsletter and blog CTAs.",
          ...simulation.recommendedActions,
        ]).slice(0, 4),
      },
    ],
    buildGoals: (simulation) => [
      {
        title: "Expand lead magnet portfolio",
        description: `Increase lead magnet count from ${simulation.baseline.leadMagnetCount} to ${simulation.simulated.leadMagnetCount}.`,
        category: "growth",
        targetValue:
          typeof simulation.simulated.leadMagnetCount === "number"
            ? simulation.simulated.leadMagnetCount
            : null,
      },
      {
        title: "Improve growth opportunity score",
        description: `Raise growth opportunity score from ${simulation.baseline.growthOpportunityScore} toward ${simulation.simulated.growthOpportunityScore}.`,
        category: "growth",
        targetValue:
          typeof simulation.simulated.growthOpportunityScore === "number"
            ? simulation.simulated.growthOpportunityScore
            : null,
      },
    ],
  },
  "complete-review-backlog": {
    title: "Content Operations Strategy",
    initiativeTitle: "Content Operations Initiative",
    category: "content",
    buildSummary: (simulation) =>
      `Convert the ${simulation.scenarioLabel} simulation into a content operations improvement plan.`,
    buildRecommendation: (simulation) =>
      simulation.recommendedActions[0] ??
      "Clear the editorial review queue in the articles admin.",
    buildInitiatives: (simulation) => [
      {
        title: "Content Operations Initiative",
        description:
          "Clear the editorial review backlog and restore publishing momentum.",
        priority: "high",
        actions: uniqueActions([
          "Clear the editorial review queue in the articles admin.",
          "Schedule approved content to maintain publishing momentum.",
          ...simulation.recommendedActions,
        ]).slice(0, 4),
      },
    ],
    buildGoals: (simulation) => [
      {
        title: "Clear editorial review backlog",
        description: `Reduce review-required articles from ${simulation.baseline.reviewRequiredCount} to 0.`,
        category: "content",
        targetValue: 0,
      },
      {
        title: "Improve content operations score",
        description: `Raise content operations score from ${simulation.baseline.contentOpsScore} toward ${simulation.simulated.contentOpsScore}.`,
        category: "content",
        targetValue:
          typeof simulation.simulated.contentOpsScore === "number"
            ? simulation.simulated.contentOpsScore
            : null,
      },
    ],
  },
}

export function convertSimulationToStrategy(
  simulation: StrategicSimulationResult
): SimulationStrategy {
  const template = SCENARIO_TEMPLATES[simulation.scenario]

  if (!template) {
    throw new Error(`Unsupported simulation scenario: ${simulation.scenario}`)
  }

  const impactScore = computeSimulationImpactScore(simulation)
  const initiatives = template.buildInitiatives(simulation).slice(0, 3)
  const goals = template.buildGoals(simulation)
  const actions = uniqueActions([
    ...simulation.recommendedActions,
    ...initiatives.flatMap((initiative) => initiative.actions),
  ]).slice(0, 8)

  return {
    title: template.title,
    summary: template.buildSummary(simulation),
    impactScore,
    recommendation: template.buildRecommendation(simulation),
    initiatives,
    goals,
    actions,
  }
}
