import { NextResponse } from "next/server"
import { buildExecutiveAgents } from "@/lib/executive/agents"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  const agents = await buildExecutiveAgents()

  return NextResponse.json({
    ok: true,
    agents,
  })
}