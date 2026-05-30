import { NextRequest, NextResponse } from "next/server"

import { analyticsAgent } from "../../../../lib/agents/analytics-agent"

export async function POST(req: NextRequest) {
  const body = await req.json()

  const result = analyticsAgent({
    title: body.title,
    status: body.status || "draft",
  })

  return NextResponse.json({
    ok: true,
    result,
  })
}
