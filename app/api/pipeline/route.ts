import { NextRequest, NextResponse } from "next/server"
import { requireEditorAuth } from "../../../lib/publishing/require-editor-auth"
import {
  trustedInternalUrl,
  trustedOriginUnavailableResponse,
} from "../../../lib/publishing/trusted-internal-origin"
import { LEGACY_AUTO_SCHEDULE_DISABLED_BODY } from "../../../lib/publishing/legacy-auto-schedule"

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

/**
 * Legacy packaging pipeline. EV-EDITORIAL-07-P0 hard-gates automatic scheduling:
 * plan/generate/package may still run for editor sessions, but auto-schedule is never called.
 * Prefer POST /api/articles/editorial-stage-runner for draft→research→review-required.
 */
export async function POST(req: NextRequest) {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  const plannerUrl = trustedInternalUrl("/api/workers/weekly-planner")
  const generateUrl = trustedInternalUrl("/api/articles/generate")
  const packageUrl = trustedInternalUrl("/api/articles/generate-package")
  if (!plannerUrl || !generateUrl || !packageUrl) {
    return trustedOriginUnavailableResponse()
  }

  try {
    const sessionHeaders = editorSessionHeaders(req)

    const planner = await fetch(plannerUrl, {
      headers: sessionHeaders,
    })

    const plannerJson = await planner.json()

    if (!plannerJson.ok) {
      throw new Error("Weekly planner failed")
    }

    const draft = plannerJson.draft

    const generateHeaders = new Headers(sessionHeaders)
    generateHeaders.set("Content-Type", "application/json")

    const articleResponse = await fetch(generateUrl, {
      method: "POST",
      headers: generateHeaders,
      body: JSON.stringify({
        articleId: draft.id,
      }),
    })

    const articleJson = await articleResponse.json()

    if (!articleJson.ok) {
      throw new Error("Article generation failed")
    }

    const packageResponse = await fetch(packageUrl, {
      method: "POST",
      headers: generateHeaders,
      body: JSON.stringify({
        articleId: draft.id,
      }),
    })

    const packageJson = await packageResponse.json()

    if (!packageJson.ok) {
      throw new Error("Package generation failed")
    }

    // EV-EDITORIAL-07-P0: do not call /api/pipeline/auto-schedule.
    return NextResponse.json({
      ok: true,
      articleId: draft.id,
      title: draft.title,
      category: draft.category,
      scheduledFor: null,
      legacyAutoScheduleSkipped: true,
      legacyAutoSchedule: LEGACY_AUTO_SCHEDULE_DISABLED_BODY,
      message:
        "Pipeline packaging completed without scheduling. Director approval and governed schedule are required.",
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Pipeline failed",
      },
      { status: 500 },
    )
  }
}
