import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

export type KnowledgeGraphBuildResult = {
  nodesCreated: number
  nodesUpdated: number
  edgesCreated: number
  totalNodes: number
  totalEdges: number
}

export type KnowledgeNodeRecord = {
  id: string
  entityType: string
  entityId: string
  title: string
  summary: string | null
  category: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export type KnowledgeEdgeRecord = {
  id: string
  fromNodeId: string
  toNodeId: string
  relation: string
  weight: number
  metadata: Record<string, unknown> | null
  createdAt: string
}

export type KnowledgeGraphSummary = {
  totalNodes: number
  totalEdges: number
  nodeCountsByType: Record<string, number>
  edgeCountsByRelation: Record<string, number>
  recentNodes: KnowledgeNodeRecord[]
  recentEdges: KnowledgeEdgeRecord[]
}

export type KnowledgeSearchEdge = KnowledgeEdgeRecord & {
  direction: "outgoing" | "incoming"
  connectedNodeId: string
  connectedNodeTitle: string
  connectedNodeType: string
}

export type KnowledgeSearchResult = {
  node: KnowledgeNodeRecord
  connectedEdges: KnowledgeSearchEdge[]
}

type NodeInput = {
  entityType: string
  entityId: string
  title: string
  summary?: string | null
  category?: string | null
  metadata?: Prisma.InputJsonValue
}

type BuildStats = {
  nodesCreated: number
  nodesUpdated: number
  edgesCreated: number
}

function normalizeImpactAreaId(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "-")
}

/** Lowercased focus key for matching categories, impact areas, owner systems. */
function normalizeFocus(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase()
  return normalized || null
}

function toMetadata(value: Prisma.JsonValue | null | undefined) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

export function serializeKnowledgeNode(node: {
  id: string
  entityType: string
  entityId: string
  title: string
  summary: string | null
  category: string | null
  metadata: Prisma.JsonValue | null
  createdAt: Date
  updatedAt: Date
}): KnowledgeNodeRecord {
  return {
    id: node.id,
    entityType: node.entityType,
    entityId: node.entityId,
    title: node.title,
    summary: node.summary,
    category: node.category,
    metadata: toMetadata(node.metadata),
    createdAt: node.createdAt.toISOString(),
    updatedAt: node.updatedAt.toISOString(),
  }
}

export function serializeKnowledgeEdge(edge: {
  id: string
  fromNodeId: string
  toNodeId: string
  relation: string
  weight: number
  metadata: Prisma.JsonValue | null
  createdAt: Date
}): KnowledgeEdgeRecord {
  return {
    id: edge.id,
    fromNodeId: edge.fromNodeId,
    toNodeId: edge.toNodeId,
    relation: edge.relation,
    weight: edge.weight,
    metadata: toMetadata(edge.metadata),
    createdAt: edge.createdAt.toISOString(),
  }
}

async function upsertNode(
  input: NodeInput,
  registry: Map<string, string>,
  stats: BuildStats
) {
  const key = `${input.entityType}:${input.entityId}`
  const existing = await prisma.executiveKnowledgeNode.findUnique({
    where: {
      entityType_entityId: {
        entityType: input.entityType,
        entityId: input.entityId,
      },
    },
  })

  if (existing) {
    const updated = await prisma.executiveKnowledgeNode.update({
      where: { id: existing.id },
      data: {
        title: input.title,
        summary: input.summary ?? null,
        category: input.category ?? null,
        metadata: input.metadata ?? undefined,
      },
    })

    stats.nodesUpdated += 1
    registry.set(key, updated.id)
    return updated.id
  }

  const created = await prisma.executiveKnowledgeNode.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      title: input.title,
      summary: input.summary ?? null,
      category: input.category ?? null,
      metadata: input.metadata ?? undefined,
    },
  })

  stats.nodesCreated += 1
  registry.set(key, created.id)
  return created.id
}

async function ensureEdge(
  fromNodeId: string,
  toNodeId: string,
  relation: string,
  stats: BuildStats,
  metadata?: Prisma.InputJsonValue
) {
  if (fromNodeId === toNodeId) {
    return
  }

  const existing = await prisma.executiveKnowledgeEdge.findFirst({
    where: {
      fromNodeId,
      toNodeId,
      relation,
    },
  })

  if (existing) {
    return
  }

  await prisma.executiveKnowledgeEdge.create({
    data: {
      fromNodeId,
      toNodeId,
      relation,
      metadata: metadata ?? undefined,
    },
  })

  stats.edgesCreated += 1
}

