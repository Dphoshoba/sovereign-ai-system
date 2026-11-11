import { NextResponse } from "next/server"
import { buildActionExecutionQueue } from "@/lib/executive/action-execution"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  try {
    const execution = await buildActionExecutionQueue()

    return NextResponse.json({
      ok: true,
      execution,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    )
  }
}