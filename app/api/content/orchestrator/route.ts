import { NextResponse } from "next/server"

import {
  exampleApprovedResearchMission,
  orchestrateContentCampaign,
} from "../../../../lib/content/content-orchestrator"

export async function GET() {
  const result = orchestrateContentCampaign(exampleApprovedResearchMission)

  return NextResponse.json({
    ok: true,
    ...result,
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (body.publish === true || body.socialPosting === true || body.approve === true) {
      return NextResponse.json(
        {
          ok: false,
          dryRun: true,
          publishing: false,
          socialPosting: false,
          automaticApprovals: false,
          graphWrites: false,
          error:
            "Phase 6 content orchestration is planning-only. Publishing, social posting, and approvals are blocked.",
        },
        { status: 400 }
      )
    }

    const result = orchestrateContentCampaign(
      body.mission ?? exampleApprovedResearchMission
    )

    return NextResponse.json({
      ok: true,
      ...result,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        dryRun: true,
        publishing: false,
        socialPosting: false,
        automaticApprovals: false,
        graphWrites: false,
        error:
          error instanceof Error
            ? error.message
            : "Content orchestration failed.",
      },
      { status: 500 }
    )
  }
}
