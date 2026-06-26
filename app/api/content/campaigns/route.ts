import { NextResponse } from "next/server"

import { orchestrateContentCampaign } from "../../../../lib/content/content-orchestrator"

export async function GET() {
  const result = orchestrateContentCampaign()

  return NextResponse.json({
    ok: true,
    dryRun: true,
    readOnly: true,
    writesToPrisma: false,
    graphWrites: false,
    graphDeletes: false,
    publishing: false,
    socialPosting: false,
    automaticApprovals: false,
    campaign: result.campaign,
    dashboard: result.dashboard,
    summary: result.summary.campaign,
  })
}
