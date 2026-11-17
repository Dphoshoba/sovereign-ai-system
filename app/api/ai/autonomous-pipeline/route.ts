import { NextResponse } from "next/server"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

/**
 * M2-P0 lockdown: this endpoint previously created articles from LLM packaging
 * with no research, no audit, and no authentication. The governed create path is
 * POST /api/ai/generate-article (AI Generator), which stops at review-required.
 */
export const AUTONOMOUS_PIPELINE_DISABLED_BODY = {
  ok: false as const,
  code: "AUTONOMOUS_PIPELINE_DISABLED" as const,
  error:
    "The research-free Autonomous Pipeline packaging endpoint is disabled. Use POST /api/ai/generate-article via the AI Generator; that path runs research and audit preparation and leaves articles in review-required for human approval.",
  articleUnchanged: true as const,
  useInstead: "/api/ai/generate-article" as const,
}

export async function POST() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  return NextResponse.json(AUTONOMOUS_PIPELINE_DISABLED_BODY, { status: 403 })
}
