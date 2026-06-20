import { NextResponse } from "next/server"

type StageResult = {
  stage: string
  ok: boolean
  message?: string
  data?: unknown
}

export async function GET() {
  const startedAt = new Date()

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  const results: StageResult[] = []

  //
  // 1. Discovery → Queue → Article Generation
  //
  try {
    const discoveryRes = await fetch(
        `${baseUrl}/api/discovery/scheduled-run`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            saveLimit: 10,
            generateLimit: 1,
          }),
        }
      )

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
        error instanceof Error
          ? error.message
          : "Discovery stage failed",
    })
  }

  //
  // 2. Publish any approved/scheduled content that is due
  //
  try {
    const publishRes = await fetch(
      `${baseUrl}/api/cron/publish-scheduled`
    )

    const publishData = await publishRes.json().catch(() => ({}))

    results.push({
      stage: "publish",
      ok: publishRes.ok && publishData?.ok,
      message: publishData?.ok
        ? `Published ${publishData.published || 0} article(s)`
        : publishData?.error || "Publish failed",
      data: publishData,
    })
  } catch (error) {
    results.push({
      stage: "publish",
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Publish stage failed",
    })
  }

  return NextResponse.json({
    ok: true,
    startedAt,
    finishedAt: new Date(),
    results,
  })
}