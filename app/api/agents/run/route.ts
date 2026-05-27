import { NextResponse } from "next/server"
import { runCreatorSystem } from "../../../../lib/agents/orchestrator"

export async function GET() {
  try {
    const result = await runCreatorSystem()

    return NextResponse.json({
      ok: true,
      result,
    })
  } catch (error) {
    console.error("Agent system failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error: "Agent system failed",
      },
      {
        status: 500,
      }
    )
  }
}