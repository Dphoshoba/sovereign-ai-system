import { NextRequest, NextResponse } from "next/server"

import { contentGenerationLoopAgent } from "../../../../lib/agents/content-generation-loop-agent"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function POST(req: NextRequest) {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  try {
    const body = await req.json()

    const result = await contentGenerationLoopAgent({
      niche: body.niche || "AI + Faith",

      audience: body.audience || "faith-tech creators",
    })

    return NextResponse.json({
      ok: true,
      result,
    })
  } catch (error) {
    console.error("Content generation loop failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error: "Content generation loop failed",
      },
      {
        status: 500,
      }
    )
  }
}