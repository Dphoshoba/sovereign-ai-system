import { NextResponse } from "next/server"

import { buildSystemHealth } from "../../../../lib/observability/system-health"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  return NextResponse.json(buildSystemHealth())
}
