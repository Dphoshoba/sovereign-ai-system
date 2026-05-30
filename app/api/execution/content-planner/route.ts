import { NextRequest, NextResponse } from "next/server"

import { contentPlannerAgent } from "../../../../lib/agents/content-planner-agent"

export async function POST(req: NextRequest) {
  const body = await req.json()

  const result = contentPlannerAgent({
    niche: body.niche || "AI + Faith",
    researchTopic:
      body.researchTopic || "AI + Faith trends",
  })

  return NextResponse.json({
    ok: true,
    result,
  })
}
