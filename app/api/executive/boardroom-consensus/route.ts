import { NextResponse } from "next/server"
import { buildBoardroomConsensus } from "@/lib/executive/boardroom-consensus"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  const consensus =
    await buildBoardroomConsensus()

  return NextResponse.json({
    ok: true,
    consensus,
  })
}