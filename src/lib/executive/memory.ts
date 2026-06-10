import { prisma } from "@/lib/prisma"
import {
  trackDecisionImpacts,
  type DecisionImpact,
} from "@/lib/executive/decision-impact"

export type ConnectedEntity = {
  title: string
  entityType: string
  connections: number
}

export type RecurringTheme = {
  text: string
  occurrences: number
}

export type EffectiveLesson = {
  title: string
  lesson: string
  impactArea: string | null
  effectiveness: number | null
}

export type HistoryItem = {
  id: string
  title: string
  healthScore: number | null
  summary: string | null
  createdAt: string
}

export type ExecutiveMemory = {
  graph: {
    totalNodes: number
    totalEdges: number
    relationshipDensity: number
    nodeCountsByType: Record<string, number>
    mostConnected: ConnectedEntity[]
  }
  history: {
    boardroomSessions: HistoryItem[]
    quarterlyReviews: HistoryItem[]
    planningCycles: HistoryItem[]
  }
  strategicMemory: {
    mostEffectiveDecisions: DecisionImpact[]
    mostEffectiveLessons: EffectiveLesson[]
    recurringRisks: RecurringTheme[]
    recurringOpportunities: RecurringTheme[]
  }
}

const HISTORY_LIMIT = 10
const TOP_LIMIT = 5

function truncate(value: string | null | undefined, max = 240) {
  if (!value) {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed
}

function countThemes(values: string[]): RecurringTheme[] {
  const counts = new Map<string, number>()

  for (const value of values) {
    const text = value.trim()

    if (!text) {
      continue
    }

    counts.set(text, (counts.get(text) ?? 0) + 1)
  }

  return [...counts.entries()]
    .map(([text, occurrences]) => ({ text, occurrences }))
    .sort(
      (a, b) => b.occurrences - a.occurrences || a.text.localeCompare(b.text)
    )
    .slice(0, TOP_LIMIT)
}

function extractStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is string => typeof item === "string")
}

/** Aggregated executive memory: graph stats, history, and strategic memory. */
export async function buildExecutiveMemory(): Promise<ExecutiveMemory> {
  const [
    totalNodes,
    totalEdges,
    nodesByType,
    edges,
    nodes,
    boardroomSessions,
    quarterlyReviews,
    planningCycles,
    lessons,
    decisionImpacts,
  ] = await Promise.all([
    prisma.executiveKnowledgeNode.count(),
    prisma.executiveKnowledgeEdge.count(),
    prisma.executiveKnowledgeNode.groupBy({
      by: ["entityType"],
      _count: { _all: true },
    }),
    prisma.executiveKnowledgeEdge.findMany({
      select: { fromNodeId: true, toNodeId: true },
    }),
    prisma.executiveKnowledgeNode.findMany({
      select: { id: true, title: true, entityType: true },
    }),
    prisma.executiveBoardroomSession.findMany({
      orderBy: { createdAt: "desc" },
      take: HISTORY_LIMIT,
    }),
    prisma.executiveQuarterlyReview.findMany({
      orderBy: { createdAt: "desc" },
      take: HISTORY_LIMIT,
    }),
    prisma.planningCycle.findMany({
      orderBy: { createdAt: "desc" },
      take: HISTORY_LIMIT,
    }),
    prisma.executiveLesson.findMany({
      orderBy: { createdAt: "desc" },
    }),
    trackDecisionImpacts(),
  ])

  // Most connected entities — count edge endpoints per node.
  const connectionCounts = new Map<string, number>()

  for (const edge of edges) {
    connectionCounts.set(
      edge.fromNodeId,
      (connectionCounts.get(edge.fromNodeId) ?? 0) + 1
    )
    connectionCounts.set(
      edge.toNodeId,
      (connectionCounts.get(edge.toNodeId) ?? 0) + 1
    )
  }

  const nodeById = new Map(nodes.map((node) => [node.id, node]))

  const mostConnected: ConnectedEntity[] = [...connectionCounts.entries()]
    .map(([nodeId, connections]) => {
      const node = nodeById.get(nodeId)

      return node
        ? { title: node.title, entityType: node.entityType, connections }
        : null
    })
    .filter((entry): entry is ConnectedEntity => entry !== null)
    .sort(
      (a, b) =>
        b.connections - a.connections || a.title.localeCompare(b.title)
    )
    .slice(0, TOP_LIMIT)

  const nodeCountsByType: Record<string, number> = {}
  for (const row of nodesByType) {
    nodeCountsByType[row.entityType] = row._count._all
  }

  // Recurring risks/opportunities — planning cycles + boardroom sessions.
  const riskTexts: string[] = []
  const opportunityTexts: string[] = []

  for (const cycle of planningCycles) {
    riskTexts.push(...extractStringArray(cycle.risks))
    opportunityTexts.push(...extractStringArray(cycle.opportunities))
  }

  for (const session of boardroomSessions) {
    const decisions = (session.decisions ?? {}) as Record<string, unknown>
    riskTexts.push(...extractStringArray(decisions.majorRisks))
    opportunityTexts.push(...extractStringArray(decisions.majorOpportunities))
  }

  // Most effective lessons — highest recorded effectiveness first.
  const mostEffectiveLessons: EffectiveLesson[] = lessons
    .filter((lesson) => lesson.effectiveness !== null)
    .sort((a, b) => (b.effectiveness ?? 0) - (a.effectiveness ?? 0))
    .slice(0, TOP_LIMIT)
    .map((lesson) => ({
      title: lesson.title,
      lesson: truncate(lesson.lesson) ?? "",
      impactArea: lesson.impactArea,
      effectiveness: lesson.effectiveness,
    }))

  return {
    graph: {
      totalNodes,
      totalEdges,
      relationshipDensity:
        totalNodes > 0 ? Math.round((totalEdges / totalNodes) * 100) / 100 : 0,
      nodeCountsByType,
      mostConnected,
    },
    history: {
      boardroomSessions: boardroomSessions.map((session) => ({
        id: session.id,
        title: `${session.sessionType} boardroom session`,
        healthScore: session.healthScore,
        summary: truncate(session.summary),
        createdAt: session.createdAt.toISOString(),
      })),
      quarterlyReviews: quarterlyReviews.map((review) => ({
        id: review.id,
        title: `${review.quarter} ${review.year} quarterly review`,
        healthScore: review.healthScore,
        summary: truncate(review.executiveSummary),
        createdAt: review.createdAt.toISOString(),
      })),
      planningCycles: planningCycles.map((cycle) => ({
        id: cycle.id,
        title: `${cycle.cycleType} planning cycle (${cycle.status})`,
        healthScore: cycle.healthScore,
        summary: truncate(cycle.summary),
        createdAt: cycle.createdAt.toISOString(),
      })),
    },
    strategicMemory: {
      mostEffectiveDecisions: decisionImpacts.slice(0, TOP_LIMIT),
      mostEffectiveLessons,
      recurringRisks: countThemes(riskTexts),
      recurringOpportunities: countThemes(opportunityTexts),
    },
  }
}
