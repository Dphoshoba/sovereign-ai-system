import { NextResponse } from "next/server"

import { orchestrateContentCampaign } from "../../../../lib/content/content-orchestrator"
import {
  buildDraftGenerationContracts,
  summarizeDraftContracts,
} from "../../../../lib/content/draft-generation-contracts"
import { evaluateDraftReadiness } from "../../../../lib/content/draft-readiness"

export async function GET() {
  const orchestration = orchestrateContentCampaign()
  const contractSet = buildDraftGenerationContracts({
    campaign: orchestration.campaign,
    masterBrief: orchestration.masterBrief,
  })
  const readiness = evaluateDraftReadiness(contractSet)

  return NextResponse.json({
    ok: true,
    previewOnly: true,
    writesToPrisma: false,
    generationExecuted: false,
    publishingExecuted: false,
    socialPostingExecuted: false,
    automaticApprovals: false,
    openAiCalls: false,
    contractSet,
    readiness,
    summary: summarizeDraftContracts(contractSet),
    exampleContract: contractSet.contracts[0],
  })
}
