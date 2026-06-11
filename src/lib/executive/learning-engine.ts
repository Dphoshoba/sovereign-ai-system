import { generateMonthlyExecutiveReview } from "@/lib/executive/autonomous-review"
import {
  generateExecutionTracker,
  type DecisionExecutionRecord,
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

const TOP_LIMIT = 5
const EXECUTED_STATUSES = new Set(["Approved", "In Progress", "Implemented"])

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function average(values: number[]) {
  return values.length > 0
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null
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

/** Persist the learning snapshot into AI memory — duplicate-safe per day/principle. */
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
    // Memory persistence is best-effort — never fail the read path.
    console.error("Failed to store learning memory:", error)
  }
}

export async function generateExecutiveLearning(): Promise<ExecutiveLearning> {
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
    prisma.executiveDecision.findMany(),
    prisma.executiveLesson.findMany(),
    buildExecutiveMemory(),
    generateMonthlyExecutiveReview(),
    generateStrategicAdjustments(),
    prisma.quarterlyGoal.findMany(),
    prisma.strategicInitiative.findMany(),
  ])

  // -------------------------------------------------------------------------
  // Decision rankings — from the execution tracker.
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Lesson rankings.
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Category rankings.
  // -------------------------------------------------------------------------
  const categories = buildCategoryRankings(decisions)
  const strongestCategories = categories.slice(0, 3)
  const weakestCategories = [...categories]
    .reverse()
    .slice(0, 3)
    .filter(
      (category) =>
        !strongestCategories.some((item) => item.category === category.category)
    )

  // -------------------------------------------------------------------------
  // Success patterns — evidence-gated, deterministic.
  // -------------------------------------------------------------------------
  const successPatterns: string[] = []

  const implementedAvg = average(
    implementedRecords.map((record) => record.effectivenessScore)
  )

  const recentRhythmCount =
    memory.history.boardroomSessions.length +
    memory.history.planningCycles.length

  if (recentRhythmCount > 0 && implementedAvg !== null && implementedAvg >= 55) {
    successPatterns.push(
      `Regular executive review cadence correlates with stronger execution — implemented decisions average ${Math.round(implementedAvg)}/100 effectiveness with ${recentRhythmCount} boardroom/planning sessions on record.`
    )
  }

  if (decisions.length > 0 && implementedRecords.length / decisions.length >= 0.3) {
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

  for (const pattern of review.recurringPatterns) {
    if (pattern.type === "decision" || pattern.type === "lesson") {
      successPatterns.push(pattern.pattern)
    }
  }

  // -------------------------------------------------------------------------
  // Failure patterns — evidence-gated, deterministic.
  // -------------------------------------------------------------------------
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

  if (adjustments.some((item) => item.id === "adj-sales-acceleration")) {
    failurePatterns.push(
      "Proposal pipeline exceeds collected revenue — conversion lags lead generation and concentrates revenue risk."
    )
  }

  if (adjustments.some((item) => item.id === "adj-collections")) {
    failurePatterns.push(
      "Invoices remain unpaid after delivery — collections discipline is a recurring gap."
    )
  }

  for (const pattern of review.recurringPatterns) {
    if (pattern.type === "risk" || pattern.type === "decision_failure") {
      failurePatterns.push(pattern.pattern)
    }
  }

  // -------------------------------------------------------------------------
  // Operating principles — codified from proven decisions and lessons.
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Learning score — depth of validated institutional learning.
  // -------------------------------------------------------------------------
  const outcomesRecorded = decisions.filter((decision) =>
    decision.outcome?.trim()
  ).length

  const learningScore = Math.round(
    clamp(
      Math.min(implementedRecords.length * 10, 30) +
        Math.min(outcomesRecorded * 7.5, 20) +
        Math.min(lessons.length * 4, 20) +
        Math.min(decisions.length * 2, 15) +
        Math.min(memory.graph.totalEdges / 10, 15),
      0,
      100
    )
  )

  // -------------------------------------------------------------------------
  // Confidence — volume of evidence behind the learning.
  // -------------------------------------------------------------------------
  const confidence =
    Math.round(
      clamp(
        0.3 +
          decisions.length * 0.02 +
          outcomesRecorded * 0.03 +
          lessons.length * 0.02 +
          Math.min(memory.graph.totalEdges, 100) * 0.002,
        0.3,
        0.95
      ) * 100
    ) / 100

  const learning: ExecutiveLearning = {
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

  await storeLearningMemory(learning)

  return learning
}
