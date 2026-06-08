import { buildExecutiveForecast } from "@/lib/executive/forecast"
import { EXECUTIVE_LIST_LIMITS } from "@/lib/executive/list-limits"
import { getExecutiveKnowledgeGraphSummary } from "@/lib/executive/knowledge-graph"
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
  const runtimeResult = await Promise.allSettled([timed(runSovereignRuntime)])

  const runtimeTimed =
    runtimeResult[0].status === "fulfilled" ? runtimeResult[0].value : null
  const runtimeFailure =
    runtimeResult[0].status === "rejected" ? runtimeResult[0].reason : null

  const [
    boardroomResult,
    forecastResult,
    planningResult,
    knowledgeGraphResult,
  ] = await Promise.allSettled([
    timed(() => prisma.executiveBoardroomSession.count()),
    timed(async () => {
      const cutoff = getMonthlyReviewDateCutoff()
      const [snapshot, briefings] = await Promise.all([
        getExecutivePlatformSnapshot(),
        prisma.executiveBriefing.findMany({
          where: { briefingDate: { gte: cutoff } },
          orderBy: { briefingDate: "desc" },
          take: EXECUTIVE_LIST_LIMITS.executiveBriefings,
        }),
      ])
      const monthlyReview = buildExecutiveMonthlyReview(briefings)
      return buildExecutiveForecast({
        snapshot,
        briefings,
        monthlyReview,
      })
    }),
    timed(() =>
      prisma.planningCycle.findFirst({
        orderBy: { createdAt: "desc" },
        select: {
          cycleType: true,
          healthScore: true,
        },
      })
    ),
    timed(getExecutiveKnowledgeGraphSummary),
  ])

  const runtime: ExecutiveModuleHealth = runtimeTimed
    ? {
        ok: true,
        latencyMs: runtimeTimed.latencyMs,
        executiveStatus: runtimeTimed.value.executiveStatus,
        runtimeHealth: runtimeTimed.value.runtimeHealth,
        healthScore: runtimeTimed.value.runtimeHealth,
      }
    : failureHealth(0, runtimeFailure)

  const commandCenter: ExecutiveModuleHealth = runtimeTimed
    ? {
        ok: true,
        latencyMs: runtimeTimed.latencyMs,
        executiveStatus: runtimeTimed.value.executiveStatus,
        healthScore: runtimeTimed.value.runtimeHealth,
      }
    : failureHealth(0, runtimeFailure)

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
          cycleType: planningResult.value.value?.cycleType ?? "weekly",
          healthScore: planningResult.value.value?.healthScore ?? null,
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
