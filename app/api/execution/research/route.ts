import { NextRequest, NextResponse } from "next/server"

import { researchAgent } from "../../../../lib/agents/research-agent"

export async function POST(req: NextRequest) {
  const body = await req.json()

  const result = researchAgent({
    niche: body.niche || "AI + Faith",
  })

  return NextResponse.json({
    ok: true,
    result,
  })
}
