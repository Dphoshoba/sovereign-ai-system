import { NextRequest, NextResponse } from "next/server"
import {
  authorizeCronRequest,
  cronUnauthorizedResponse,
  resolveInvocationSource,
} from "../../../../lib/publishing/cron-auth"
import { publishDueArticles } from "../../../../lib/publishing/publish-due-articles"

async function handle(request: NextRequest) {
  const auth = authorizeCronRequest(request)
  if (!auth.ok) {
    return cronUnauthorizedResponse()
  }

  try {
    const result = await publishDueArticles({
      source: resolveInvocationSource(request),
    })

    return NextResponse.json({
      ok: true,
      invocationId: result.invocationId,
      source: result.source,
      startedAt: result.startedAt,
      finishedAt: result.finishedAt,
      eligible: result.eligible,
      published: result.published,
      skipped: result.skipped,
      failed: result.failed,
      publishedIds: result.publishedIds,
      skippedItems: result.skippedItems,
      failedItems: result.failedItems,
    })
  } catch (error) {
    console.error("Scheduled publish failed", {
      error: error instanceof Error ? error.message : "unknown",
    })

    return NextResponse.json(
      {
        ok: false,
        error: "Scheduled publish failed",
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return handle(request)
}

export async function POST(request: NextRequest) {
  return handle(request)
}
