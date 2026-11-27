import { NextResponse } from "next/server"

import { buildOperatorReadinessAudit } from "../../../../lib/ev-kos/operator-readiness-audit"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  return NextResponse.json(buildOperatorReadinessAudit())
}
