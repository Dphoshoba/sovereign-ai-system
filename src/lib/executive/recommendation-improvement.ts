import {
  generateExecutiveLearning,
  type ExecutiveLearning,
} from "@/lib/executive/learning-engine"
import { normalizeEffectivenessScale } from "@/lib/executive/operating-principles"
import { generateExecutiveRisks } from "@/lib/executive/risks"
import { prisma } from "@/lib/prisma"

// Phase 27 — Recommendation Improvement Engine.
// Feeds executive learning outcomes back into the recommendation layer:
// boosts what worked, suppresses what failed, and produces deterministic
// guidance for future recommendations. No OpenAI.

export type RecommendationPatternAdjustment = {
  pattern: string
  reason: string
  source: string
}

export type CategoryWeight = {
  category: string
  weight: number
  averageEffectiveness: number
  decisionCount: number
}

export type DecisionLessonLink = {
  decisionTitle: string
  lesson: string
  effect: "boost" | "suppress"
  effectiveness: number
}

export type RecommendationImprovement = {
  improvementScore: number
  confidence: number
  improvedRecommendationRules: string[]
  suppressedRecommendationPatterns: RecommendationPatternAdjustment[]
  boostedRecommendationPatterns: RecommendationPatternAdjustment[]
  categoryWeights: CategoryWeight[]
  decisionLessons: DecisionLessonLink[]
  nextRecommendationGuidance: string[]
}

const QUERY_LIMIT = 50
const BOOST_THRESHOLD = 60
const SUPPRESS_THRESHOLD = 45
const PRINCIPLE_PROMOTION_CONFIDENCE = 0.8

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function normalizeText(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? ""
}

/** Category weight multiplier: 0.5 (avoid) to 1.5 (prioritize), 1.0 neutral. */
function effectivenessToWeight(averageEffectiveness: number) {
  return Math.round(clamp(averageEffectiveness / 60, 0.5, 1.5) * 100) / 100
}

function buildCategoryWeights(learning: ExecutiveLearning): CategoryWeight[] {
  const merged = new Map<string, CategoryWeight>()

  for (const category of [
    ...learning.strongestCategories,
    ...learning.weakestCategories,
  ]) {
    merged.set(category.category, {
      category: category.category,
      weight: effectivenessToWeight(category.averageEffectiveness),
      averageEffectiveness: category.averageEffectiveness,
      decisionCount: category.decisionCount,
    })
  }

  return [...merged.values()].sort((a, b) => b.weight - a.weight)
}

