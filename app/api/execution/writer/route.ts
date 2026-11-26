import { NextRequest, NextResponse } from "next/server"

import { writerAgent } from "../../../../lib/agents/writer-agent"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function POST(req: NextRequest) {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  const body = await req.json()

  const result = writerAgent({
    title: body.title,
    niche: body.niche || "AI + Faith",
    contentType: body.contentType || "Blog Article",
  })

  return NextResponse.json({
    ok: true,
    result,
  })
}
