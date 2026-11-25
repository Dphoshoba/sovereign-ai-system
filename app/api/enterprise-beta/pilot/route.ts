import { NextResponse } from "next/server"

import { buildEnterpriseBetaPilotReadiness } from "../../../../lib/enterprise-beta/pilot-readiness"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  return NextResponse.json(buildEnterpriseBetaPilotReadiness())
}
