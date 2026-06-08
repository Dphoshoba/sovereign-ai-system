import { NextResponse } from "next/server"
import { loadExecutiveStrategicPlan } from "@/lib/executive/load-strategic-plan"

export async function GET() {
  try {
    const plan = await loadExecutiveStrategicPlan()

    return NextResponse.json({
      ok: true,
      plan,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate strategic plan",
      },
      { status: 500 }
    )
  }
}
