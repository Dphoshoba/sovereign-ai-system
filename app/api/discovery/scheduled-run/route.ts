import { NextResponse } from "next/server"
import {
  authorizeEditorOrCron,
  privilegedSameOriginHeaders,
} from "../../../../lib/publishing/require-editor-auth"
import {
  trustedInternalUrl,
  trustedOriginUnavailableResponse,
} from "../../../../lib/publishing/trusted-internal-origin"

export async function POST(request: Request) {
  const auth = await authorizeEditorOrCron(request)
  if (!auth.ok) return auth.response

  const target = trustedInternalUrl("/api/discovery/run-autonomous")
  if (!target) return trustedOriginUnavailableResponse()

  try {
    const response = await fetch(target, {
      method: "POST",
      headers: privilegedSameOriginHeaders(request),
      body: JSON.stringify({
        saveLimit: 10,
        generateLimit: 3,
      }),
    })

    const result = await response.json()

    return NextResponse.json({
      ok: true,
      scheduled: true,
      result,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Scheduled discovery failed",
      },
      { status: 500 }
    )
  }
}
