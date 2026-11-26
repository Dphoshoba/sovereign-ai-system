import { NextResponse } from "next/server"
import { buildExecutiveCommandCenter } from "@/lib/executive/command-center"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  try {
    const center = await buildExecutiveCommandCenter()

    return NextResponse.json({
      ok: true,
      center,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to build executive command center",
      },
      { status: 500 }
    )
  }
}
