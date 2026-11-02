import { NextRequest, NextResponse } from "next/server"
import { requireEditorAuth } from "../../../lib/publishing/require-editor-auth"

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

function internalApiUrl(request: NextRequest, path: string) {
  return new URL(path, request.nextUrl.origin)
}

export async function POST(req: NextRequest) {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  try {
    const sessionHeaders = editorSessionHeaders(req)

    // Step 1
    const planner = await fetch(internalApiUrl(req, "/api/workers/weekly-planner"), {
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
      internalApiUrl(req, "/api/articles/generate"),
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
      internalApiUrl(req, "/api/articles/generate-package"),
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
        internalApiUrl(req, "/api/pipeline/auto-schedule"),
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