import {
  serializeKnowledgeNode,
  type KnowledgeNodeRecord,
} from "@/lib/executive/knowledge-graph"
import { prisma } from "@/lib/prisma"

export type GraphNodeInsight = {
  id: string
  entityType: string
  entityId: string
  title: string
  edgeCount: number
  category: string | null
  summary: string | null
}

export type GraphLinkInsight = {
  decisionId: string
  decisionTitle: string
  lessonId: string
  lessonTitle: string
  relation: string
}

export type KnowledgeGraphIntelligence = {
  totalNodes: number
  totalEdges: number
  mostConnectedNodes: GraphNodeInsight[]
  isolatedNodes: GraphNodeInsight[]
  revenueConnections: GraphNodeInsight[]
  deliveryConnections: GraphNodeInsight[]
  goalGaps: GraphNodeInsight[]
  decisionLessonLinks: GraphLinkInsight[]
  riskAreas: GraphNodeInsight[]
  opportunityAreas: GraphNodeInsight[]
  insights: string[]
  recommendations: string[]
}

const REVENUE_ENTITY_TYPES = new Set([
  "client_invoice",
  "client",
  "creator_proposal",
  "creator_lead",
])

const DELIVERY_ENTITY_TYPES = new Set([
  "client_project",
  "client_project_task",
  "initiative",
])

const OPPORTUNITY_LEAD_STATUSES = new Set(["proposal-ready", "proposal-sent"])

function toNodeInsight(
  node: KnowledgeNodeRecord,
  edgeCount: number
): GraphNodeInsight {
  return {
    id: node.id,
    entityType: node.entityType,
    entityId: node.entityId,
    title: node.title,
    edgeCount,
    category: node.category,
    summary: node.summary,
  }
}

function metadataNumber(
  metadata: Record<string, unknown> | null,
  key: string
) {
  const value = metadata?.[key]

  return typeof value === "number" ? value : null
}

function metadataBoolean(
  metadata: Record<string, unknown> | null,
  key: string
) {
  const value = metadata?.[key]

  return value === true
}

function metadataString(
  metadata: Record<string, unknown> | null,
  key: string
) {
  const value = metadata?.[key]

  return typeof value === "string" ? value : null
}

function isRevenueNode(node: KnowledgeNodeRecord) {
  if (REVENUE_ENTITY_TYPES.has(node.entityType)) {
    return true
  }

  if (node.entityType === "impact_area") {
    const label = `${node.title} ${node.summary ?? ""}`.toLowerCase()

    return (
      label.includes("revenue") ||
      label.includes("invoice") ||
      label.includes("pipeline") ||
      label.includes("sales")
    )
  }

  return false
}

function isDeliveryNode(node: KnowledgeNodeRecord) {
  if (DELIVERY_ENTITY_TYPES.has(node.entityType)) {
    return true
  }

  if (node.entityType === "impact_area") {
    const label = `${node.title} ${node.summary ?? ""}`.toLowerCase()

    return (
      label.includes("delivery") ||
      label.includes("project") ||
      label.includes("execution")
    )
  }

  return false
}

function isOpportunityNode(node: KnowledgeNodeRecord) {
  if (node.entityType === "creator_lead") {
    const status = metadataString(node.metadata, "status") ?? node.category

    return OPPORTUNITY_LEAD_STATUSES.has(status ?? "")
  }

  if (node.entityType === "initiative") {
    const riskLevel = metadataString(node.metadata, "riskLevel")

    return riskLevel === "low" || riskLevel === "medium"
  }

  if (node.entityType === "impact_area") {
    return false
  }

  return node.category === "opportunity"
}