function registryKey(entityType: string, entityId: string) {
  return `${entityType}:${entityId}`
}

async function ensureImpactAreaNode(
  impactArea: string,
  registry: Map<string, string>,
  stats: BuildStats
) {
  const entityId = normalizeImpactAreaId(impactArea)

  return upsertNode(
    {
      entityType: "impact_area",
      entityId,
      title: impactArea.trim(),
      summary: `Executive impact area: ${impactArea.trim()}`,
      category: "impact_area",
    },
    registry,
    stats
  )
}

export async function buildExecutiveKnowledgeGraph(): Promise<KnowledgeGraphBuildResult> {
  const stats: BuildStats = {
    nodesCreated: 0,
    nodesUpdated: 0,
    edgesCreated: 0,
  }
  const registry = new Map<string, string>()

  const [
    decisions,
    lessons,
    goals,
    initiatives,
    boardroomSessions,
    planningCycles,
    projects,
    tasks,
    invoices,
    leads,
    clients,
    proposals,
    quarterlyReviews,
  ] = await Promise.all([
    prisma.executiveDecision.findMany(),
    prisma.executiveLesson.findMany(),
    prisma.quarterlyGoal.findMany(),
    prisma.strategicInitiative.findMany(),
    prisma.executiveBoardroomSession.findMany(),
    prisma.planningCycle.findMany(),
    prisma.clientProject.findMany(),
    prisma.clientProjectTask.findMany(),
    prisma.clientInvoice.findMany(),
    prisma.creatorLead.findMany(),
    prisma.clientProfile.findMany(),
    prisma.creatorProposal.findMany({
      where: {
        leadId: {
          not: null,
        },
      },
    }),
    prisma.executiveQuarterlyReview.findMany(),
  ])

  for (const client of clients) {
    await upsertNode(
      {
        entityType: "client",
        entityId: client.id,
        title: client.name,
        summary: client.notes ?? client.email ?? null,
        category: client.type,
        metadata: {
          status: client.status,
          source: client.source,
        },
      },
      registry,
      stats
    )
  }

  for (const decision of decisions) {
    await upsertNode(
      {
        entityType: "decision",
        entityId: decision.id,
        title: decision.title,
        summary:
          decision.outcome ??
          decision.description ??
          decision.lessonLearned ??
          null,
        category: decision.category,
        metadata: {
          status: decision.status,
          impactArea: decision.impactArea,
          effectiveness: decision.effectiveness,
          followUpRequired: decision.followUpRequired,
        },
      },
      registry,
      stats
    )

    if (decision.impactArea?.trim()) {
      const impactNodeId = await ensureImpactAreaNode(
        decision.impactArea,
        registry,
        stats
      )
      const decisionNodeId = registry.get(registryKey("decision", decision.id))

      if (decisionNodeId) {
        await ensureEdge(
          decisionNodeId,
          impactNodeId,
          "impacts_area",
          stats
        )
      }
    }
  }

  for (const lesson of lessons) {
    await upsertNode(
      {
        entityType: "lesson",
        entityId: lesson.id,
        title: lesson.title,
        summary: lesson.lesson,
        category: lesson.category,
        metadata: {
          impactArea: lesson.impactArea,
          effectiveness: lesson.effectiveness,
          sourceDecisionId: lesson.sourceDecisionId,
        },
      },
      registry,
      stats
    )

    if (lesson.sourceDecisionId) {
      const decisionNodeId = registry.get(
        registryKey("decision", lesson.sourceDecisionId)
      )
      const lessonNodeId = registry.get(registryKey("lesson", lesson.id))

      if (decisionNodeId && lessonNodeId) {
        await ensureEdge(decisionNodeId, lessonNodeId, "has_lesson", stats)
      }
    }

    if (lesson.impactArea?.trim()) {
      const impactNodeId = await ensureImpactAreaNode(
        lesson.impactArea,
        registry,
        stats
      )
      const lessonNodeId = registry.get(registryKey("lesson", lesson.id))

      if (lessonNodeId) {
        await ensureEdge(lessonNodeId, impactNodeId, "impacts_area", stats)
      }
    }
  }

  for (const goal of goals) {
    await upsertNode(
      {
        entityType: "goal",
        entityId: goal.id,
        title: goal.title,
        summary: goal.description,
        category: goal.category,
        metadata: {
          quarter: goal.quarter,
          year: goal.year,
          status: goal.status,
          progress: goal.progress,
        },
      },
      registry,
      stats
    )
  }

  for (const initiative of initiatives) {
    await upsertNode(
      {
        entityType: "initiative",
        entityId: initiative.id,
        title: initiative.title,
        summary: initiative.description ?? initiative.targetOutcome,
        category: initiative.priority,
        metadata: {
          status: initiative.status,
          riskLevel: initiative.riskLevel,
          progress: initiative.progress,
          goalId: initiative.goalId,
        },
      },
      registry,
      stats
    )

    if (initiative.goalId) {
      const goalNodeId = registry.get(registryKey("goal", initiative.goalId))
      const initiativeNodeId = registry.get(
        registryKey("initiative", initiative.id)
      )

      if (goalNodeId && initiativeNodeId) {
        await ensureEdge(goalNodeId, initiativeNodeId, "owns_initiative", stats)
      }
    }
  }

  for (const session of boardroomSessions) {
    await upsertNode(
      {
        entityType: "boardroom_session",
        entityId: session.id,
        title: `${session.sessionType} boardroom session`,
        summary: session.summary,
        category: session.sessionType,
        metadata: {
          healthScore: session.healthScore,
        },
      },
      registry,
      stats
    )
  }

  for (const decision of decisions) {
    if (!decision.boardroomId) {
      continue
    }

    const sessionNodeId = registry.get(
      registryKey("boardroom_session", decision.boardroomId)
    )
    const decisionNodeId = registry.get(registryKey("decision", decision.id))

    if (sessionNodeId && decisionNodeId) {
      await ensureEdge(
        sessionNodeId,
        decisionNodeId,
        "includes_decision",
        stats
      )
    }
  }

  for (const cycle of planningCycles) {
    await upsertNode(
      {
        entityType: "planning_cycle",
        entityId: cycle.id,
        title: `${cycle.cycleType} planning cycle`,
        summary: cycle.summary,
        category: cycle.cycleType,
        metadata: {
          status: cycle.status,
          healthScore: cycle.healthScore,
        },
      },
      registry,
      stats
    )
  }

  for (const project of projects) {
    await upsertNode(
      {
        entityType: "client_project",
        entityId: project.id,
        title: project.title,
        summary: project.description,
        category: project.status,
        metadata: {
          clientId: project.clientId,
          valueAud: project.valueAud,
        },
      },
      registry,
      stats
    )

    const clientNodeId = registry.get(registryKey("client", project.clientId))
    const projectNodeId = registry.get(registryKey("client_project", project.id))

    if (clientNodeId && projectNodeId) {
      await ensureEdge(clientNodeId, projectNodeId, "has_project", stats)
    }
  }

  for (const task of tasks) {
    await upsertNode(
      {
        entityType: "client_project_task",
        entityId: task.id,
        title: task.title,
        summary: task.description,
        category: task.status,
        metadata: {
          projectId: task.projectId,
          priority: task.priority,
        },
      },
      registry,
      stats
    )

    const projectNodeId = registry.get(
      registryKey("client_project", task.projectId)
    )
    const taskNodeId = registry.get(registryKey("client_project_task", task.id))

    if (projectNodeId && taskNodeId) {
      await ensureEdge(projectNodeId, taskNodeId, "has_task", stats)
    }
  }

  for (const invoice of invoices) {
    await upsertNode(
      {
        entityType: "client_invoice",
        entityId: invoice.id,
        title: invoice.invoiceNumber,
        summary: invoice.notes,
        category: invoice.status,
        metadata: {
          clientId: invoice.clientId,
          projectId: invoice.projectId,
          amountAud: invoice.amountAud,
        },
      },
      registry,
      stats
    )

    const clientNodeId = registry.get(registryKey("client", invoice.clientId))
    const invoiceNodeId = registry.get(registryKey("client_invoice", invoice.id))

    if (clientNodeId && invoiceNodeId) {
      await ensureEdge(clientNodeId, invoiceNodeId, "has_invoice", stats)
    }

    if (invoice.projectId) {
      const projectNodeId = registry.get(
        registryKey("client_project", invoice.projectId)
      )

      if (projectNodeId && invoiceNodeId) {
        await ensureEdge(invoiceNodeId, projectNodeId, "for_project", stats)
      }
    }
  }

  for (const lead of leads) {
    await upsertNode(
      {
        entityType: "creator_lead",
        entityId: lead.id,
        title: lead.name,
        summary: lead.notes ?? lead.niche,
        category: lead.status,
        metadata: {
          email: lead.email,
          readiness: lead.readiness,
          leadScore: lead.leadScore,
          projectedValue: lead.projectedValue,
        },
      },
      registry,
      stats
    )
  }

  for (const proposal of proposals) {
    if (!proposal.leadId) {
      continue
    }

    await upsertNode(
      {
        entityType: "creator_proposal",
        entityId: proposal.id,
        title: proposal.title,
        summary: proposal.description ?? proposal.aiSummary,
        category: proposal.status,
        metadata: {
          leadId: proposal.leadId,
          estimatedValue: proposal.estimatedValue,
        },
      },
      registry,
      stats
    )

    const leadNodeId = registry.get(registryKey("creator_lead", proposal.leadId))
    const proposalNodeId = registry.get(
      registryKey("creator_proposal", proposal.id)
    )

    if (leadNodeId && proposalNodeId) {
      await ensureEdge(leadNodeId, proposalNodeId, "has_proposal", stats)
    }
  }

  // -------------------------------------------------------------------------
  // Phase 21.1 expansion — cross-domain relationships (all duplicate-safe
  // via ensureEdge, which skips existing from/to/relation triples).
  // -------------------------------------------------------------------------

  // QuarterlyReview nodes + review -> goals in the same quarter/year.
  for (const review of quarterlyReviews) {
    await upsertNode(
      {
        entityType: "quarterly_review",
        entityId: review.id,
        title: `${review.quarter} ${review.year} quarterly review`,
        summary: review.executiveSummary,
        category: "quarterly_review",
        metadata: {
          quarter: review.quarter,
          year: review.year,
          healthScore: review.healthScore,
        },
      },
      registry,
      stats
    )

    const reviewNodeId = registry.get(
      registryKey("quarterly_review", review.id)
    )

    if (!reviewNodeId) {
      continue
    }

    for (const goal of goals) {
      if (goal.quarter === review.quarter && goal.year === review.year) {
        const goalNodeId = registry.get(registryKey("goal", goal.id))

        if (goalNodeId) {
          await ensureEdge(reviewNodeId, goalNodeId, "reviews_goal", stats)
        }
      }
    }
  }

  // PlanningCycle -> open strategic initiatives it plans against.
  for (const cycle of planningCycles) {
    const cycleNodeId = registry.get(registryKey("planning_cycle", cycle.id))

    if (!cycleNodeId) {
      continue
    }

    for (const initiative of initiatives) {
      if (
        initiative.status === "in_progress" ||
        initiative.status === "proposed"
      ) {
        const initiativeNodeId = registry.get(
          registryKey("initiative", initiative.id)
        )

        if (initiativeNodeId) {
          await ensureEdge(
            cycleNodeId,
            initiativeNodeId,
            "plans_initiative",
            stats
          )
        }
      }
    }
  }

  // ExecutiveDecision -> StrategicInitiative / QuarterlyGoal via shared focus
  // (decision category or impact area matching initiative owner system or
  // goal category).
  for (const decision of decisions) {
    const decisionNodeId = registry.get(registryKey("decision", decision.id))

    if (!decisionNodeId) {
      continue
    }

    const decisionFocus = new Set(
      [normalizeFocus(decision.category), normalizeFocus(decision.impactArea)]
        .filter((value): value is string => Boolean(value))
    )

    if (decisionFocus.size === 0) {
      continue
    }

    for (const initiative of initiatives) {
      const ownerSystem = normalizeFocus(initiative.ownerSystem)

      if (ownerSystem && decisionFocus.has(ownerSystem)) {
        const initiativeNodeId = registry.get(
          registryKey("initiative", initiative.id)
        )

        if (initiativeNodeId) {
          await ensureEdge(
            decisionNodeId,
            initiativeNodeId,
            "influences_initiative",
            stats
          )
        }
      }
    }

    for (const goal of goals) {
      const goalCategory = normalizeFocus(goal.category)

      if (goalCategory && decisionFocus.has(goalCategory)) {
        const goalNodeId = registry.get(registryKey("goal", goal.id))

        if (goalNodeId) {
          await ensureEdge(decisionNodeId, goalNodeId, "supports_goal", stats)
        }
      }
    }
  }

  // ExecutiveLesson -> QuarterlyGoal via shared category/impact area.
  for (const lesson of lessons) {
    const lessonNodeId = registry.get(registryKey("lesson", lesson.id))

    if (!lessonNodeId) {
      continue
    }

    const lessonFocus = new Set(
      [normalizeFocus(lesson.category), normalizeFocus(lesson.impactArea)]
        .filter((value): value is string => Boolean(value))
    )

    if (lessonFocus.size === 0) {
      continue
    }

    for (const goal of goals) {
      const goalCategory = normalizeFocus(goal.category)

      if (goalCategory && lessonFocus.has(goalCategory)) {
        const goalNodeId = registry.get(registryKey("goal", goal.id))

        if (goalNodeId) {
          await ensureEdge(lessonNodeId, goalNodeId, "informs_goal", stats)
        }
      }
    }
  }

  // Revenue impact area — invoices, clients, and leads all connect to it.
  const revenueNodeId = await ensureImpactAreaNode("Revenue", registry, stats)

  for (const invoice of invoices) {
    const invoiceNodeId = registry.get(
      registryKey("client_invoice", invoice.id)
    )

    if (invoiceNodeId) {
      await ensureEdge(invoiceNodeId, revenueNodeId, "contributes_revenue", stats)
    }
  }

  for (const client of clients) {
    const clientNodeId = registry.get(registryKey("client", client.id))

    if (clientNodeId) {
      await ensureEdge(clientNodeId, revenueNodeId, "generates_revenue", stats)
    }
  }

  for (const lead of leads) {
    const leadNodeId = registry.get(registryKey("creator_lead", lead.id))

    if (leadNodeId) {
      await ensureEdge(leadNodeId, revenueNodeId, "potential_revenue", stats)
    }
  }

  // ClientProject -> delivery-owned strategic initiatives.
  for (const project of projects) {
    const projectNodeId = registry.get(
      registryKey("client_project", project.id)
    )

    if (!projectNodeId) {
      continue
    }

    for (const initiative of initiatives) {
      if (normalizeFocus(initiative.ownerSystem) === "delivery") {
        const initiativeNodeId = registry.get(
          registryKey("initiative", initiative.id)
        )

        if (initiativeNodeId) {
          await ensureEdge(
            projectNodeId,
            initiativeNodeId,
            "supports_initiative",
            stats
          )
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // Phase 25 expansion — decision execution outcomes. Each decision with a
  // recorded outcome or effectiveness gets dedicated outcome/effectiveness
  // nodes linked back to the decision (duplicate-safe via upsertNode keyed
  // on entityType + entityId, and ensureEdge).
  // -------------------------------------------------------------------------
  for (const decision of decisions) {
    const decisionNodeId = registry.get(registryKey("decision", decision.id))

    if (!decisionNodeId) {
      continue
    }

    if (decision.outcome?.trim()) {
      const outcomeNodeId = await upsertNode(
        {
          entityType: "decision_outcome",
          entityId: decision.id,
          title: `Outcome: ${decision.title}`,
          summary: decision.outcome.trim(),
          category: "decision_outcome",
          metadata: {
            decisionId: decision.id,
            status: decision.status,
          },
        },
        registry,
        stats
      )

      await ensureEdge(decisionNodeId, outcomeNodeId, "has_outcome", stats)
    }

    if (decision.effectiveness !== null) {
      const normalizedEffectiveness = Math.max(
        0,
        Math.min(
          100,
          decision.effectiveness <= 5
            ? decision.effectiveness * 20
            : decision.effectiveness
        )
      )

      const effectivenessNodeId = await upsertNode(
        {
          entityType: "decision_effectiveness",
          entityId: decision.id,
          title: `Effectiveness ${normalizedEffectiveness}/100: ${decision.title}`,
          summary: `Recorded effectiveness for "${decision.title}" normalized to ${normalizedEffectiveness}/100.`,
          category: "decision_effectiveness",
          metadata: {
            decisionId: decision.id,
            effectiveness: decision.effectiveness,
            normalizedEffectiveness,
          },
        },
        registry,
        stats
      )

      await ensureEdge(
        decisionNodeId,
        effectivenessNodeId,
        "has_effectiveness",
        stats
      )
    }
  }

  const [totalNodes, totalEdges] = await Promise.all([
    prisma.executiveKnowledgeNode.count(),
    prisma.executiveKnowledgeEdge.count(),
  ])

  return {
    nodesCreated: stats.nodesCreated,
    nodesUpdated: stats.nodesUpdated,
    edgesCreated: stats.edgesCreated,
    totalNodes,
    totalEdges,
  }
}

export async function getExecutiveKnowledgeGraphSummary(): Promise<KnowledgeGraphSummary> {
  const [
    recentNodes,
    recentEdges,
    totalNodes,
    totalEdges,
    nodesByType,
    edgesByRelation,
  ] = await Promise.all([
    prisma.executiveKnowledgeNode.findMany({
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    prisma.executiveKnowledgeEdge.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.executiveKnowledgeNode.count(),
    prisma.executiveKnowledgeEdge.count(),
    prisma.executiveKnowledgeNode.groupBy({
      by: ["entityType"],
      _count: { _all: true },
    }),
    prisma.executiveKnowledgeEdge.groupBy({
      by: ["relation"],
      _count: { _all: true },
    }),
  ])

  const nodeCountsByType: Record<string, number> = {}
  for (const row of nodesByType) {
    nodeCountsByType[row.entityType] = row._count._all
  }

  const edgeCountsByRelation: Record<string, number> = {}
  for (const row of edgesByRelation) {
    edgeCountsByRelation[row.relation] = row._count._all
  }

  return {
    totalNodes,
    totalEdges,
    nodeCountsByType,
    edgeCountsByRelation,
    recentNodes: recentNodes.map(serializeKnowledgeNode),
    recentEdges: recentEdges.map(serializeKnowledgeEdge),
  }
}

function matchesQuery(value: string | null | undefined, query: string) {
  return Boolean(value && value.toLowerCase().includes(query))
}

export async function searchExecutiveKnowledgeGraph(
  query: string
): Promise<KnowledgeSearchResult[]> {
  const normalized = query.trim().toLowerCase()

  if (!normalized) {
    return []
  }

  const nodes = await prisma.executiveKnowledgeNode.findMany({
    orderBy: { updatedAt: "desc" },
  })

  const matchingNodes = nodes.filter(
    (node) =>
      matchesQuery(node.title, normalized) ||
      matchesQuery(node.summary, normalized) ||
      matchesQuery(node.category, normalized) ||
      matchesQuery(node.entityType, normalized)
  )

  if (matchingNodes.length === 0) {
    return []
  }

  const nodeIds = matchingNodes.map((node) => node.id)
  const nodeMap = new Map(nodes.map((node) => [node.id, node]))

  const edges = await prisma.executiveKnowledgeEdge.findMany({
    where: {
      OR: [{ fromNodeId: { in: nodeIds } }, { toNodeId: { in: nodeIds } }],
    },
    orderBy: { createdAt: "desc" },
  })

  return matchingNodes.map((node) => {
    const connectedEdges: KnowledgeSearchEdge[] = []

    for (const edge of edges) {
      if (edge.fromNodeId === node.id) {
        const connected = nodeMap.get(edge.toNodeId)

        if (connected) {
          connectedEdges.push({
            ...serializeKnowledgeEdge(edge),
            direction: "outgoing",
            connectedNodeId: connected.id,
            connectedNodeTitle: connected.title,
            connectedNodeType: connected.entityType,
          })
        }
      }

      if (edge.toNodeId === node.id) {
        const connected = nodeMap.get(edge.fromNodeId)

        if (connected) {
          connectedEdges.push({
            ...serializeKnowledgeEdge(edge),
            direction: "incoming",
            connectedNodeId: connected.id,
            connectedNodeTitle: connected.title,
            connectedNodeType: connected.entityType,
          })
        }
      }
    }

    return {
      node: serializeKnowledgeNode(node),
      connectedEdges,
    }
  })
}
