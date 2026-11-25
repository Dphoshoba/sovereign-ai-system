import { NextResponse } from "next/server"
import { getExecutivePlatformSnapshot } from "@/lib/executive/platform-snapshot"
import { buildExecutiveRecommendations } from "@/lib/executive/recommendations"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  try {
    const snapshot = await getExecutivePlatformSnapshot()
    const recommendations = buildExecutiveRecommendations(snapshot)

    return NextResponse.json({
      ok: true,
      recommendations,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Executive recommendations failed",
      },
      { status: 500 }
    )
  }
}
