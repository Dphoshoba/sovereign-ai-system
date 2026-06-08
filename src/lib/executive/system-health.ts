import { loadBoardroomContext } from "@/lib/executive/boardroom"
import { buildExecutiveCommandCenter } from "@/lib/executive/command-center"
import { buildExecutiveForecast } from "@/lib/executive/forecast"
import { getExecutiveKnowledgeGraphSummary } from "@/lib/executive/knowledge-graph"
import {
  buildPlanningCycle,
  loadPlanningCycleInputs,
} from "@/lib/executive/planning-cycle"
import {
  buildExecutiveMonthlyReview,
  getMonthlyReviewDateCutoff,
} from "@/lib/executive/monthly-review"
import { getExecutivePlatformSnapshot } from "@/lib/executive/platform-snapshot"
import { runSovereignRuntime } from "@/lib/executive/runtime"
import { prisma } from "@/lib/prisma"

export type ExecutiveModuleHealth = {
  ok: boolean
  latencyMs: number
  error?: string
  executiveStatus?: string
  healthScore?: number | null
  runtimeHealth?: number
  sessionCount?: number
  forecastHealthScore?: number
  cycleType?: string
  totalNodes?: number
  totalEdges?: number
}

export type ExecutiveSystemHealth = {
  runtime: ExecutiveModuleHealth
  commandCenter: ExecutiveModuleHealth
  boardroom: ExecutiveModuleHealth
  forecast: ExecutiveModuleHealth
  planning: ExecutiveModuleHealth
  knowledgeGraph: ExecutiveModuleHealth
}

async function timed<T>(
  fn: () => Promise<T>
): Promise<{ value: T; latencyMs: number }> {
  const started = Date.now()
  const value = await fn()
  return {
    value,
    latencyMs: Date.now() - started,
  }
}

function failureHealth(
  latencyMs: number,
  error: unknown
): ExecutiveModuleHealth {
  return {
    ok: false,
    latencyMs,
    error:
      error instanceof Error ? error.message : "Executive subsystem check failed",
  }
}

export async function buildExecutiveSystemHealth(): Promise<ExecutiveSystemHealth> {
  const [
    runtimeResult,
    commandCenterResult,
    boardroomResult,
    forecastResult,
    planningResult,
    knowledgeGraphResult,
  ] = await Promise.allSettled([
    timed(runSovereignRuntime),
    timed(buildExecutiveCommandCenter),
    timed(async () => {
      const [sessionCount] = await Promise.all([
        prisma.executiveBoardroomSession.count(),
        loadBoardroomContext("weekly"),
      ])
      return sessionCount
    }),
    timed(async () => {
      const cutoff = getMonthlyReviewDateCutoff()
      const [snapshot, briefings] = await Promise.all([
        getExecutivePlatformSnapshot(),
        prisma.executiveBriefing.findMany({
          where: { briefingDate: { gte: cutoff } },
          orderBy: { briefingDate: "desc" },
        }),
      ])
      const monthlyReview = buildExecutiveMonthlyReview(briefings)
      return buildExecutiveForecast({
        snapshot,
        briefings,
        monthlyReview,
      })
    }),
    timed(async () => {
      const inputs = await loadPlanningCycleInputs("weekly")
      return buildPlanningCycle(inputs)
    }),
    timed(getExecutiveKnowledgeGraphSummary),
  ])

  const runtime: ExecutiveModuleHealth =
    runtimeResult.status === "fulfilled"
      ? {
          ok: true,
          latencyMs: runtimeResult.value.latencyMs,
          executiveStatus: runtimeResult.value.value.executiveStatus,
          runtimeHealth: runtimeResult.value.value.runtimeHealth,
          healthScore: runtimeResult.value.value.runtimeHealth,
        }
      : failureHealth(0, runtimeResult.reason)

  const commandCenter: ExecutiveModuleHealth =
    commandCenterResult.status === "fulfilled"
      ? {
          ok: true,
          latencyMs: commandCenterResult.value.latencyMs,
          executiveStatus: commandCenterResult.value.value.executiveStatus,
          healthScore: commandCenterResult.value.value.healthScore,
        }
      : failureHealth(0, commandCenterResult.reason)

  const boardroom: ExecutiveModuleHealth =
    boardroomResult.status === "fulfilled"
      ? {
          ok: true,
          latencyMs: boardroomResult.value.latencyMs,
          sessionCount: boardroomResult.value.value,
        }
      : failureHealth(0, boardroomResult.reason)

  const forecast: ExecutiveModuleHealth =
    forecastResult.status === "fulfilled"
      ? {
          ok: true,
          latencyMs: forecastResult.value.latencyMs,
          forecastHealthScore:
            forecastResult.value.value.forecastHealthScore,
          healthScore: forecastResult.value.value.forecastHealthScore,
        }
      : failureHealth(0, forecastResult.reason)

  const planning: ExecutiveModuleHealth =
    planningResult.status === "fulfilled"
      ? {
          ok: true,
          latencyMs: planningResult.value.latencyMs,
          cycleType: planningResult.value.value.cycleType,
          healthScore: planningResult.value.value.healthScore,
        }
      : failureHealth(0, planningResult.reason)

  const knowledgeGraph: ExecutiveModuleHealth =
    knowledgeGraphResult.status === "fulfilled"
      ? {
          ok: true,
          latencyMs: knowledgeGraphResult.value.latencyMs,
          totalNodes: knowledgeGraphResult.value.value.totalNodes,
          totalEdges: knowledgeGraphResult.value.value.totalEdges,
        }
      : failureHealth(0, knowledgeGraphResult.reason)

  return {
    runtime,
    commandCenter,
    boardroom,
    forecast,
    planning,
    knowledgeGraph,
  }
}