function buildInsights(data: {
  totalNodes: number
  totalEdges: number
  mostConnectedNodes: GraphNodeInsight[]
  isolatedNodes: GraphNodeInsight[]
  revenueConnections: GraphNodeInsight[]
  deliveryConnections: GraphNodeInsight[]
  goalGaps: GraphNodeInsight[]
  decisionLessonLinks: GraphLinkInsight[]
  riskAreas: GraphNodeInsight[]
  opportunityAreas: GraphNodeInsight[]
}) {
  const insights: string[] = []

  if (data.totalNodes === 0) {
    insights.push("The executive knowledge graph has no nodes yet.")
  } else {
    insights.push(
      `The knowledge graph contains ${data.totalNodes} nodes and ${data.totalEdges} edges.`
    )
  }

  if (data.mostConnectedNodes.length > 0) {
    const top = data.mostConnectedNodes[0]

    insights.push(
      `Most connected node: ${top.title} (${top.entityType}) with ${top.edgeCount} edge${top.edgeCount === 1 ? "" : "s"}.`
    )
  }

  if (data.isolatedNodes.length > 0) {
    insights.push(
      `${data.isolatedNodes.length} node${data.isolatedNodes.length === 1 ? "" : "s"} ${data.isolatedNodes.length === 1 ? "is" : "are"} isolated with no graph connections.`
    )
  }

  if (data.revenueConnections.length > 0) {
    insights.push(
      `${data.revenueConnections.length} node${data.revenueConnections.length === 1 ? "" : "s"} connected to revenue-related entities.`
    )
  }

  if (data.deliveryConnections.length > 0) {
    insights.push(
      `${data.deliveryConnections.length} node${data.deliveryConnections.length === 1 ? "" : "s"} connected to delivery or execution entities.`
    )
  }

  if (data.goalGaps.length > 0) {
    insights.push(
      `${data.goalGaps.length} quarterly goal${data.goalGaps.length === 1 ? "" : "s"} ${data.goalGaps.length === 1 ? "has" : "have"} no linked initiatives.`
    )
  }

  if (data.decisionLessonLinks.length > 0) {
    insights.push(
      `${data.decisionLessonLinks.length} decision${data.decisionLessonLinks.length === 1 ? "" : "s"} linked to executive lessons in the graph.`
    )
  }

  if (data.riskAreas.length > 0) {
    insights.push(
      `${data.riskAreas.length} impact area${data.riskAreas.length === 1 ? "" : "s"} connected to weak or follow-up decisions.`
    )
  }

  if (data.opportunityAreas.length > 0) {
    insights.push(
      `${data.opportunityAreas.length} area${data.opportunityAreas.length === 1 ? "" : "s"} show opportunity signals through graph connections.`
    )
  }

  return insights.slice(0, 12)
}

function buildRecommendations(data: {
  totalNodes: number
  totalEdges: number
  isolatedNodes: GraphNodeInsight[]
  goalGaps: GraphNodeInsight[]
  decisionLessonLinks: GraphLinkInsight[]
  riskAreas: GraphNodeInsight[]
  opportunityAreas: GraphNodeInsight[]
}) {
  const recommendations: string[] = []

  if (data.totalNodes === 0 || data.totalEdges === 0) {
    recommendations.push(
      "Sync the knowledge graph from the Knowledge Graph dashboard to populate nodes and edges."
    )
  }

  if (data.goalGaps.length > 0) {
    recommendations.push(
      `Link ${data.goalGaps.length} quarterly goal${data.goalGaps.length === 1 ? "" : "s"} to strategic initiatives in the execution engine.`
    )
  }

  const isolatedDecisions = data.isolatedNodes.filter(
    (node) => node.entityType === "decision"
  )

  if (isolatedDecisions.length > 0) {
    recommendations.push(
      `Review ${isolatedDecisions.length} isolated decision${isolatedDecisions.length === 1 ? "" : "s"} and connect lessons, boardroom sessions, or impact areas.`
    )
  }

  const isolatedLessons = data.isolatedNodes.filter(
    (node) => node.entityType === "lesson"
  )

  if (isolatedLessons.length > 0) {
    recommendations.push(
      "Connect isolated executive lessons to source decisions and impact areas in decision memory."
    )
  }

  if (data.decisionLessonLinks.length === 0 && data.totalNodes > 0) {
    recommendations.push(
      "Generate executive lessons from completed decisions, then sync the knowledge graph."
    )
  }

  if (data.riskAreas.length > 0) {
    recommendations.push(
      "Review decisions linked to risk impact areas and record outcomes in decision memory."
    )
  }

  if (data.opportunityAreas.length > 0) {
    recommendations.push(
      "Prioritize follow-up on opportunity-linked leads, proposals, and high-effectiveness impact areas."
    )
  }

  if (recommendations.length === 0 && data.totalNodes > 0) {
    recommendations.push(
      "Re-sync the knowledge graph after major executive updates to keep intelligence current."
    )
  }

  return recommendations.slice(0, 8)
}

