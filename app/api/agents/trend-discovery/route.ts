import { NextRequest, NextResponse } from "next/server"

import { trendDiscoveryAgent } from "../../../../lib/agents/trend-discovery-agent"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function POST(req: NextRequest) {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  try {
    const body = await req.json()

    const result = trendDiscoveryAgent({
      niche: body.niche || "AI + Faith",
    })

    return NextResponse.json({
      ok: true,
      result,
    })
  } catch (error) {
    console.error("Trend discovery failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error: "Trend discovery failed",
      },
      {
        status: 500,
      }
    )
  }
}