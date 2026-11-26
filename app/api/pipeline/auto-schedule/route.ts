import { NextRequest, NextResponse } from "next/server"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"
import { LEGACY_AUTO_SCHEDULE_DISABLED_BODY } from "../../../../lib/publishing/legacy-auto-schedule"

/**
 * EV-EDITORIAL-07-P0: legacy +7-day auto-schedule path is disabled.
 * Authorised scheduling remains via POST /api/articles/schedule after approval.
 * Due publication remains via /api/cron/publish-scheduled.
 */
export async function POST(_req: NextRequest) {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  return NextResponse.json(LEGACY_AUTO_SCHEDULE_DISABLED_BODY, { status: 410 })
}
