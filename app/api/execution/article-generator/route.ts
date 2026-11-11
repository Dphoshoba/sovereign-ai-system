import { NextRequest, NextResponse } from "next/server"

import { articleGeneratorAgent } from "../../../../lib/agents/article-generator-agent"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function POST(req: NextRequest) {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  const body = await req.json()

  const result = articleGeneratorAgent({
    title:
      body.title ||
      "The Future of AI and Faith: Opportunities, Risks and Wisdom",
    niche: body.niche || "AI + Faith",
  })

  return NextResponse.json({
    ok: true,
    result,
  })
}
