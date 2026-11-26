import { NextResponse } from "next/server"

import { buildEnterpriseBetaSessionCheckpointReadiness } from "../../../../lib/enterprise-beta/auth-checkpoint"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  return NextResponse.json(buildEnterpriseBetaSessionCheckpointReadiness())
}
