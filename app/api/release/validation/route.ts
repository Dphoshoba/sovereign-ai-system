import { NextResponse } from "next/server"

import { buildReleaseValidation } from "../../../../lib/release/release-validator"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  const validation = buildReleaseValidation()

  return NextResponse.json({
    ...validation,
    safetyFlags: {
      execution: false,
      openAiCalls: false,
      publishing: false,
      graphWrites: false,
      graphDeletes: false,
      socialPosting: false,
      automaticApprovals: false,
      authProviderIntegration: false,
      sessions: false,
      jwt: false,
    },
  })
}
