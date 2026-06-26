import { NextResponse } from "next/server"

import { buildOperatorActionPreview } from "../../../../../lib/ev-kos/operator-action-preview"

export async function GET() {
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
