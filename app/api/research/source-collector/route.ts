import { NextRequest, NextResponse } from "next/server"

import { sourceCollector } from "../../../../lib/research/source-collector"

export async function POST(req: NextRequest) {
  const body = await req.json()

  const result = sourceCollector(
    body.topic || "The Future of AI and Faith"
  )

  return NextResponse.json({
    ok: true,
    result,
  })
}
