import { NextResponse } from "next/server"

import { buildEnterpriseAuditReadiness } from "../../../../lib/enterprise/enterprise-audit-readiness"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  return NextResponse.json(buildEnterpriseAuditReadiness())
}

