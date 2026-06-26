import { NextResponse } from "next/server"

import { buildReleaseValidation } from "../../../../lib/release/release-validator"

export async function GET() {
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