export async function generateRecommendationImprovements(): Promise<RecommendationImprovement> {
  // Lightweight learning keeps this engine production/serverless safe.
  const learning = await generateExecutiveLearning({
    lightweight: true,
    skipPersistence: true,
  })

  const [risks, decisions, lessons] = await Promise.all([
    generateExecutiveRisks(),
    prisma.executiveDecision.findMany({
      orderBy: { createdAt: "desc" },
      take: QUERY_LIMIT,
      select: {
        id: true,
        title: true,
        category: true,
        status: true,
        impactArea: true,
      },
    }),
    prisma.executiveLesson.findMany({
      orderBy: { createdAt: "desc" },
      take: QUERY_LIMIT,
      select: {
        title: true,
        lesson: true,
        effectiveness: true,
        sourceDecisionId: true,
      },
    }),
  ])

  const decisionById = new Map(decisions.map((decision) => [decision.id, decision]))

  // ---------------------------------------------------------------------------
  // Boosted patterns — high decision effectiveness, proven principles.
  // ---------------------------------------------------------------------------
  const boostedRecommendationPatterns: RecommendationPatternAdjustment[] = []

  for (const category of learning.strongestCategories) {
    if (category.averageEffectiveness >= BOOST_THRESHOLD) {
      boostedRecommendationPatterns.push({
        pattern: `Recommendations in ${category.category}`,
        reason: `Decisions in this category average ${category.averageEffectiveness}/100 effectiveness across ${category.decisionCount} decision${category.decisionCount === 1 ? "" : "s"}.`,
        source: "category effectiveness",
      })
    }
  }

  for (const decision of learning.topPerformingDecisions) {
    boostedRecommendationPatterns.push({
      pattern: `Recommendations resembling "${decision.title}"`,
      reason: `Implemented at ${decision.effectivenessScore}/100 effectiveness.`,
      source: "implemented decision",
    })
  }

  for (const principle of learning.operatingPrinciples) {
    if (principle.confidence >= PRINCIPLE_PROMOTION_CONFIDENCE) {
      boostedRecommendationPatterns.push({
        pattern: principle.principle,
        reason: `Operating principle codified at ${Math.round(principle.confidence * 100)}% confidence.`,
        source: "operating principle",
      })
    }
  }

  // ---------------------------------------------------------------------------
  // Suppressed patterns — tied to weak decisions and failure patterns.
  // ---------------------------------------------------------------------------
  const suppressedRecommendationPatterns: RecommendationPatternAdjustment[] = []

  for (const decision of learning.weakestDecisions) {
    if (decision.effectivenessScore < SUPPRESS_THRESHOLD) {
      suppressedRecommendationPatterns.push({
        pattern: `Recommendations resembling "${decision.title}"`,
        reason: `Execution underperformed at ${decision.effectivenessScore}/100 effectiveness (${decision.status}).`,
        source: "weak decision",
      })
    }
  }

  for (const category of learning.weakestCategories) {
    if (category.averageEffectiveness < SUPPRESS_THRESHOLD) {
      suppressedRecommendationPatterns.push({
        pattern: `Recommendations in ${category.category}`,
        reason: `Decisions in this category average only ${category.averageEffectiveness}/100 effectiveness.`,
        source: "category effectiveness",
      })
    }
  }

  for (const pattern of learning.failurePatterns) {
    suppressedRecommendationPatterns.push({
      pattern,
      reason: "Recurring failure pattern detected by the learning engine.",
      source: "failure pattern",
    })
  }

  // ---------------------------------------------------------------------------
  // Recurring risks without decisions — escalate priority.
  // ---------------------------------------------------------------------------
  const decisionText = decisions
    .map(
      (decision) =>
        `${normalizeText(decision.title)} ${normalizeText(decision.category)} ${normalizeText(decision.impactArea)}`
    )
    .join(" | ")

  const unactionedRisks = risks.filter((risk) => {
    const keywords = normalizeText(risk.title)
      .split(/\s+/)
      .filter((word) => word.length >= 5)

    return !keywords.some((word) => decisionText.includes(word))
  })

  // ---------------------------------------------------------------------------
  // Category weights.
  // ---------------------------------------------------------------------------
  const categoryWeights = buildCategoryWeights(learning)

  // ---------------------------------------------------------------------------
  // Decision → lesson links.
  // ---------------------------------------------------------------------------
  const decisionLessons: DecisionLessonLink[] = []

  for (const lesson of lessons) {
    const effectiveness = normalizeEffectivenessScale(lesson.effectiveness)

    if (effectiveness === null) {
      continue
    }

    const decision = lesson.sourceDecisionId
      ? decisionById.get(lesson.sourceDecisionId)
      : undefined

    decisionLessons.push({
      decisionTitle: decision?.title ?? lesson.title,
      lesson: lesson.lesson,
      effect: effectiveness >= BOOST_THRESHOLD ? "boost" : "suppress",
      effectiveness,
    })
  }

  decisionLessons.sort((a, b) => b.effectiveness - a.effectiveness)

  // ---------------------------------------------------------------------------
  // Improved recommendation rules — how the recommendation layer adapts.
  // ---------------------------------------------------------------------------
  const improvedRecommendationRules: string[] = []

  for (const weight of categoryWeights) {
    if (weight.weight > 1) {
      improvedRecommendationRules.push(
        `Boost ${weight.category} recommendations by x${weight.weight} — proven ${weight.averageEffectiveness}/100 average effectiveness.`
      )
    } else if (weight.weight < 1) {
      improvedRecommendationRules.push(
        `Reduce ${weight.category} recommendation weight to x${weight.weight} — ${weight.averageEffectiveness}/100 average effectiveness.`
      )
    }
  }

  const implementedCount = learning.topPerformingDecisions.length

  if (implementedCount > 0) {
    improvedRecommendationRules.push(
      `Raise confidence (+0.15) for recommendations backed by the ${implementedCount} implemented decision pattern${implementedCount === 1 ? "" : "s"} on record.`
    )
  }

  improvedRecommendationRules.push(
    "Lower confidence (-0.15) for recommendations with no execution history in any category."
  )

  for (const risk of unactionedRisks) {
    improvedRecommendationRules.push(
      `Escalate priority for "${risk.title}" (${risk.severity}) — recurring risk with no decision acting on it.`
    )
  }

  for (const principle of learning.operatingPrinciples.slice(0, 3)) {
    if (principle.confidence >= PRINCIPLE_PROMOTION_CONFIDENCE) {
      improvedRecommendationRules.push(
        `Treat as standing rule: ${principle.principle}`
      )
    }
  }

  // ---------------------------------------------------------------------------
  // Guidance for future recommendations.
  // ---------------------------------------------------------------------------
  const nextRecommendationGuidance: string[] = []

  if (categoryWeights.length > 0 && categoryWeights[0].weight > 1) {
    nextRecommendationGuidance.push(
      `Prioritize ${categoryWeights[0].category} initiatives first — strongest execution track record (${categoryWeights[0].averageEffectiveness}/100).`
    )
  }

  if (unactionedRisks.length > 0) {
    nextRecommendationGuidance.push(
      `Convert ${unactionedRisks.length} unaddressed risk${unactionedRisks.length === 1 ? "" : "s"} into explicit decisions before adding new growth recommendations.`
    )
  }

  if (suppressedRecommendationPatterns.length > 0) {
    nextRecommendationGuidance.push(
      "Require stronger evidence (confidence >= 0.7) before re-proposing suppressed patterns."
    )
  }

  if (learning.successPatterns.length > 0) {
    nextRecommendationGuidance.push(
      `Anchor new recommendations to validated success patterns (${learning.successPatterns.length} on record) rather than untested hypotheses.`
    )
  }

  nextRecommendationGuidance.push(
    "Attach a linked initiative to every approved recommendation — decisions without initiatives stall and lose impact."
  )

  // ---------------------------------------------------------------------------
  // Improvement score — how much learning is actively reshaping recommendations.
  // ---------------------------------------------------------------------------
  const improvementScore = Math.round(
    clamp(
      Math.min(boostedRecommendationPatterns.length * 6, 24) +
        Math.min(suppressedRecommendationPatterns.length * 6, 18) +
        Math.min(categoryWeights.length * 5, 15) +
        Math.min(decisionLessons.length * 4, 16) +
        Math.min(improvedRecommendationRules.length * 3, 15) +
        Math.min(learning.learningScore * 0.12, 12),
      0,
      100
    )
  )

  // Confidence — anchored to learning confidence, raised by execution links.
  const confidence =
    Math.round(
      clamp(
        learning.confidence * 0.8 +
          Math.min(implementedCount * 0.03, 0.1) +
          Math.min(decisionLessons.length * 0.01, 0.05),
        0.3,
        0.95
      ) * 100
    ) / 100

  return {
    improvementScore,
    confidence,
    improvedRecommendationRules: improvedRecommendationRules.slice(0, 12),
    suppressedRecommendationPatterns: suppressedRecommendationPatterns.slice(0, 8),
    boostedRecommendationPatterns: boostedRecommendationPatterns.slice(0, 8),
    categoryWeights,
    decisionLessons: decisionLessons.slice(0, 10),
    nextRecommendationGuidance: nextRecommendationGuidance.slice(0, 8),
  }
}
