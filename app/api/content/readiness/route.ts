import { NextResponse } from "next/server"

import { orchestrateContentCampaign } from "../../../../lib/content/content-orchestrator"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  const result = orchestrateContentCampaign()

  return NextResponse.json({
    ok: true,
    dryRun: true,
    writesToPrisma: false,
    graphWrites: false,
    graphDeletes: false,
    publishing: false,
    socialPosting: false,
    automaticApprovals: false,
    readiness: result.readiness,
    readinessScore: result.readiness.overallReadiness,
    dashboard: result.dashboard,
  })
}
