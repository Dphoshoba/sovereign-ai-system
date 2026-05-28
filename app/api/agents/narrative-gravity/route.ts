import { NextRequest, NextResponse } from "next/server"
import { narrativeGravityAgent } from "../../../../lib/agents/narrative-gravity-agent"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const result = narrativeGravityAgent({
      niche: body.niche || "AI + Faith",
    })

    return NextResponse.json({
      ok: true,
      result,
    })
  } catch (error) {
    console.error("Narrative gravity failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error: "Narrative gravity failed",
      },
      {
        status: 500,
      }
    )
  }
}
