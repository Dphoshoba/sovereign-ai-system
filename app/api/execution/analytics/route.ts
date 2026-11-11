import { NextRequest, NextResponse } from "next/server"

import { analyticsAgent } from "../../../../lib/agents/analytics-agent"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function POST(req: NextRequest) {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

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
