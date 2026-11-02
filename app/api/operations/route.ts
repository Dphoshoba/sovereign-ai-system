import { NextRequest, NextResponse } from "next/server"
import { GET as runWeeklyPlanner } from "../workers/weekly-planner/route"
import { publishDueArticles } from "../../../lib/publishing/publish-due-articles"
import { POST as createSnapshot } from "../reports/snapshot/route"
import { GET as runIntelligence } from "../reports/executive-intelligence/route"
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

export async function POST(req: NextRequest) {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  try {
    const { action } = await req.json()

    switch (action) {
      case "weekly-planner": {
        const response = await runWeeklyPlanner()
        const result = await response.json()
        return NextResponse.json({
          ok: true,
          message: "Weekly planner completed.",
          ...result,
        })
      }

      case "publish-scheduled": {
        const result = await publishDueArticles({
          source: "operations",
        })
        return NextResponse.json({
          ok: true,
          message: "Publish scheduled worker completed.",
          invocationId: result.invocationId,
          published: result.published,
          skipped: result.skipped,
          failed: result.failed,
        })
      }

      case "snapshot": {
        const response = await createSnapshot()
        const result = await response.json()
        return NextResponse.json({
          ok: true,
          message: "Monthly snapshot created.",
          ...result,
        })
      }

      case "intelligence": {
        const response = await runIntelligence()
        const result = await response.json()
        return NextResponse.json({
          ok: true,
          message: "Executive intelligence updated.",
          ...result,
        })
      }

      case "pipeline": {
        await fetch(new URL("/api/pipeline", req.nextUrl.origin), {
          method: "POST",
          headers: editorSessionHeaders(req),
        })
        return NextResponse.json({
          ok: true,
          message: "Pipeline completed.",
        })
      }

      default:
        return NextResponse.json(
          { ok: false, error: "Unknown action" },
          { status: 400 }
        )
    }
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Operation failed",
      },
      { status: 500 }
    )
  }
}
