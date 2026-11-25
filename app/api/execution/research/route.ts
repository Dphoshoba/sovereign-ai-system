import { NextRequest, NextResponse } from "next/server"

import { researchAgent } from "../../../../lib/agents/research-agent"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function POST(req: NextRequest) {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  const body = await req.json()

  const result = researchAgent({
    niche: body.niche || "AI + Faith",
  })

  return NextResponse.json({
    ok: true,
    result,
  })
}
