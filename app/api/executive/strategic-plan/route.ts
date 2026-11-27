import { NextResponse } from "next/server"
import { loadExecutiveStrategicPlan } from "@/lib/executive/load-strategic-plan"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  try {
    const plan = await loadExecutiveStrategicPlan()

    return NextResponse.json({
      ok: true,
      plan,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate strategic plan",
      },
      { status: 500 }
    )
  }
}