export async function buildKnowledgeGraphIntelligence(): Promise<KnowledgeGraphIntelligence> {
  const [nodes, edges] = await Promise.all([
    prisma.executiveKnowledgeNode.findMany({
      orderBy: { updatedAt: "desc" },
    }),
    prisma.executiveKnowledgeEdge.findMany(),
  ])

  const serializedNodes = nodes.map(serializeKnowledgeNode)
  const nodeById = new Map(serializedNodes.map((node) => [node.id, node]))
  const edgeCount = new Map<string, number>()
  const neighbors = new Map<string, Set<string>>()
  const outgoingByRelation = new Map<string, Map<string, string[]>>()

  for (const edge of edges) {
    edgeCount.set(edge.fromNodeId, (edgeCount.get(edge.fromNodeId) ?? 0) + 1)
    edgeCount.set(edge.toNodeId, (edgeCount.get(edge.toNodeId) ?? 0) + 1)

    const fromNeighbors = neighbors.get(edge.fromNodeId) ?? new Set<string>()
    fromNeighbors.add(edge.toNodeId)
    neighbors.set(edge.fromNodeId, fromNeighbors)

    const toNeighbors = neighbors.get(edge.toNodeId) ?? new Set<string>()
    toNeighbors.add(edge.fromNodeId)
    neighbors.set(edge.toNodeId, toNeighbors)

    const relationMap =
      outgoingByRelation.get(edge.fromNodeId) ?? new Map<string, string[]>()
    const targets = relationMap.get(edge.relation) ?? []
    targets.push(edge.toNodeId)
    relationMap.set(edge.relation, targets)
    outgoingByRelation.set(edge.fromNodeId, relationMap)
  }

  const mostConnectedNodes = [...serializedNodes]
    .map((node) => toNodeInsight(node, edgeCount.get(node.id) ?? 0))
    .filter((node) => node.edgeCount > 0)
    .sort(
      (left, right) =>
        right.edgeCount - left.edgeCount || left.title.localeCompare(right.title)
    )
    .slice(0, 10)

  const isolatedNodes = serializedNodes
    .filter((node) => (edgeCount.get(node.id) ?? 0) === 0)
    .map((node) => toNodeInsight(node, 0))
    .slice(0, 20)

  function collectConnectedNodes(
    predicate: (node: KnowledgeNodeRecord) => boolean
  ) {
    const matched = new Set<string>()

    for (const node of serializedNodes) {
      if (!predicate(node)) {
        continue
      }

      const adjacent = neighbors.get(node.id) ?? new Set<string>()

      for (const neighborId of adjacent) {
        matched.add(neighborId)
      }

      matched.add(node.id)
    }

    return [...matched]
      .map((id) => nodeById.get(id))
      .filter((node): node is KnowledgeNodeRecord => Boolean(node))
      .map((node) => toNodeInsight(node, edgeCount.get(node.id) ?? 0))
      .sort(
        (left, right) =>
          right.edgeCount - left.edgeCount ||
          left.title.localeCompare(right.title)
      )
      .slice(0, 20)
  }

  const revenueConnections = collectConnectedNodes(isRevenueNode)
  const deliveryConnections = collectConnectedNodes(isDeliveryNode)

  const goalGaps = serializedNodes
    .filter((node) => node.entityType === "goal")
    .filter((node) => {
      const relations = outgoingByRelation.get(node.id)

      return !relations?.get("owns_initiative")?.length
    })
    .map((node) => toNodeInsight(node, edgeCount.get(node.id) ?? 0))
    .slice(0, 20)

  const decisionLessonLinks: GraphLinkInsight[] = []

  for (const edge of edges) {
    if (edge.relation !== "has_lesson") {
      continue
    }

    const decision = nodeById.get(edge.fromNodeId)
    const lesson = nodeById.get(edge.toNodeId)

    if (!decision || !lesson) {
      continue
    }

    decisionLessonLinks.push({
      decisionId: decision.entityId,
      decisionTitle: decision.title,
      lessonId: lesson.entityId,
      lessonTitle: lesson.title,
      relation: edge.relation,
    })
  }

  const riskAreaIds = new Set<string>()

  for (const edge of edges) {
    if (edge.relation !== "impacts_area") {
      continue
    }

    const source = nodeById.get(edge.fromNodeId)
    const target = nodeById.get(edge.toNodeId)

    if (!source || !target || target.entityType !== "impact_area") {
      continue
    }

    if (source.entityType !== "decision") {
      continue
    }

    const effectiveness = metadataNumber(source.metadata, "effectiveness")
    const followUpRequired = metadataBoolean(source.metadata, "followUpRequired")
    const status = metadataString(source.metadata, "status")

    const isRiskDecision =
      followUpRequired ||
      status === "rejected" ||
      (effectiveness !== null && effectiveness < 70)

    if (isRiskDecision) {
      riskAreaIds.add(target.id)
    }
  }

  const riskAreas = [...riskAreaIds]
    .map((id) => nodeById.get(id))
    .filter((node): node is KnowledgeNodeRecord => Boolean(node))
    .map((node) => toNodeInsight(node, edgeCount.get(node.id) ?? 0))

  const opportunityCounts = new Map<string, number>()

  for (const node of serializedNodes) {
    if (!isOpportunityNode(node)) {
      continue
    }

    const adjacent = neighbors.get(node.id) ?? new Set<string>()

    for (const neighborId of adjacent) {
      opportunityCounts.set(
        neighborId,
        (opportunityCounts.get(neighborId) ?? 0) + 1
      )
    }

    opportunityCounts.set(node.id, (opportunityCounts.get(node.id) ?? 0) + 1)
  }

  for (const edge of edges) {
    if (edge.relation !== "impacts_area") {
      continue
    }

    const source = nodeById.get(edge.fromNodeId)
    const target = nodeById.get(edge.toNodeId)

    if (!source || !target || target.entityType !== "impact_area") {
      continue
    }

    if (source.entityType !== "decision") {
      continue
    }

    const effectiveness = metadataNumber(source.metadata, "effectiveness")

    if (effectiveness !== null && effectiveness >= 80) {
      opportunityCounts.set(
        target.id,
        (opportunityCounts.get(target.id) ?? 0) + 2
      )
    }
  }

  const opportunityAreas = [...opportunityCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 10)
    .map(([id]) => nodeById.get(id))
    .filter((node): node is KnowledgeNodeRecord => Boolean(node))
    .map((node) => toNodeInsight(node, edgeCount.get(node.id) ?? 0))

  const intelligenceBase = {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    mostConnectedNodes,
    isolatedNodes,
    revenueConnections,
    deliveryConnections,
    goalGaps,
    decisionLessonLinks,
    riskAreas,
    opportunityAreas,
  }

  return {
    ...intelligenceBase,
    insights: buildInsights(intelligenceBase),
    recommendations: buildRecommendations(intelligenceBase),
  }
}
