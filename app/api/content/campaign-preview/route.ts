import { NextResponse } from "next/server"

import {
  buildGovernedDraftPreview,
  summarizeGovernedDraftPreview,
} from "../../../../lib/content/draft-preview-engine"

export async function GET() {
  const preview = buildGovernedDraftPreview()

  return NextResponse.json({
    ok: true,
    previewOnly: true,
    writesToPrisma: false,
    generationExecuted: false,
    generatedContent: false,
    publishingExecuted: false,
    socialPostingExecuted: false,
    automaticApprovals: false,
    openAiCalls: false,
    summary: summarizeGovernedDraftPreview(preview),
    campaignPreview: preview.campaignPreview,
    dashboard: preview.dashboard,
  })
}
