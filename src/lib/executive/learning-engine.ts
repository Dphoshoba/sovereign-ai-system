import { generateMonthlyExecutiveReview } from "@/lib/executive/autonomous-review"
import {
  generateExecutionTracker,
  type DecisionExecutionRecord,
  type DecisionExecutionStatus,
} from "@/lib/executive/decision-execution"
import { buildExecutiveMemory } from "@/lib/executive/memory"
import {
  deriveOperatingPrinciples,
  normalizeEffectivenessScale,
  type OperatingPrinciple,
} from "@/lib/executive/operating-principles"
import { generateStrategicAdjustments } from "@/lib/executive/strategy-adjustments"
import { prisma } from "@/lib/prisma"

// Phase 26 — Executive Learning Engine.
// Learns deterministically from decision outcomes, execution results, lessons,
// autonomous reviews, strategic adjustments, and the knowledge graph to
// improve future recommendations. No OpenAI.
//
// Two gathering modes:
// - lightweight (default for the API GET): direct, limited Prisma queries only.
//   No heavy aggregator chains, safe for serverless connection pools.
// - full: composes the execution tracker, executive memory, monthly review,
//   and strategy adjustments for the richest possible signal.

export type LearningLesson = {
  id: string
  title: string
  lesson: string
  impactArea: string | null
  effectiveness: number | null
}

export type LearningCategory = {
  category: string
  averageEffectiveness: number
  decisionCount: number
}

export type ExecutiveLearning = {
  topPerformingDecisions: DecisionExecutionRecord[]
  weakestDecisions: DecisionExecutionRecord[]
  topLessons: LearningLesson[]
  weakestLessons: LearningLesson[]
  strongestCategories: LearningCategory[]
  weakestCategories: LearningCategory[]
  successPatterns: string[]
  failurePatterns: string[]
  operatingPrinciples: OperatingPrinciple[]
  learningScore: number
  confidence: number
}

export type GenerateExecutiveLearningOptions = {
  lightweight?: boolean
}

const TOP_LIMIT = 5
const QUERY_LIMIT = 50
const DEFERRED_AFTER_DAYS = 30
const EXECUTED_STATUSES = new Set(["Approved", "In Progress", "Implemented"])
const ACTIVE_INITIATIVE_STATUSES = new Set(["in_progress", "proposed", "active"])
const COMPLETED_INITIATIVE_STATUSES = new Set(["completed", "done"])

type DecisionRow = {
  id: string
  title: string
  description: string | null
  category: string | null
  status: string
  outcome: string | null
  effectiveness: number | null
  impactArea: string | null
  updatedAt: Date
}

type LessonRow = {
  id: string
  title: string
  lesson: string
  impactArea: string | null
  effectiveness: number | null
  sourceDecisionId: string | null
}

type GoalRow = {
  id: string
  status: string
  progress: number
  category: string | null
}

type InitiativeRow = {
  goalId: string | null
  status: string
  progress: number
  ownerSystem: string | null
}

/** Everything the synthesis step needs, regardless of how it was gathered. */
type LearningSourceData = {
  decisions: DecisionRow[]
  lessons: LessonRow[]
  executionRecords: DecisionExecutionRecord[]
  goals: GoalRow[]
  initiatives: InitiativeRow[]
  totalGraphEdges: number
  rhythmCount: number
  reviewSuccessPatterns: string[]
  reviewFailurePatterns: string[]
  pipelineExceedsRevenue: boolean
  unpaidInvoiceCount: number
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function average(values: number[]) {
  return values.length > 0
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null
}

function normalizeFocus(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase()
  return normalized || null
}

function daysSince(date: Date) {
  return Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000))
}

/** Run a query with a fallback so one failure never sinks the whole engine. */
async function safe<T>(promise: Promise<T>, fallback: T, label: string) {
  try {
    return await promise
  } catch (error) {
    console.error(`Learning engine query failed (${label}):`, error)
    return fallback
  }
}

function buildCategoryRankings(
  decisions: { category: string | null; effectiveness: number | null }[]
): LearningCategory[] {
  const byCategory = new Map<string, number[]>()

  for (const decision of decisions) {
    const effectiveness = normalizeEffectivenessScale(decision.effectiveness)

    if (effectiveness === null) {
      continue
    }

    const category = decision.category?.trim() || "uncategorized"
    const scores = byCategory.get(category) ?? []
    scores.push(effectiveness)
    byCategory.set(category, scores)
  }

  return [...byCategory.entries()]
    .map(([category, scores]) => ({
      category,
      averageEffectiveness: Math.round(average(scores) ?? 0),
      decisionCount: scores.length,
    }))
    .sort(
      (a, b) =>
        b.averageEffectiveness - a.averageEffectiveness ||
        b.decisionCount - a.decisionCount ||
        a.category.localeCompare(b.category)
    )
}

