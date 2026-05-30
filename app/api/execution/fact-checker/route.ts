import { NextRequest, NextResponse } from "next/server"

import { factCheckerAgent } from "../../../../lib/agents/fact-checker-agent"

export async function POST(req: NextRequest) {
  const body = await req.json()

  const result = factCheckerAgent({
    title: body.title,
  })

  return NextResponse.json({
    ok: true,
    result,
  })
}
