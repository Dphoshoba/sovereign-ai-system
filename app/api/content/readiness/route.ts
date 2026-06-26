import { NextResponse } from "next/server"

import { orchestrateContentCampaign } from "../../../../lib/content/content-orchestrator"

export async function GET() {
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
