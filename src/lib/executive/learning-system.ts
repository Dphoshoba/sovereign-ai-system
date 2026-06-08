import type { ExecutiveDecisionRecord } from "@/lib/executive/decision-memory"

export type ExecutiveLessonRecord = {
  id: string
  title: string
  category: string | null
  lesson: string
  impactArea: string | null
  effectiveness: number | null
  sourceDecisionId: string | null
  createdAt: string
}

export type ImpactPattern = {
  impactArea: string
  averageEffectiveness: number
  decisionCount: number
}

export type RecommendedPractice = {
  id: string
  title: string
  lesson: string
  impactArea: string | null
  effectiveness: number
}

export type DecisionLesson = {
  id: string
  title: string
  lessonLearned: string
  impactArea: string | null
  effectiveness: number | null
}

export type ExecutiveLearningSummary = {
  totalLessons: number
  strongestPatterns: ImpactPattern[]
  weakestPatterns: ImpactPattern[]
  recommendedPractices: RecommendedPractice[]
  lessons: DecisionLesson[]
}

export type LearningContext = {
  strongestPatterns: ImpactPattern[]
  weakestPatterns: ImpactPattern[]
  recommendedPractices: RecommendedPractice[]
  lessons: DecisionLesson[]
}

export function buildLearningContext(
  decisions: ExecutiveDecisionRecord[],
  storedLessons: ExecutiveLessonRecord[]
): LearningContext {
  const summary = buildExecutiveLearning(decisions, storedLessons)

  return {
    strongestPatterns: summary.strongestPatterns,
    weakestPatterns: summary.weakestPatterns,
    recommendedPractices: summary.recommendedPractices,
    lessons: summary.lessons,
  }
}

function buildImpactPatterns(decisions: ExecutiveDecisionRecord[]) {
  const byArea = new Map<string, number[]>()

  for (const decision of decisions) {
    if (!decision.impactArea || decision.effectiveness === null) {
      continue
    }

    const scores = byArea.get(decision.impactArea) ?? []
    scores.push(decision.effectiveness)
    byArea.set(decision.impactArea, scores)
  }

  const patterns = [...byArea.entries()].map(([impactArea, scores]) => ({
    impactArea,
    averageEffectiveness: Math.round(
      scores.reduce((sum, score) => sum + score, 0) / scores.length
    ),
    decisionCount: scores.length,
  }))

  patterns.sort(
    (left, right) => right.averageEffectiveness - left.averageEffectiveness
  )

  return patterns
}

export function serializeExecutiveLesson(lesson: {
  id: string
  title: string
  category: string | null
  lesson: string
  impactArea: string | null
  effectiveness: number | null
  sourceDecisionId: string | null
  createdAt: Date
}): ExecutiveLessonRecord {
  return {
    id: lesson.id,
    title: lesson.title,
    category: lesson.category,
    lesson: lesson.lesson,
    impactArea: lesson.impactArea,
    effectiveness: lesson.effectiveness,
    sourceDecisionId: lesson.sourceDecisionId,
    createdAt: lesson.createdAt.toISOString(),
  }
}

export function buildExecutiveLearning(
  decisions: ExecutiveDecisionRecord[],
  storedLessons: ExecutiveLessonRecord[]
): ExecutiveLearningSummary {
  const patterns = buildImpactPatterns(decisions)
  const strongestPatterns = patterns.length > 0 ? [patterns[0]] : []
  const weakestPatterns =
    patterns.length > 1 ? [patterns[patterns.length - 1]] : []

  const lessons = decisions
    .filter(
      (decision) =>
        decision.status === "completed" &&
        Boolean(decision.lessonLearned?.trim())
    )
    .map((decision) => ({
      id: decision.id,
      title: decision.title,
      lessonLearned: decision.lessonLearned as string,
      impactArea: decision.impactArea,
      effectiveness: decision.effectiveness,
    }))

  const recommendedPractices = decisions
    .filter(
      (decision) =>
        Boolean(decision.lessonLearned?.trim()) &&
        decision.effectiveness !== null &&
        decision.effectiveness >= 80
    )
    .map((decision) => ({
      id: decision.id,
      title: decision.title,
      lesson: decision.lessonLearned as string,
      impactArea: decision.impactArea,
      effectiveness: decision.effectiveness as number,
    }))

  return {
    totalLessons: storedLessons.length,
    strongestPatterns,
    weakestPatterns,
    recommendedPractices,
    lessons,
  }
}

export function decisionsEligibleForLessonGeneration(
  decisions: ExecutiveDecisionRecord[]
) {
  return decisions.filter(
    (decision) =>
      decision.status === "completed" &&
      Boolean(decision.lessonLearned?.trim())
  )
}
