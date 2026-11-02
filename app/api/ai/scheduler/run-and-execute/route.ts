import { NextRequest, NextResponse } from "next/server"
import {
  editorSessionHeaders,
  requireEditorAuth,
} from "../../../../../lib/publishing/require-editor-auth"
import {
  trustedInternalUrl,
  trustedOriginUnavailableResponse,
} from "../../../../../lib/publishing/trusted-internal-origin"

export async function POST(request: NextRequest) {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  const schedulerUrl = trustedInternalUrl("/api/ai/scheduler/run")
  const jobsUrl = trustedInternalUrl("/api/ai/jobs/run")
  if (!schedulerUrl || !jobsUrl) return trustedOriginUnavailableResponse()

  try {
    const headers = editorSessionHeaders(request)
    headers.set("content-type", "application/json")
    const schedulerResponse = await fetch(schedulerUrl, {
      method: "POST",
      headers,
    })

    const schedulerResult = await schedulerResponse.json()

    const jobResponse = await fetch(jobsUrl, {
      method: "POST",
      headers,
    })

    const jobResult = await jobResponse.json()

    return NextResponse.json({
      ok: true,
      schedulerResult,
      jobResult,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Scheduler run-and-execute failed",
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