// -----------------------------------------------------------------------------
// Lightweight execution records — derived from decision/initiative/goal rows
// already in hand, no extra queries. Mirrors the Phase 25 status rules.
// -----------------------------------------------------------------------------

function buildLightweightExecutionRecords(
  decisions: DecisionRow[],
  initiatives: InitiativeRow[],
  goals: GoalRow[]
): DecisionExecutionRecord[] {
  const records: DecisionExecutionRecord[] = []

  for (const decision of decisions) {
    const focus = new Set(
      [normalizeFocus(decision.category), normalizeFocus(decision.impactArea)]
        .filter((value): value is string => Boolean(value))
    )

    const linkedInitiatives = initiatives.filter((initiative) => {
      const ownerSystem = normalizeFocus(initiative.ownerSystem)
      return ownerSystem !== null && focus.has(ownerSystem)
    })
    const linkedGoals = goals.filter((goal) => {
      const category = normalizeFocus(goal.category)
      return category !== null && focus.has(category)
    })

    const stale = daysSince(decision.updatedAt) > DEFERRED_AFTER_DAYS

    let status: DecisionExecutionStatus = "Draft"

    if (decision.status === "rejected") {
      status = "Rejected"
    } else if (decision.status === "implemented") {
      status = "Implemented"
    } else if (decision.status === "approved") {
      const hasCompleted = linkedInitiatives.some((initiative) =>
        COMPLETED_INITIATIVE_STATUSES.has(initiative.status)
      )
      const hasActive = linkedInitiatives.some((initiative) =>
        ACTIVE_INITIATIVE_STATUSES.has(initiative.status)
      )

      status =
        hasCompleted && !hasActive
          ? "Implemented"
          : hasActive
            ? "In Progress"
            : stale
              ? "Deferred"
              : "Approved"
    } else if (decision.status === "proposed") {
      status = stale ? "Deferred" : "Ready For Boardroom"
    }

    const recorded = normalizeEffectivenessScale(decision.effectiveness)
    const linkedProgress =
      average([
        ...linkedInitiatives.map((initiative) => initiative.progress),
        ...linkedGoals.map((goal) => goal.progress),
      ]) ?? 50

    const effectivenessScore = Math.round(
      clamp(
        recorded !== null ? recorded * 0.6 + linkedProgress * 0.4 : linkedProgress,
        0,
        100
      )
    )

    const implementationProgress =
      status === "Implemented"
        ? 100
        : status === "Rejected"
          ? 0
          : status === "In Progress"
            ? Math.round(clamp(linkedProgress, 10, 90))
            : status === "Approved"
              ? 25
              : status === "Deferred"
                ? Math.round(clamp(linkedProgress, 0, 50))
                : 10

    const hasOutcome = Boolean(decision.outcome?.trim())
    const outcomeSummary = hasOutcome
      ? `Recorded outcome: ${decision.outcome?.trim()} (effectiveness ${effectivenessScore}/100).`
      : status === "Deferred"
        ? "Deferred: decision has stalled without implementation activity."
        : `${status}: effectiveness ${effectivenessScore}/100 based on linked execution progress.`

    records.push({
      decisionId: decision.id,
      title: decision.title,
      status,
      implementationProgress,
      executionHealth: Math.round(
        clamp(implementationProgress * 0.5 + effectivenessScore * 0.5, 0, 100)
      ),
      expectedImpact:
        decision.description?.trim() ||
        `${decision.impactArea ?? decision.category ?? "Operational"} improvement expected from "${decision.title}".`,
      actualImpact: hasOutcome
        ? (decision.outcome?.trim() as string)
        : "Not yet measured in lightweight mode.",
      effectivenessScore,
      confidence: hasOutcome ? 0.8 : 0.5,
      outcomeSummary,
    })
  }

  return records
}

// -----------------------------------------------------------------------------
// Data gathering.
// -----------------------------------------------------------------------------

