import { NextResponse } from "next/server"
import {
  listStrategicSimulationScenarios,
  runStrategicSimulation,
} from "@/lib/executive/strategic-simulation"

export async function GET() {
  try {
    return NextResponse.json({
      ok: true,
      scenarios: listStrategicSimulationScenarios(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to list strategic simulation scenarios",
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

    return NextResponse.json({
      ok: true,
      simulation,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to run strategic simulation",
      },
      { status: 500 }
    )
  }
}
