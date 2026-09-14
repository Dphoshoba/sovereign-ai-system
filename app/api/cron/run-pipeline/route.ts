import { NextRequest, NextResponse } from "next/server"
import {
  authorizeCronRequest,
  cronUnauthorizedResponse,
} from "../../../../lib/publishing/cron-auth"

type StageResult = {
  stage: string
  ok: boolean
  message?: string
  data?: unknown
}

function cronAuthorizationHeader(request: NextRequest) {
  return request.headers.get("authorization") || `Bearer ${process.env.CRON_SECRET || ""}`
}

export async function GET(request: NextRequest) {
  const auth = authorizeCronRequest(request)
  if (!auth.ok) {
    return cronUnauthorizedResponse()
  }

  const startedAt = new Date()

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  const results: StageResult[] = []
  const authorization = cronAuthorizationHeader(request)

  try {
    const discoveryRes = await fetch(`${baseUrl}/api/discovery/scheduled-run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        saveLimit: 10,
        generateLimit: 1,
      }),
    })

    const discoveryData = await discoveryRes.json().catch(() => ({}))

    results.push({
      stage: "discovery",
      ok: discoveryRes.ok && discoveryData?.ok,
      message: discoveryData?.ok
        ? `Generated ${
            discoveryData?.result?.generatedCount ??
            discoveryData?.generatedCount ??
            0
          } article(s)`
        : discoveryData?.error || "Discovery failed",
      data: discoveryData,
    })
  } catch (error) {
    results.push({
      stage: "discovery",
      ok: false,
      message:
        error instanceof Error ? error.message : "Discovery stage failed",
    })
  }

  try {
    const publishRes = await fetch(`${baseUrl}/api/cron/publish-scheduled`, {
      headers: {
        Authorization: authorization,
        "x-invocation-source": "vercel-pipeline",
      },
    })

    const publishData = await publishRes.json().catch(() => ({}))

    results.push({
      stage: "publish",
      ok: publishRes.ok && publishData?.ok,
      message: publishData?.ok
        ? `Published ${publishData.published || 0} article(s)`
        : publishData?.error || "Publish failed",
      data: {
        invocationId: publishData.invocationId,
        eligible: publishData.eligible,
        published: publishData.published,
        skipped: publishData.skipped,
        failed: publishData.failed,
      },
    })
  } catch (error) {
    results.push({
      stage: "publish",
      ok: false,
      message:
        error instanceof Error ? error.message : "Publish stage failed",
    })
  }

  return NextResponse.json({
    ok: true,
    startedAt,
    finishedAt: new Date(),
    results,
  })
}
