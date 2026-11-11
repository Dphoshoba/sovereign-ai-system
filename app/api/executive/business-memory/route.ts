import { NextResponse } from "next/server"
import { buildBusinessMemory } from "@/lib/executive/business-memory"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  try {
    const memory = await buildBusinessMemory()

    return NextResponse.json({
      ok: true,
      memory,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to build business memory",
      },
      { status: 500 }
    )
  }
}
