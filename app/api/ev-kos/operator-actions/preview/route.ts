import { NextResponse } from "next/server"

import { buildOperatorActionPreview } from "../../../../../lib/ev-kos/operator-action-preview"
import { requireEditorAuth } from "../../../../../lib/publishing/require-editor-auth"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  return NextResponse.json(
    buildOperatorActionPreview({
      actionId: "prepare-draft-preview",
      operatorId: "operator-preview",
      permissions: ["operator:draft-preview:preview"],
      inputs: {
        campaignId: "preview-campaign",
        missionId: "preview-mission",
      },
    })
  )
}

export async function POST(request: Request) {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  const body = await request.json()

  return NextResponse.json(
    buildOperatorActionPreview({
      actionId: String(body.actionId ?? ""),
      operatorId: body.operatorId,
      permissions: Array.isArray(body.permissions) ? body.permissions : [],
      inputs:
        body.inputs && typeof body.inputs === "object" ? body.inputs : {},
    })
  )
}
