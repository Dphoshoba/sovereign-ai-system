import { NextRequest, NextResponse } from "next/server"

import { factCheckerAgent } from "../../../../lib/agents/fact-checker-agent"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function POST(req: NextRequest) {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  const body = await req.json()

  const result = factCheckerAgent({
    title: body.title,
  })

  return NextResponse.json({
    ok: true,
    result,
  })
}
