import { NextRequest, NextResponse } from "next/server"
import { requireEditorAuth } from "../../../lib/publishing/require-editor-auth"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  return NextResponse.json({
    ok: true,
    message:
      "Infrastructure resilience system temporarily disabled during production stabilization.",
    checks: [],
    incidents: [],
    policies: [],
    retryJobs: [],
    runs: [],
  })
}

export async function POST(_request: NextRequest) {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  return NextResponse.json({
    ok: true,
    message:
      "Infrastructure resilience execution temporarily disabled during production stabilization.",
    healthChecks: [],
  })
}