import { NextResponse } from "next/server"
import { generateRecommendationImprovements } from "@/lib/executive/recommendation-improvement"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  try {
    const improvement = await generateRecommendationImprovements()

    return NextResponse.json({
      ok: true,
      improvement,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate recommendation improvements",
      },
      { status: 500 }
    )
  }
}
