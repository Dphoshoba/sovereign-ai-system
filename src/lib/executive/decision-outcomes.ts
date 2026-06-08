import type { ExecutiveDecisionRecord } from "@/lib/executive/decision-memory"

export type DecisionOutcomeLesson = {
  id: string
  title: string
  lessonLearned: string
  impactArea: string | null
  effectiveness: number | null
}

export type DecisionOutcomeFollowUp = {
  id: string
  title: string
  actionTaken: string | null
  reviewDate: string | null
  impactArea: string | null
  status: string
}

export type DecisionOutcomeSummary = {
  totalDecisions: number
  completedDecisions: number
  decisionsNeedingFollowUp: number
  averageEffectiveness: number
  strongestImpactArea: string | null
  weakestImpactArea: string | null
  lessons: DecisionOutcomeLesson[]
  followUps: DecisionOutcomeFollowUp[]
}

function averageEffectiveness(decisions: ExecutiveDecisionRecord[]) {
  const scored = decisions.filter(
    (decision) => decision.effectiveness !== null
  )

  if (scored.length === 0) {
    return 0
  }

  return Math.round(
    scored.reduce(
      (sum, decision) => sum + (decision.effectiveness ?? 0),
      0
    ) / scored.length
  )
}

function buildImpactAreaRankings(decisions: ExecutiveDecisionRecord[]) {
  const byArea = new Map<string, number[]>()

  for (const decision of decisions) {
    if (!decision.impactArea || decision.effectiveness === null) {
      continue
    }

    const scores = byArea.get(decision.impactArea) ?? []
    scores.push(decision.effectiveness)
    byArea.set(decision.impactArea, scores)
  }

  const averages = [...byArea.entries()].map(([area, scores]) => ({
    area,
    average: Math.round(
      scores.reduce((sum, score) => sum + score, 0) / scores.length
    ),
  }))

  if (averages.length === 0) {
    return {
      strongestImpactArea: null,
      weakestImpactArea: null,
    }
  }

  averages.sort((left, right) => right.average - left.average)

  return {
    strongestImpactArea: averages[0].area,
    weakestImpactArea: averages[averages.length - 1].area,
  }
}

export function buildDecisionOutcomeSummary(
  decisions: ExecutiveDecisionRecord[]
): DecisionOutcomeSummary {
  const completedDecisions = decisions.filter(
    (decision) => decision.status === "completed"
  ).length
  const decisionsNeedingFollowUp = decisions.filter(
    (decision) => decision.followUpRequired
  ).length
  const { strongestImpactArea, weakestImpactArea } =
    buildImpactAreaRankings(decisions)

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

  const followUps = decisions
    .filter((decision) => decision.followUpRequired)
    .map((decision) => ({
      id: decision.id,
      title: decision.title,
      actionTaken: decision.actionTaken,
      reviewDate: decision.reviewDate,
      impactArea: decision.impactArea,
      status: decision.status,
    }))

  return {
    totalDecisions: decisions.length,
    completedDecisions,
    decisionsNeedingFollowUp,
    averageEffectiveness: averageEffectiveness(decisions),
    strongestImpactArea,
    weakestImpactArea,
    lessons,
    followUps,
  }
}
