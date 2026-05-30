import { NextRequest, NextResponse } from "next/server"

import { titleOptimizerAgent } from "../../../../lib/agents/title-optimizer-agent"

export async function POST(req: NextRequest) {
  const body = await req.json()

  const result = titleOptimizerAgent({
    rawTitle: body.rawTitle || "AI + Faith trends",
    niche: body.niche || "AI + Faith",
  })

  return NextResponse.json({
    ok: true,
    result,
  })
}
