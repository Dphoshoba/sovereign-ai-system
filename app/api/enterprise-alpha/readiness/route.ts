import { NextResponse } from "next/server"

import {
  buildEnterpriseAlphaReadiness,
  summarizeEnterpriseAlphaReadiness,
} from "../../../../lib/enterprise/enterprise-readiness"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  const readiness = buildEnterpriseAlphaReadiness()

  return NextResponse.json({
    ...readiness,
    summary: summarizeEnterpriseAlphaReadiness(readiness),
  })
}

