import { NextResponse } from "next/server"

import { buildSecurityAudit } from "../../../../lib/production/security-audit"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  return NextResponse.json(buildSecurityAudit())
}
