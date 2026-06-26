import { NextResponse } from "next/server"

import {
  runAutonomousResearchMissionEngine,
  summarizeMissionEngineResult,
  validateMissionLifecycleTransition,
} from "../../../../lib/research/mission-engine"
import type { ResearchMissionState } from "../../../../lib/research/mission-state-machine"

export async function GET() {
  const result = runAutonomousResearchMissionEngine({
    recentCategories: ["ai-tools"],
    duplicateTopics: ["AI automation for creator workflows"],
  })

  return NextResponse.json({
    ok: true,
    dryRun: true,
    writesToPrisma: false,
    graphWrites: false,
    graphDeletes: false,
    automaticApprovals: false,
    automaticPublishing: false,
    dashboard: result.dashboard,
    missions: result.missionPlans,
    integrationFlow: result.integrationFlow,
    summary: summarizeMissionEngineResult(result),
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (body.dryRun === false) {
      return NextResponse.json(
        {
          ok: false,
          dryRun: true,
          writesToPrisma: false,
          graphWrites: false,
          automaticApprovals: false,
          automaticPublishing: false,
          error: "Mission POST is dry-run only in Phase 5 foundation.",
        },
        { status: 400 }
      )
    }

    const transition =
      body.from && body.to
        ? validateMissionLifecycleTransition(
            body.from as ResearchMissionState,
            body.to as ResearchMissionState
          )
        : null
    const result = runAutonomousResearchMissionEngine({
      candidates: body.candidates,
      recentCategories: body.recentCategories,
      duplicateTopics: body.duplicateTopics,
    })

    return NextResponse.json({
      ok: true,
      dryRun: true,
      writesToPrisma: false,
      graphWrites: false,
      graphDeletes: false,
      automaticApprovals: false,
      automaticPublishing: false,
      transition,
      dashboard: result.dashboard,
      missions: result.missionPlans,
      summary: summarizeMissionEngineResult(result),
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        dryRun: true,
        writesToPrisma: false,
        graphWrites: false,
        error:
          error instanceof Error
            ? error.message
            : "Autonomous research mission dry-run failed.",
      },
      { status: 500 }
    )
  }
}