/** Direct, limited Prisma queries only — production/serverless safe. */
async function gatherLightweightData(): Promise<LearningSourceData> {
  const [
    decisions,
    lessons,
    totalGraphEdges,
    goals,
    initiatives,
    boardroomCount,
    planningCount,
    unpaidInvoiceCount,
  ] = await Promise.all([
    safe(
      prisma.executiveDecision.findMany({
        orderBy: { createdAt: "desc" },
        take: QUERY_LIMIT,
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          status: true,
          outcome: true,
          effectiveness: true,
          impactArea: true,
          updatedAt: true,
        },
      }),
      [] as DecisionRow[],
      "decisions"
    ),
    safe(
      prisma.executiveLesson.findMany({
        orderBy: { createdAt: "desc" },
        take: QUERY_LIMIT,
        select: {
          id: true,
          title: true,
          lesson: true,
          impactArea: true,
          effectiveness: true,
          sourceDecisionId: true,
        },
      }),
      [] as LessonRow[],
      "lessons"
    ),
    safe(prisma.executiveKnowledgeEdge.count(), 0, "edge count"),
    safe(
      prisma.quarterlyGoal.findMany({
        take: QUERY_LIMIT,
        select: { id: true, status: true, progress: true, category: true },
      }),
      [] as GoalRow[],
      "goals"
    ),
    safe(
      prisma.strategicInitiative.findMany({
        take: QUERY_LIMIT,
        select: {
          goalId: true,
          status: true,
          progress: true,
          ownerSystem: true,
        },
      }),
      [] as InitiativeRow[],
      "initiatives"
    ),
    safe(prisma.executiveBoardroomSession.count(), 0, "boardroom count"),
    safe(prisma.planningCycle.count(), 0, "planning count"),
    safe(
      prisma.clientInvoice.count({ where: { status: { not: "paid" } } }),
      0,
      "unpaid invoices"
    ),
  ])

  return {
    decisions,
    lessons,
    executionRecords: buildLightweightExecutionRecords(
      decisions,
      initiatives,
      goals
    ),
    goals,
    initiatives,
    totalGraphEdges,
    rhythmCount: boardroomCount + planningCount,
    reviewSuccessPatterns: [],
    reviewFailurePatterns: [],
    pipelineExceedsRevenue: false,
    unpaidInvoiceCount,
  }
}

/** Full aggregator path — richest signal, for scripts and local analysis. */
async function gatherFullData(): Promise<LearningSourceData> {
  const [
    executionRecords,
    decisions,
    lessons,
    memory,
    review,
    adjustments,
    goals,
    initiatives,
  ] = await Promise.all([
    generateExecutionTracker(),
    prisma.executiveDecision.findMany({
      orderBy: { createdAt: "desc" },
      take: QUERY_LIMIT,
    }),
    prisma.executiveLesson.findMany({
      orderBy: { createdAt: "desc" },
      take: QUERY_LIMIT,
    }),
    buildExecutiveMemory(),
    generateMonthlyExecutiveReview(),
    generateStrategicAdjustments(),
    prisma.quarterlyGoal.findMany({ take: QUERY_LIMIT }),
    prisma.strategicInitiative.findMany({ take: QUERY_LIMIT }),
  ])

  return {
    decisions,
    lessons,
    executionRecords,
    goals,
    initiatives,
    totalGraphEdges: memory.graph.totalEdges,
    rhythmCount:
      memory.history.boardroomSessions.length +
      memory.history.planningCycles.length,
    reviewSuccessPatterns: review.recurringPatterns
      .filter(
        (pattern) => pattern.type === "decision" || pattern.type === "lesson"
      )
      .map((pattern) => pattern.pattern),
    reviewFailurePatterns: review.recurringPatterns
      .filter(
        (pattern) =>
          pattern.type === "risk" || pattern.type === "decision_failure"
      )
      .map((pattern) => pattern.pattern),
    pipelineExceedsRevenue: adjustments.some(
      (item) => item.id === "adj-sales-acceleration"
    ),
    unpaidInvoiceCount: adjustments.some((item) => item.id === "adj-collections")
      ? 1
      : 0,
  }
}

// -----------------------------------------------------------------------------
// Synthesis — pure, deterministic, identical for both modes.
// -----------------------------------------------------------------------------

