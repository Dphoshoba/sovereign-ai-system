import { generateExecutiveOpportunities } from "@/lib/executive/opportunities"
import {
  getExecutivePlatformSnapshot,
  type ExecutivePlatformSnapshot,
} from "@/lib/executive/platform-snapshot"
import { generateExecutiveRisks } from "@/lib/executive/risks"
import { prisma } from "@/lib/prisma"

// Phase 25 — Boardroom Execution & Outcome Engine.
// Tracks approved boardroom decisions through implementation and measures
// real outcomes deterministically. No OpenAI. Read-only.

export type DecisionExecutionStatus =
  | "Draft"
  | "Ready For Boardroom"
  | "Approved"
  | "Rejected"
  | "Deferred"
  | "In Progress"
  | "Implemented"

export type DecisionExecutionRecord = {
  decisionId: string
  title: string
  status: DecisionExecutionStatus
  implementationProgress: number
  executionHealth: number
  expectedImpact: string
  actualImpact: string
  effectivenessScore: number
  confidence: number
  outcomeSummary: string
}

export type DecisionExecutionSummary = {
  total: number
  approved: number
  implemented: number
  deferred: number
  averageEffectiveness: number
  highestImpactDecision: string | null
  lowestImpactDecision: string | null
}

type DecisionRow = {
  id: string
  title: string
  description: string | null
  category: string | null
  status: string
  outcome: string | null
  effectiveness: number | null
  impactArea: string | null
  createdAt: Date
  updatedAt: Date
}

type InitiativeRow = {
  id: string
  title: string
  status: string
  progress: number
  ownerSystem: string | null
}

type GoalRow = {
  id: string
  title: string
  category: string | null
  progress: number
}

export type DecisionExecutionContext = {
  snapshot: ExecutivePlatformSnapshot
  linkedInitiatives: InitiativeRow[]
  linkedGoals: GoalRow[]
  activeRiskCount: number
  averageOpportunityScore: number
}

const DEFERRED_AFTER_DAYS = 30
const ACTIVE_INITIATIVE_STATUSES = new Set(["in_progress", "proposed", "active"])
const COMPLETED_INITIATIVE_STATUSES = new Set(["completed", "done"])

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function normalizeFocus(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase()
  return normalized || null
}

/** Normalize recorded effectiveness to 0-100 (seed data uses 1-5). */
function normalizeRecordedEffectiveness(value: number | null) {
  if (value === null) {
    return null
  }

  return clampScore(value <= 5 ? value * 20 : value)
}

function daysSince(date: Date) {
  return Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000))
}

function average(values: number[]) {
  return values.length > 0
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null
}

/** Resolve a decision's execution status from its record and linked initiatives. */
function resolveExecutionStatus(
  decision: DecisionRow,
  linkedInitiatives: InitiativeRow[]
): DecisionExecutionStatus {
  if (decision.status === "rejected") {
    return "Rejected"
  }

  if (decision.status === "implemented") {
    return "Implemented"
  }

  const stale = daysSince(decision.updatedAt) > DEFERRED_AFTER_DAYS

  if (decision.status === "approved") {
    const hasCompleted = linkedInitiatives.some((initiative) =>
      COMPLETED_INITIATIVE_STATUSES.has(initiative.status)
    )
    const hasActive = linkedInitiatives.some((initiative) =>
      ACTIVE_INITIATIVE_STATUSES.has(initiative.status)
    )

    if (hasCompleted && !hasActive) {
      return "Implemented"
    }

    if (hasActive) {
      return "In Progress"
    }

    return stale ? "Deferred" : "Approved"
  }

  if (decision.status === "proposed") {
    return stale ? "Deferred" : "Ready For Boardroom"
  }

  return "Draft"
}

/**
 * Effectiveness score (0-100) from revenue improvement, goal progress,
 * initiative completion, risk reduction, and opportunity conversion.
 * Recorded effectiveness, when present, anchors 40% of the score.
 */
