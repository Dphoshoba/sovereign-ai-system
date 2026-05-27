import { NextRequest, NextResponse } from "next/server"
import { promptEngineeringAgent } from "../../../../lib/agents/prompt-engineering-agent"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const result = promptEngineeringAgent({
      topic: body.topic || "AI Automation",
      persona: body.persona || "creators",
      trendScore: Number(body.trendScore || 70),
      reinforcementScore: Number(body.reinforcementScore || 70),
      winningHooks: body.winningHooks || [],
      winningTitles: body.winningTitles || [],
      thumbnailStyle: body.thumbnailStyle || "bold",
    })

    return NextResponse.json({
      ok: true,
      result,
    })
  } catch (error) {
    console.error(
      "Prompt engineering agent failed:",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          "Prompt engineering agent failed",
      },
      {
        status: 500,
      }
    )
  }
}