function synthesizeLearning(data: LearningSourceData): ExecutiveLearning {
  const {
    decisions,
    lessons,
    executionRecords,
    goals,
    initiatives,
    totalGraphEdges,
    rhythmCount,
  } = data

  // Decision rankings.
  const implementedRecords = executionRecords.filter(
    (record) => record.status === "Implemented"
  )

  const topPerformingDecisions = [...implementedRecords]
    .sort((a, b) => b.effectivenessScore - a.effectivenessScore)
    .slice(0, TOP_LIMIT)

  const weakestDecisions = executionRecords
    .filter((record) => EXECUTED_STATUSES.has(record.status))
    .sort((a, b) => a.effectivenessScore - b.effectivenessScore)
    .slice(0, TOP_LIMIT)

  // Lesson rankings.
  const scoredLessons = lessons
    .map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      lesson: lesson.lesson,
      impactArea: lesson.impactArea,
      effectiveness: normalizeEffectivenessScale(lesson.effectiveness),
    }))
    .filter((lesson) => lesson.effectiveness !== null)

  const topLessons = [...scoredLessons]
    .sort((a, b) => (b.effectiveness ?? 0) - (a.effectiveness ?? 0))
    .slice(0, TOP_LIMIT)

  const weakestLessons = [...scoredLessons]
    .sort((a, b) => (a.effectiveness ?? 0) - (b.effectiveness ?? 0))
    .slice(0, TOP_LIMIT)

  // Category rankings.
  const categories = buildCategoryRankings(decisions)
  const strongestCategories = categories.slice(0, 3)
  const weakestCategories = [...categories]
    .reverse()
    .slice(0, 3)
    .filter(
      (category) =>
        !strongestCategories.some((item) => item.category === category.category)
    )

  // Success patterns — evidence-gated, deterministic.
  const successPatterns: string[] = []

  const implementedAvg = average(
    implementedRecords.map((record) => record.effectivenessScore)
  )

  if (rhythmCount > 0 && implementedAvg !== null && implementedAvg >= 55) {
    successPatterns.push(
      `Regular executive review cadence correlates with stronger execution — implemented decisions average ${Math.round(implementedAvg)}/100 effectiveness with ${rhythmCount} boardroom/planning sessions on record.`
    )
  }

  if (
    decisions.length > 0 &&
    implementedRecords.length / decisions.length >= 0.3
  ) {
    successPatterns.push(
      `Decisions that reach implementation deliver — ${implementedRecords.length} of ${decisions.length} decisions implemented${implementedAvg !== null ? ` at ${Math.round(implementedAvg)}/100 average effectiveness` : ""}.`
    )
  }

  for (const category of strongestCategories) {
    if (category.averageEffectiveness >= 65) {
      successPatterns.push(
        `Decisions in ${category.category} consistently perform well (${category.averageEffectiveness}/100 average across ${category.decisionCount} decision${category.decisionCount === 1 ? "" : "s"}).`
      )
    }
  }

  const lessonAreas = new Map<string, number>()
  for (const lesson of scoredLessons) {
    if ((lesson.effectiveness ?? 0) >= 70 && lesson.impactArea) {
      lessonAreas.set(
        lesson.impactArea,
        (lessonAreas.get(lesson.impactArea) ?? 0) + 1
      )
    }
  }

  for (const [area, count] of [...lessonAreas.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
  )) {
    if (count >= 2) {
      successPatterns.push(
        `Lessons in ${area} are repeatedly validated (${count} high-effectiveness lessons) — codifying them improves repeatability.`
      )
    }
  }

  successPatterns.push(...data.reviewSuccessPatterns)

  // Failure patterns — evidence-gated, deterministic.
  const failurePatterns: string[] = []

  const deferredCount = executionRecords.filter(
    (record) => record.status === "Deferred"
  ).length

  if (deferredCount > 0) {
    failurePatterns.push(
      `Delayed implementation reduces impact — ${deferredCount} decision${deferredCount === 1 ? "" : "s"} stalled 30+ days without execution activity.`
    )
  }

  const goalsWithInitiatives = new Set(
    initiatives
      .map((initiative) => initiative.goalId)
      .filter((id): id is string => Boolean(id))
  )
  const stalledOrphanGoals = goals.filter(
    (goal) =>
      goal.status !== "completed" &&
      goal.progress < 25 &&
      !goalsWithInitiatives.has(goal.id)
  )

  if (stalledOrphanGoals.length > 0) {
    failurePatterns.push(
      `Goals without initiatives stall — ${stalledOrphanGoals.length} goal${stalledOrphanGoals.length === 1 ? "" : "s"} below 25% progress with no linked initiative.`
    )
  }

  for (const category of weakestCategories) {
    if (category.averageEffectiveness < 40) {
      failurePatterns.push(
        `Decisions in ${category.category} repeatedly underperform (${category.averageEffectiveness}/100 average across ${category.decisionCount} decision${category.decisionCount === 1 ? "" : "s"}).`
      )
    }
  }

  if (data.pipelineExceedsRevenue) {
    failurePatterns.push(
      "Proposal pipeline exceeds collected revenue — conversion lags lead generation and concentrates revenue risk."
    )
  }

  if (data.unpaidInvoiceCount > 0) {
    failurePatterns.push(
      "Invoices remain unpaid after delivery — collections discipline is a recurring gap."
    )
  }

  failurePatterns.push(...data.reviewFailurePatterns)

  // Operating principles — codified from proven decisions and lessons.
  const operatingPrinciples = deriveOperatingPrinciples(
    decisions.map((decision) => ({
      id: decision.id,
      title: decision.title,
      status: decision.status,
      effectiveness: decision.effectiveness,
      outcome: decision.outcome,
    })),
    lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      lesson: lesson.lesson,
      effectiveness: lesson.effectiveness,
      sourceDecisionId: lesson.sourceDecisionId,
    }))
  )

  // Learning score — depth of validated institutional learning.
  const outcomesRecorded = decisions.filter((decision) =>
    decision.outcome?.trim()
  ).length

  const learningScore = Math.round(
    clamp(
      Math.min(implementedRecords.length * 10, 30) +
        Math.min(outcomesRecorded * 7.5, 20) +
        Math.min(lessons.length * 4, 20) +
        Math.min(decisions.length * 2, 15) +
        Math.min(totalGraphEdges / 10, 15),
      0,
      100
    )
  )

  // Confidence — volume of evidence behind the learning.
  const confidence =
    Math.round(
      clamp(
        0.3 +
          decisions.length * 0.02 +
          outcomesRecorded * 0.03 +
          lessons.length * 0.02 +
          Math.min(totalGraphEdges, 100) * 0.002,
        0.3,
        0.95
      ) * 100
    ) / 100

  return {
    topPerformingDecisions,
    weakestDecisions,
    topLessons,
    weakestLessons,
    strongestCategories,
    weakestCategories,
    successPatterns: successPatterns.slice(0, 8),
    failurePatterns: failurePatterns.slice(0, 8),
    operatingPrinciples,
    learningScore,
    confidence,
  }
}

