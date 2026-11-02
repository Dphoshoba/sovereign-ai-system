import { NextRequest, NextResponse } from "next/server"
import {
  authorizeCronRequest,
  cronUnauthorizedResponse,
} from "../../../../lib/publishing/cron-auth"
import {
  trustedInternalUrl,
  trustedOriginUnavailableResponse,
} from "../../../../lib/publishing/trusted-internal-origin"

type StageResult = {
  stage: string
  ok: boolean
  message?: string
  data?: unknown
}

export async function GET(request: NextRequest) {
  const auth = authorizeCronRequest(request)
  if (!auth.ok) {
    return cronUnauthorizedResponse()
  }

  const discoveryUrl = trustedInternalUrl("/api/discovery/scheduled-run")
  const publishUrl = trustedInternalUrl("/api/cron/publish-scheduled")
  if (!discoveryUrl || !publishUrl) return trustedOriginUnavailableResponse()

  const startedAt = new Date()
  const authorization = request.headers.get("authorization") || ""
  const results: StageResult[] = []

  try {
    const discoveryRes = await fetch(discoveryUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
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
    const publishRes = await fetch(publishUrl, {
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
