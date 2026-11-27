import { NextResponse } from "next/server"

import { listErrorCatalog } from "../../../../lib/observability/error-catalog"
import { buildReleaseConfidence } from "../../../../lib/observability/release-confidence"
import { buildRouteGuardAudit } from "../../../../lib/observability/route-guard-audit"
import { listLoggingContracts } from "../../../../lib/observability/logging-contract"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  const confidence = buildReleaseConfidence()

  return NextResponse.json({
    ok: true,
    readOnly: true,
    writesToPrisma: false,
    execution: false,
    openAiCalls: false,
    graphWrites: false,
    graphDeletes: false,
    publishing: false,
    socialPosting: false,
    automaticApprovals: false,
    confidence,
    routeGuardAudit: buildRouteGuardAudit(),
    loggingContracts: listLoggingContracts(),
    errorCatalog: listErrorCatalog(),
  })
}