// -----------------------------------------------------------------------------
// Memory persistence — best-effort, never blocks the response.
// -----------------------------------------------------------------------------

async function storeLearningMemory(learning: ExecutiveLearning) {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const snapshotTitle = `Executive Learning Snapshot ${today}`

    const snapshotContent = JSON.stringify({
      learningScore: learning.learningScore,
      confidence: learning.confidence,
      successPatterns: learning.successPatterns,
      failurePatterns: learning.failurePatterns,
      operatingPrinciples: learning.operatingPrinciples.map(
        (item) => item.principle
      ),
      topPerformingDecisions: learning.topPerformingDecisions.map(
        (item) => `${item.title} (${item.effectivenessScore}/100)`
      ),
      weakestDecisions: learning.weakestDecisions.map(
        (item) => `${item.title} (${item.effectivenessScore}/100)`
      ),
    })

    const existingSnapshot = await prisma.aiMemory.findFirst({
      where: { type: "executive-learning-snapshot", title: snapshotTitle },
    })

    if (existingSnapshot) {
      await prisma.aiMemory.update({
        where: { id: existingSnapshot.id },
        data: { content: snapshotContent },
      })
    } else {
      await prisma.aiMemory.create({
        data: {
          type: "executive-learning-snapshot",
          title: snapshotTitle,
          content: snapshotContent,
          source: "learning-engine",
          tags: "executive,learning,snapshot",
        },
      })
    }

    for (const principle of learning.operatingPrinciples) {
      const existing = await prisma.aiMemory.findFirst({
        where: { type: "executive-operating-principle", title: principle.id },
      })

      if (existing) {
        if (existing.content !== principle.principle) {
          await prisma.aiMemory.update({
            where: { id: existing.id },
            data: { content: principle.principle },
          })
        }
      } else {
        await prisma.aiMemory.create({
          data: {
            type: "executive-operating-principle",
            title: principle.id,
            content: principle.principle,
            source: `learning-engine:${principle.source}:${principle.sourceId}`,
            tags: "executive,learning,principle",
          },
        })
      }
    }
  } catch (error) {
    console.error("Failed to store learning memory:", error)
  }
}

// -----------------------------------------------------------------------------
// Entry point.
// -----------------------------------------------------------------------------

export async function generateExecutiveLearning(
  options: GenerateExecutiveLearningOptions = {}
): Promise<ExecutiveLearning> {
  const data = options.lightweight
    ? await gatherLightweightData()
    : await gatherFullData()

  const learning = synthesizeLearning(data)

  // Fire-and-forget: persistence must never block or fail the response.
  void storeLearningMemory(learning)

  return learning
}
