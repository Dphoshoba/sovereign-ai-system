import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  buildPlanningCycle,
  isPlanningCycleStatus,
  loadPlanningCycleInputs,
} from "@/lib/executive/planning-cycle"
import { EXECUTIVE_LIST_LIMITS } from "@/lib/executive/list-limits"

function serializeCycle(cycle: {
  id: string
  cycleType: string
  status: string
  healthScore: number | null
  summary: string | null
  recommendations: unknown
  risks: unknown
  opportunities: unknown
  actions: unknown
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: cycle.id,
    cycleType: cycle.cycleType,
    status: cycle.status,
    healthScore: cycle.healthScore,
    summary: cycle.summary,
    recommendations: Array.isArray(cycle.recommendations)
      ? cycle.recommendations
      : [],
    risks: Array.isArray(cycle.risks) ? cycle.risks : [],
    opportunities: Array.isArray(cycle.opportunities)
      ? cycle.opportunities
      : [],
    actions: Array.isArray(cycle.actions) ? cycle.actions : [],
    createdAt: cycle.createdAt.toISOString(),
    updatedAt: cycle.updatedAt.toISOString(),
  }
}

export async function GET() {
  try {
    const cycles = await prisma.planningCycle.findMany({
      orderBy: { createdAt: "desc" },
      take: EXECUTIVE_LIST_LIMITS.planningCycles,
    })

    return NextResponse.json({
      ok: true,
      cycles: cycles.map(serializeCycle),
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch planning cycles",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    let cycleType = "weekly"

    try {
      const body = await request.json()
      if (body?.cycleType && typeof body.cycleType === "string") {
        cycleType = body.cycleType.trim() || "weekly"
      }
    } catch {
      // Empty body is fine — default to weekly.
    }

    const inputs = await loadPlanningCycleInputs(cycleType)
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

    return NextResponse.json({
      ok: true,
      cycle: serializeCycle(cycle),
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate planning cycle",
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const id = typeof body?.id === "string" ? body.id.trim() : ""
    const status =
      typeof body?.status === "string" ? body.status.trim() : ""

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Planning cycle id is required" },
        { status: 400 }
      )
    }

    if (!isPlanningCycleStatus(status)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Status must be draft, reviewed, approved, or archived",
        },
        { status: 400 }
      )
    }

    const existing = await prisma.planningCycle.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Planning cycle not found" },
        { status: 404 }
      )
    }

    const cycle = await prisma.planningCycle.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json({
      ok: true,
      cycle: serializeCycle(cycle),
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update planning cycle",
      },
      { status: 500 }
    )
  }
}
