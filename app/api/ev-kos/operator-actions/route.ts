import { NextResponse } from "next/server"

import { buildOperatorActionDashboard } from "../../../../lib/ev-kos/operator-action-preview"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  return NextResponse.json(buildOperatorActionDashboard())
}