export function calculateDecisionEffectiveness(
  decision: DecisionRow,
  context: DecisionExecutionContext
): number {
  const { snapshot } = context

  const revenueComponent =
    snapshot.totalInvoiced > 0
      ? (snapshot.totalPaid / snapshot.totalInvoiced) * 100
      : 50

  const goalComponent =
    average(context.linkedGoals.map((goal) => goal.progress)) ?? 50

  const initiativeComponent =
    average(
      context.linkedInitiatives.map((initiative) => initiative.progress)
    ) ?? 50

  const riskComponent = clampScore(100 - context.activeRiskCount * 10)

  const opportunityComponent = context.averageOpportunityScore

  // Weight the area the decision targets slightly higher.
  const focus = normalizeFocus(decision.impactArea) ?? normalizeFocus(decision.category) ?? ""
  const revenueWeight = focus.includes("revenue") ? 0.3 : 0.2
  const growthWeight = focus.includes("growth") ? 0.25 : 0.15
  const remaining = 1 - revenueWeight - growthWeight

  const computed =
    revenueComponent * revenueWeight +
    opportunityComponent * growthWeight +
    goalComponent * (remaining * 0.4) +
    initiativeComponent * (remaining * 0.4) +
    riskComponent * (remaining * 0.2)

  const recorded = normalizeRecordedEffectiveness(decision.effectiveness)

  return clampScore(
    recorded !== null ? recorded * 0.4 + computed * 0.6 : computed
  )
}

/** Deterministic outcome description for a decision's current execution state. */
export function calculateDecisionOutcome(
  decision: DecisionRow,
  status: DecisionExecutionStatus,
  effectivenessScore: number,
  context: DecisionExecutionContext
): { actualImpact: string; outcomeSummary: string } {
  if (decision.outcome?.trim()) {
    return {
      actualImpact: decision.outcome.trim(),
      outcomeSummary: `Recorded outcome: ${decision.outcome.trim()} (effectiveness ${effectivenessScore}/100).`,
    }
  }

  switch (status) {
    case "Rejected":
      return {
        actualImpact: "None — decision was rejected before implementation.",
        outcomeSummary: "Rejected at boardroom level. No outcome to measure.",
      }
    case "Implemented":
      return {
        actualImpact: `Implemented with ${effectivenessScore}/100 measured effectiveness across revenue, goals, initiatives, and risk posture.`,
        outcomeSummary: `Implemented. Effectiveness ${effectivenessScore}/100${context.linkedInitiatives.length > 0 ? ` via ${context.linkedInitiatives.length} linked initiative${context.linkedInitiatives.length === 1 ? "" : "s"}` : ""}.`,
      }
    case "In Progress": {
      const progress =
        average(
          context.linkedInitiatives.map((initiative) => initiative.progress)
        ) ?? 0

      return {
        actualImpact: `Partial — linked initiatives at ${Math.round(progress)}% average progress.`,
        outcomeSummary: `Execution underway through ${context.linkedInitiatives.length} linked initiative${context.linkedInitiatives.length === 1 ? "" : "s"}; outcome not yet final.`,
      }
    }
    case "Deferred":
      return {
        actualImpact: "None yet — no execution activity recorded in 30+ days.",
        outcomeSummary:
          "Deferred: decision has stalled without implementation activity. Revisit at the next boardroom session.",
      }
    default:
      return {
        actualImpact: "Not yet measurable — awaiting approval or execution.",
        outcomeSummary: `${status}: outcome will be measured once execution starts.`,
      }
  }
}

function resolveImplementationProgress(
  status: DecisionExecutionStatus,
  linkedInitiatives: InitiativeRow[]
): number {
  switch (status) {
    case "Implemented":
      return 100
    case "Rejected":
      return 0
    case "In Progress": {
      const progress =
        average(linkedInitiatives.map((initiative) => initiative.progress)) ??
        25
      return clampScore(Math.max(10, Math.min(90, progress)))
    }
    case "Approved":
      return 25
    case "Deferred":
      return clampScore(
        average(linkedInitiatives.map((initiative) => initiative.progress)) ??
          10
      )
    case "Ready For Boardroom":
      return 10
    default:
      return 0
  }
}

