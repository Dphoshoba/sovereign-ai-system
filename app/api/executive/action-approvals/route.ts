import { NextResponse } from "next/server"
import { buildActionApprovalQueue } from "@/lib/executive/action-approval"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  try {
    const approvals = await buildActionApprovalQueue()

    return NextResponse.json({
      ok: true,
      approvals,
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