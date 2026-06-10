import { prisma } from "@/lib/prisma"

export type ExecutiveTimelineType =
  | "boardroom_session"
  | "quarterly_review"
  | "planning_cycle"
  | "decision"
  | "lesson"
  | "strategy_adjustment"
  | "strategic_scenario"

export type ExecutiveTimelineItem = {
  id: string
  type: ExecutiveTimelineType
  title: string
  summary: string | null
  impact: string | null
  status: string | null
  createdAt: string
  link: string
}

export const TIMELINE_TYPE_LABELS: Record<ExecutiveTimelineType, string> = {
  boardroom_session: "Boardroom Session",
  quarterly_review: "Quarterly Review",
  planning_cycle: "Planning Cycle",
  decision: "Decision",
  lesson: "Lesson",
  strategy_adjustment: "Strategy Adjustment",
  strategic_scenario: "Strategic Scenario",
}

const TIMELINE_LINKS: Record<ExecutiveTimelineType, string> = {
  boardroom_session: "/admin/boardroom",
  quarterly_review: "/admin/quarterly-review",
  planning_cycle: "/admin/planning-cycles",
  decision: "/admin/decision-memory",
  lesson: "/admin/executive-learning",
  strategy_adjustment: "/admin/strategy-adjustments",
  strategic_scenario: "/admin/scenarios",
}

const PER_SOURCE_LIMIT = 100
const TIMELINE_LIMIT = 150

function truncate(value: string | null | undefined, max = 280) {
  if (!value) {
    return null
  }

  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed
}

/**
 * Chronological executive memory stream across all executive record types.
 * Rule-based, newest first. No schema changes — reads existing models only.
 */
export async function buildExecutiveTimeline(): Promise<
  ExecutiveTimelineItem[]
> {
  const [
    boardroomSessions,
    quarterlyReviews,
    planningCycles,
    decisions,
    lessons,
    adjustments,
    scenarios,
  ] = await Promise.all([
    prisma.executiveBoardroomSession.findMany({
      orderBy: { createdAt: "desc" },
      take: PER_SOURCE_LIMIT,
    }),
    prisma.executiveQuarterlyReview.findMany({
      orderBy: { createdAt: "desc" },
      take: PER_SOURCE_LIMIT,
    }),
    prisma.planningCycle.findMany({
      orderBy: { createdAt: "desc" },
      take: PER_SOURCE_LIMIT,
    }),
    prisma.executiveDecision.findMany({
      orderBy: { createdAt: "desc" },
      take: PER_SOURCE_LIMIT,
    }),
    prisma.executiveLesson.findMany({
      orderBy: { createdAt: "desc" },
      take: PER_SOURCE_LIMIT,
    }),
    prisma.strategyAdjustment.findMany({
      orderBy: { createdAt: "desc" },
      take: PER_SOURCE_LIMIT,
    }),
    prisma.strategicScenario.findMany({
      orderBy: { createdAt: "desc" },
      take: PER_SOURCE_LIMIT,
    }),
  ])

  const items: ExecutiveTimelineItem[] = []

  for (const session of boardroomSessions) {
    items.push({
      id: session.id,
      type: "boardroom_session",
      title: `${session.sessionType} boardroom session`,
      summary: truncate(session.summary),
      impact:
        session.healthScore !== null
          ? `Health ${session.healthScore}/100`
          : null,
      status: null,
      createdAt: session.createdAt.toISOString(),
      link: TIMELINE_LINKS.boardroom_session,
    })
  }

  for (const review of quarterlyReviews) {
    items.push({
      id: review.id,
      type: "quarterly_review",
      title: `${review.quarter} ${review.year} quarterly review`,
      summary: truncate(review.executiveSummary),
      impact:
        review.healthScore !== null ? `Health ${review.healthScore}/100` : null,
      status: null,
      createdAt: review.createdAt.toISOString(),
      link: TIMELINE_LINKS.quarterly_review,
    })
  }

  for (const cycle of planningCycles) {
    items.push({
      id: cycle.id,
      type: "planning_cycle",
      title: `${cycle.cycleType} planning cycle`,
      summary: truncate(cycle.summary),
      impact:
        cycle.healthScore !== null ? `Health ${cycle.healthScore}/100` : null,
      status: cycle.status,
      createdAt: cycle.createdAt.toISOString(),
      link: TIMELINE_LINKS.planning_cycle,
    })
  }

  for (const decision of decisions) {
    items.push({
      id: decision.id,
      type: "decision",
      title: decision.title,
      summary: truncate(decision.outcome ?? decision.description),
      impact: [
        decision.impactArea,
        decision.effectiveness !== null
          ? `effectiveness ${decision.effectiveness}`
          : null,
      ]
        .filter(Boolean)
        .join(" — ") || null,
      status: decision.status,
      createdAt: decision.createdAt.toISOString(),
      link: TIMELINE_LINKS.decision,
    })
  }

  for (const lesson of lessons) {
    items.push({
      id: lesson.id,
      type: "lesson",
      title: lesson.title,
      summary: truncate(lesson.lesson),
      impact: lesson.impactArea,
      status: null,
      createdAt: lesson.createdAt.toISOString(),
      link: TIMELINE_LINKS.lesson,
    })
  }

  for (const adjustment of adjustments) {
    items.push({
      id: adjustment.id,
      type: "strategy_adjustment",
      title: adjustment.title,
      summary: truncate(adjustment.recommendation ?? adjustment.description),
      impact: adjustment.priority ? `${adjustment.priority} priority` : null,
      status: adjustment.status,
      createdAt: adjustment.createdAt.toISOString(),
      link: TIMELINE_LINKS.strategy_adjustment,
    })
  }

  for (const scenario of scenarios) {
    items.push({
      id: scenario.id,
      type: "strategic_scenario",
      title: scenario.title,
      summary: truncate(scenario.summary ?? scenario.recommendation),
      impact:
        scenario.impactScore !== null
          ? `Impact ${scenario.impactScore}/100`
          : null,
      status: scenario.status,
      createdAt: scenario.createdAt.toISOString(),
      link: TIMELINE_LINKS.strategic_scenario,
    })
  }

  return items
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, TIMELINE_LIMIT)
}
