import { NextResponse } from "next/server"
import { requireEditorAuth } from "../../../lib/publishing/require-editor-auth"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  return NextResponse.json({
    ok: true,
    message: "World Model V2 route is active",
  })
}