/** Link a decision to initiatives/goals by shared focus (same rule as the knowledge graph). */
function linkByFocus(
  decision: DecisionRow,
  initiatives: InitiativeRow[],
  goals: GoalRow[]
) {
  const focus = new Set(
    [normalizeFocus(decision.category), normalizeFocus(decision.impactArea)]
      .filter((value): value is string => Boolean(value))
  )

  const linkedInitiatives =
    focus.size > 0
      ? initiatives.filter((initiative) => {
          const ownerSystem = normalizeFocus(initiative.ownerSystem)
          return ownerSystem !== null && focus.has(ownerSystem)
        })
      : []

  const linkedGoals =
    focus.size > 0
      ? goals.filter((goal) => {
          const category = normalizeFocus(goal.category)
          return category !== null && focus.has(category)
        })
      : []

  return { linkedInitiatives, linkedGoals }
}

export async function generateExecutionTracker(): Promise<
  DecisionExecutionRecord[]
> {
  const [decisions, initiatives, goals, snapshot, risks, opportunities] =
    await Promise.all([
      prisma.executiveDecision.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.strategicInitiative.findMany(),
      prisma.quarterlyGoal.findMany(),
      getExecutivePlatformSnapshot(),
      generateExecutiveRisks(),
      generateExecutiveOpportunities(),
    ])

  const averageOpportunityScore =
    average(opportunities.map((opportunity) => opportunity.score)) ?? 50

  const records: DecisionExecutionRecord[] = []

  for (const decision of decisions) {
    const { linkedInitiatives, linkedGoals } = linkByFocus(
      decision,
      initiatives,
      goals
    )

    const context: DecisionExecutionContext = {
      snapshot,
      linkedInitiatives,
      linkedGoals,
      activeRiskCount: risks.length,
      averageOpportunityScore,
    }

    const status = resolveExecutionStatus(decision, linkedInitiatives)
    const implementationProgress = resolveImplementationProgress(
      status,
      linkedInitiatives
    )
    const effectivenessScore = calculateDecisionEffectiveness(
      decision,
      context
    )
    const { actualImpact, outcomeSummary } = calculateDecisionOutcome(
      decision,
      status,
      effectivenessScore,
      context
    )

    // Execution health: progress + effectiveness, penalized when stale.
    const staleness = daysSince(decision.updatedAt)
    const stalenessPenalty =
      status === "Implemented" || status === "Rejected"
        ? 0
        : Math.min(20, Math.max(0, staleness - DEFERRED_AFTER_DAYS))

    const executionHealth = clampScore(
      implementationProgress * 0.5 +
        effectivenessScore * 0.5 -
        stalenessPenalty
    )

    // Confidence rises with recorded evidence and execution linkage.
    const hasOutcome = Boolean(decision.outcome?.trim())
    const hasEffectiveness = decision.effectiveness !== null
    const baseConfidence =
      hasOutcome && hasEffectiveness ? 0.85 : hasOutcome || hasEffectiveness ? 0.65 : 0.45
    const confidence =
      Math.round(
        Math.min(0.95, baseConfidence + (linkedInitiatives.length > 0 ? 0.1 : 0)) *
          100
      ) / 100

    const expectedImpact =
      decision.description?.trim() ||
      `${decision.impactArea ?? decision.category ?? "Operational"} improvement expected from "${decision.title}".`

    records.push({
      decisionId: decision.id,
      title: decision.title,
      status,
      implementationProgress,
      executionHealth,
      expectedImpact,
      actualImpact,
      effectivenessScore,
      confidence,
      outcomeSummary,
    })
  }

  return records.sort(
    (a, b) =>
      b.effectivenessScore - a.effectivenessScore ||
      b.executionHealth - a.executionHealth ||
      a.title.localeCompare(b.title)
  )
}

export function summarizeExecutionTracker(
  records: DecisionExecutionRecord[]
): DecisionExecutionSummary {
  const averageEffectiveness =
    records.length > 0
      ? Math.round(
          records.reduce((sum, item) => sum + item.effectivenessScore, 0) /
            records.length
        )
      : 0

  return {
    total: records.length,
    approved: records.filter(
      (item) => item.status === "Approved" || item.status === "In Progress"
    ).length,
    implemented: records.filter((item) => item.status === "Implemented")
      .length,
    deferred: records.filter((item) => item.status === "Deferred").length,
    averageEffectiveness,
    highestImpactDecision: records[0]?.title ?? null,
    lowestImpactDecision:
      records.length > 0 ? records[records.length - 1].title : null,
  }
}
