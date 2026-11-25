import { NextResponse } from "next/server"

import { buildEVKOSOperatorDashboard } from "../../../../lib/ev-kos/operator-dashboard"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  return NextResponse.json(buildEVKOSOperatorDashboard())
}
