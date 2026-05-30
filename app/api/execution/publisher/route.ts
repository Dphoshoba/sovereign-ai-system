import { NextRequest, NextResponse } from "next/server"

import { publisherAgent } from "../../../../lib/agents/publisher-agent"

export async function POST(req: NextRequest) {
  const body = await req.json()

  const result = publisherAgent({
    title: body.title,
    mdxPath: body.mdxPath,
    status: body.status || "draft",
  })

  return NextResponse.json({
    ok: true,
    result,
  })
}
