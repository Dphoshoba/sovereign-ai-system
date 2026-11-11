import { NextResponse } from "next/server"
import { getBusinessSnapshot } from "@/lib/business/business-data-layer"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  try {
    const snapshot = await getBusinessSnapshot()

    return NextResponse.json({
      ok: true,
      snapshot,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to build business snapshot",
      },
      { status: 500 }
    )
  }
}
