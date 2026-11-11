import { NextResponse } from "next/server"
import { runCreatorSystem } from "../../../../lib/agents/orchestrator"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  try {
    const result = await runCreatorSystem()

    return NextResponse.json({
      ok: true,
      result,
    })
  } catch (error) {
    console.error("Agent system failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error: "Agent system failed",
      },
      {
        status: 500,
      }
    )
  }
}