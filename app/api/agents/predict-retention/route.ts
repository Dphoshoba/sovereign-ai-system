import { NextRequest, NextResponse } from "next/server"

import { retentionPredictionAgent } from "../../../../lib/agents/retention-prediction-agent"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function POST(req: NextRequest) {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  try {
    const body = await req.json()

    const prediction = retentionPredictionAgent({
      hookStrength: Number(body.hookStrength || 0),

      pacingScore: Number(body.pacingScore || 0),

      emotionalIntensity: Number(body.emotionalIntensity || 0),

      titleStrength: Number(body.titleStrength || 0),

      thumbnailStrength: Number(body.thumbnailStrength || 0),
    })

    return NextResponse.json({
      ok: true,
      prediction,
    })
  } catch (error) {
    console.error("Retention prediction failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error: "Retention prediction failed",
      },
      {
        status: 500,
      }
    )
  }
}