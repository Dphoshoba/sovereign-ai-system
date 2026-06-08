import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  convertSimulationToStrategy,
  type SimulationStrategy,
} from "@/lib/executive/simulation-strategy"
import { runStrategicSimulation } from "@/lib/executive/strategic-simulation"
import type { StrategicSimulationResult } from "@/lib/executive/strategic-simulation"

const SCENARIO_STATUSES = [
  "generated",
  "approved",
  "rejected",
  "implemented",
] as const

type StoredScenarioPayload = {
  simulation: StrategicSimulationResult
  strategy: SimulationStrategy
}

function serializeScenario(record: {
  id: string
  scenario: string
  title: string
  summary: string | null
  impactScore: number | null
  recommendation: string | null
  status: string
  simulationJson: unknown
  createdAt: Date
  updatedAt: Date
}) {
  const payload = (record.simulationJson ?? {}) as Partial<StoredScenarioPayload>

  return {
    id: record.id,
    scenario: record.scenario,
    title: record.title,
    summary: record.summary,
    impactScore: record.impactScore,
    recommendation: record.recommendation,
    status: record.status,
    strategy: payload.strategy ?? null,
    simulation: payload.simulation ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

export async function GET() {
  try {
    const records = await prisma.strategicScenario.findMany({
      orderBy: { createdAt: "desc" },
    })

    const scenarios = records.map(serializeScenario)
    const summary = {
      generated: scenarios.filter((item) => item.status === "generated").length,
      approved: scenarios.filter((item) => item.status === "approved").length,
      implemented: scenarios.filter((item) => item.status === "implemented")
        .length,
      rejected: scenarios.filter((item) => item.status === "rejected").length,
    }

    return NextResponse.json({
      ok: true,
      summary,
      scenarios,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to list strategic scenarios",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const scenario =
      typeof body?.scenario === "string" ? body.scenario.trim() : ""

    if (!scenario) {
      return NextResponse.json(
        {
          ok: false,
          error: "scenario is required",
        },
        { status: 400 }
      )
    }

    const simulation = await runStrategicSimulation(scenario)
    const strategy = convertSimulationToStrategy(simulation)

    const record = await prisma.strategicScenario.create({
      data: {
        scenario: simulation.scenario,
        title: strategy.title,
        summary: strategy.summary,
        impactScore: strategy.impactScore,
        recommendation: strategy.recommendation,
        status: "generated",
        simulationJson: {
          simulation,
          strategy,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      scenario: serializeScenario(record),
      strategy,
      simulation,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to convert simulation to strategy",
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

    if (!id || !status) {
      return NextResponse.json(
        {
          ok: false,
          error: "id and status are required",
        },
        { status: 400 }
      )
    }

    if (!SCENARIO_STATUSES.includes(status as (typeof SCENARIO_STATUSES)[number])) {
      return NextResponse.json(
        {
          ok: false,
          error: `Invalid status. Expected one of: ${SCENARIO_STATUSES.join(", ")}`,
        },
        { status: 400 }
      )
    }

    const record = await prisma.strategicScenario.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json({
      ok: true,
      scenario: serializeScenario(record),
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update strategic scenario",
      },
      { status: 500 }
    )
  }
}
