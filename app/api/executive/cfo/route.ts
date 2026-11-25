import { NextResponse } from "next/server"
import { buildCfoIntelligence } from "@/lib/executive/cfo-intelligence"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  try {
    const cfo = await buildCfoIntelligence()

    return NextResponse.json({
      ok: true,
      cfo,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to build CFO intelligence",
      },
      { status: 500 }
    )
  }
}
