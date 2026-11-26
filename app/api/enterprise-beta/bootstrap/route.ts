import { NextResponse } from "next/server"

import { buildEnterpriseBetaRolloutReadiness } from "../../../../lib/enterprise-beta/rollout-readiness"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  return NextResponse.json(buildEnterpriseBetaRolloutReadiness())
}
