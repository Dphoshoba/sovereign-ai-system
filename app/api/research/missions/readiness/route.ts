import { NextResponse } from "next/server"

import { requireEditorAuth } from "../../../../../lib/publishing/require-editor-auth"
import {
  evaluateMissionReadiness,
  runAutonomousResearchMissionEngine,
  summarizeMissionEngineResult,
} from "../../../../../lib/research/mission-engine"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  const result = runAutonomousResearchMissionEngine({
    recentCategories: ["ai-tools"],
    duplicateTopics: ["AI automation for creator workflows"],
  })
  const firstMission = result.missionPlans[0]
  const readiness = firstMission ? evaluateMissionReadiness(firstMission) : null

  return NextResponse.json({
    ok: true,
    dryRun: true,
    writesToPrisma: false,
    graphWrites: false,
    graphDeletes: false,
    automaticApprovals: false,
    automaticPublishing: false,
    readiness,
    allReadiness: result.dashboard.readiness,
    summary: summarizeMissionEngineResult(result),
  })
}
