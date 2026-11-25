import { NextResponse } from "next/server"
import { generateExecutiveAutomationActions } from "@/lib/executive/automation-engine"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  try {
    const automation = await generateExecutiveAutomationActions()

    return NextResponse.json({
      ok: true,
      automation,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate automation actions",
      },
      { status: 500 }
    )
  }
}
