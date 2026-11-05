import { NextRequest, NextResponse } from "next/server"

import { publisherAgent } from "../../../../lib/agents/publisher-agent"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function POST(req: NextRequest) {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

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
