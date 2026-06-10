import "dotenv/config"
import { prisma } from "@/lib/prisma"
import {
  loadBoardroomContext,
  runBoardroomSession,
} from "@/lib/executive/boardroom"
import { saveBoardroomKeyDecisions } from "@/lib/executive/decision-memory"
import {
  buildQuarterlyReview,
  getCurrentQuarter,
} from "@/lib/executive/quarterly-review"
import {
  buildPlanningCycle,
  loadPlanningCycleInputs,
} from "@/lib/executive/planning-cycle"
import { buildGoalSyncUpdates } from "@/lib/executive/initiative-performance"
import { buildExecutiveKnowledgeGraph } from "@/lib/executive/knowledge-graph"

// Phase 20.1 — Activate the executive operating rhythm.
// Rule-based only, duplicate-safe, no schema changes, no OpenAI.

type Counts = {
  boardroomSessions: number
  quarterlyReviews: number
  planningCycles: number
  totalGoals: number
  totalInitiatives: number
  knowledgeGraphNodes: number
  knowledgeGraphEdges: number
}

async function getCounts(): Promise<Counts> {
  const [
    boardroomSessions,
    quarterlyReviews,
    planningCycles,
    totalGoals,
    totalInitiatives,
    knowledgeGraphNodes,
    knowledgeGraphEdges,
  ] = await Promise.all([
    prisma.executiveBoardroomSession.count(),
    prisma.executiveQuarterlyReview.count(),
    prisma.planningCycle.count(),
    prisma.quarterlyGoal.count(),
    prisma.strategicInitiative.count(),
    prisma.executiveKnowledgeNode.count(),
    prisma.executiveKnowledgeEdge.count(),
  ])

  return {
    boardroomSessions,
    quarterlyReviews,
    planningCycles,
    totalGoals,
    totalInitiatives,
    knowledgeGraphNodes,
    knowledgeGraphEdges,
  }
}

function getCurrentWeekStart(date = new Date()) {
  const weekStart = new Date(date)
  const day = weekStart.getDay()
  const daysSinceMonday = (day + 6) % 7
  weekStart.setDate(weekStart.getDate() - daysSinceMonday)
  weekStart.setHours(0, 0, 0, 0)
  return weekStart
}

/** Create one activation boardroom session if none exists. */
async function ensureBoardroomSession() {
  const existingCount = await prisma.executiveBoardroomSession.count()

  if (existingCount > 0) {
    console.log(
      `Boardroom: ${existingCount} session${existingCount === 1 ? "" : "s"} already exist — skipping.`
    )
    return
  }

  const context = await loadBoardroomContext("weekly")
  const session = runBoardroomSession(context)

  const record = await prisma.executiveBoardroomSession.create({
    data: {
      sessionType: session.sessionType,
      healthScore: session.healthScore,
      summary: session.executiveSummary,
      decisions: {
        agents: session.agents,
        keyDecisions: session.keyDecisions,
        topPriorities: session.topPriorities,
        majorRisks: session.majorRisks,
        majorOpportunities: session.majorOpportunities,
        learningSummary: session.learningSummary,
      },
    },
  })

  const decisionsCreated = await saveBoardroomKeyDecisions(
    record.id,
    session.keyDecisions
  )

  console.log(
    `Boardroom: created activation session ${record.id} (health ${session.healthScore}, ${decisionsCreated} decision${decisionsCreated === 1 ? "" : "s"} saved).`
  )
}

/** Create the current quarter's review if it does not exist. */
async function ensureQuarterlyReview() {
  const { quarter, year } = getCurrentQuarter()

  const existing = await prisma.executiveQuarterlyReview.findUnique({
    where: { quarter_year: { quarter, year } },
  })

  if (existing) {
    console.log(
      `Quarterly review: ${quarter} ${year} already exists — skipping.`
    )
    return
  }

  const review = await buildQuarterlyReview(quarter, year)

  const record = await prisma.executiveQuarterlyReview.create({
    data: {
      quarter: review.quarter,
      year: review.year,
      healthScore: review.healthScore,
      executiveSummary: review.executiveSummary,
      reviewJson: review,
    },
  })

  console.log(
    `Quarterly review: created ${record.quarter} ${record.year} (health ${record.healthScore}).`
  )
}

/** Create a weekly planning cycle if none exists for the current week. */
async function ensureWeeklyPlanningCycle() {
  const weekStart = getCurrentWeekStart()

  const existing = await prisma.planningCycle.findFirst({
    where: {
      cycleType: "weekly",
      createdAt: { gte: weekStart },
    },
  })

  if (existing) {
    console.log(
      `Planning cycle: weekly cycle ${existing.id} already exists for this week — skipping.`
    )
    return
  }

  const inputs = await loadPlanningCycleInputs("weekly")
  const result = buildPlanningCycle(inputs)

  const cycle = await prisma.planningCycle.create({
    data: {
      cycleType: result.cycleType,
      status: "draft",
      healthScore: result.healthScore,
      summary: result.summary,
      recommendations: result.recommendations,
      risks: result.risks,
      opportunities: result.opportunities,
      actions: result.actions,
    },
  })

  console.log(
    `Planning cycle: created weekly cycle ${cycle.id} (health ${cycle.healthScore}).`
  )
}

/** Sync QuarterlyGoal progress from linked StrategicInitiatives. */
async function syncGoalsFromInitiatives() {
  const [goals, initiatives] = await Promise.all([
    prisma.quarterlyGoal.findMany(),
    prisma.strategicInitiative.findMany({
      where: { goalId: { not: null } },
      select: { id: true, goalId: true, status: true, progress: true },
    }),
  ])

  const updates = buildGoalSyncUpdates(goals, initiatives)
  let updatedGoals = 0

  for (const update of updates) {
    const statusUpdate =
      update.progress >= 100
        ? "completed"
        : update.progress >= 60
          ? "active"
          : update.progress > 0
            ? "at-risk"
            : null

    await prisma.quarterlyGoal.update({
      where: { id: update.goalId },
      data: {
        progress: update.progress,
        currentValue: update.currentValue,
        ...(statusUpdate ? { status: statusUpdate } : {}),
      },
    })

    updatedGoals += 1
  }

  console.log(
    `Goal sync: updated ${updatedGoals} goal${updatedGoals === 1 ? "" : "s"} from ${initiatives.length} linked initiative${initiatives.length === 1 ? "" : "s"}.`
  )
}

async function main() {
  console.log("Phase 20.1 — Activate Executive Operations")
  console.log("")

  const before = await getCounts()
  console.log("Counts before:", before)
  console.log("")

  await ensureBoardroomSession()
  await ensureQuarterlyReview()
  await ensureWeeklyPlanningCycle()
  await syncGoalsFromInitiatives()

  console.log("Rebuilding executive knowledge graph...")
  const graph = await buildExecutiveKnowledgeGraph()
  console.log(
    `Knowledge graph: +${graph.nodesCreated} nodes, +${graph.edgesCreated} edges (${graph.nodesUpdated} updated).`
  )
  console.log("")

  const after = await getCounts()
  console.log("Counts after:", after)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => process.exit())
