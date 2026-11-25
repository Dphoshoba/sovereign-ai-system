import { NextResponse } from "next/server"

import {
  buildGovernedDraftPreview,
  summarizeGovernedDraftPreview,
} from "../../../../lib/content/draft-preview-engine"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

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
    packets: preview.packets,
    dashboard: preview.dashboard,
  })
}
