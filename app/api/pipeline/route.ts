import { NextRequest, NextResponse } from "next/server"
import { requireEditorAuth } from "../../../lib/publishing/require-editor-auth"
import {
  trustedInternalUrl,
  trustedOriginUnavailableResponse,
} from "../../../lib/publishing/trusted-internal-origin"

function editorSessionHeaders(request: NextRequest) {
  const headers = new Headers()
  const raw = request.headers.get("cookie")
  if (!raw) return headers

  const session = raw
    .split(";")
    .map((part) => part.trim())
    .filter((part) => {
      const name = part.split("=")[0] ?? ""
      return name.startsWith("sb-") && name.includes("auth-token")
    })

  if (session.length > 0) headers.set("cookie", session.join("; "))
  return headers
}

export async function POST(req: NextRequest) {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  const plannerUrl = trustedInternalUrl("/api/workers/weekly-planner")
  const generateUrl = trustedInternalUrl("/api/articles/generate")
  const packageUrl = trustedInternalUrl("/api/articles/generate-package")
  const scheduleUrl = trustedInternalUrl("/api/pipeline/auto-schedule")
  if (!plannerUrl || !generateUrl || !packageUrl || !scheduleUrl) {
    return trustedOriginUnavailableResponse()
  }

  try {
    const sessionHeaders = editorSessionHeaders(req)

    // Step 1
    const planner = await fetch(plannerUrl, {
      headers: sessionHeaders,
    })

    const plannerJson = await planner.json()

    if (!plannerJson.ok) {
      throw new Error("Weekly planner failed")
    }

    const draft = plannerJson.draft

    // Step 2
    const generateHeaders = new Headers(sessionHeaders)
    generateHeaders.set("Content-Type", "application/json")

    const articleResponse = await fetch(
      generateUrl,
      {
        method: "POST",
        headers: generateHeaders,
        body: JSON.stringify({
          articleId: draft.id,
        }),
      }
    )

    const articleJson =
      await articleResponse.json()

    if (!articleJson.ok) {
      throw new Error("Article generation failed")
    }

    // Step 3
    const packageResponse = await fetch(
      packageUrl,
      {
        method: "POST",
        headers: generateHeaders,
        body: JSON.stringify({
          articleId: draft.id,
        }),
      }
    )

    const packageJson =
      await packageResponse.json()

    if (!packageJson.ok) {
      throw new Error("Package generation failed")
    }

    const scheduleResponse =
      await fetch(
        scheduleUrl,
        {
          method: "POST",
          headers: generateHeaders,
          body: JSON.stringify({
            articleId: draft.id,
          }),
        }
      )

    const scheduleJson =
      await scheduleResponse.json()

    if (!scheduleJson.ok) {
      throw new Error(
        "Auto scheduling failed"
      )
    }

    return NextResponse.json({
      ok: true,
      articleId: draft.id,
      title: draft.title,
      category: draft.category,
      scheduledFor:
        scheduleJson.scheduledFor,
      message:
        "Pipeline completed and scheduled successfully",
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Pipeline failed",
      },
      { status: 500 }
    )
  }
}