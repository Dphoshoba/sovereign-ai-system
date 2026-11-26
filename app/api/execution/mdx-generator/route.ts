import { NextRequest, NextResponse } from "next/server"

import { mdxGeneratorAgent } from "../../../../lib/agents/mdx-generator-agent"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function POST(req: NextRequest) {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  const body = await req.json()

  const result = mdxGeneratorAgent({
    title: body.title,
    slug: body.slug,
    category: body.category || "ai-tools",
  })

  return NextResponse.json({
    ok: true,
    result,
  })
}
