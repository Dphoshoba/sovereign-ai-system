import { NextResponse } from "next/server"

import {
  OPERATOR_INTENT_SOURCE,
  createOperatorIntent,
  previewOperatorIntent,
  type OperatorIntentRequest,
} from "../../../../lib/ev-kos/operator-intent"

export async function GET() {
  const preview = previewOperatorIntent({
    explicitCreateIntent: true,
    actorId: "operator-preview",
    actionId: "prepare-draft-preview",
    reason: "Preview an operator intent audit package without persistence.",
    source: OPERATOR_INTENT_SOURCE,
    inputs: {
      campaignId: "preview-campaign",
      missionId: "preview-mission",
    },
  })

  return NextResponse.json({
    ok: true,
    previewOnly: true,
    writesToPrisma: false,
    actionExecuted: false,
    graphWrites: false,
    graphDeletes: false,
    openAiCalls: false,
    publishing: false,
    socialPosting: false,
    automaticApproval: false,
    selectedModel: "ExecutionAuthorizationRequest",
    rationale:
      "ExecutionAuthorizationRequest safely represents pending operator intent without executing actions.",
    preview,
  })
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as OperatorIntentRequest
    const result = await createOperatorIntent(body)

    return NextResponse.json(
      {
        ok: result.ok,
        previewOnly: result.previewOnly,
        writesToPrisma: result.writesToPrisma,
        model: result.model,
        intentId: result.intentId,
        createdAuthorizationId: result.createdAuthorizationId,
        validation: result.validation,
        errors: result.errors,
        summary: result.summary,
        actionExecuted: false,
        graphWrites: false,
        graphDeletes: false,
        openAiCalls: false,
        publishing: false,
        socialPosting: false,
        automaticApproval: false,
      },
      { status: result.ok ? 201 : 400 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        previewOnly: true,
        writesToPrisma: false,
        error:
          error instanceof Error
            ? error.message
            : "Operator intent request failed.",
        actionExecuted: false,
        graphWrites: false,
        graphDeletes: false,
        openAiCalls: false,
        publishing: false,
        socialPosting: false,
        automaticApproval: false,
      },
      { status: 500 }
    )
  }
}
