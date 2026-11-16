/**
 * Authenticated refresh of evidenceState on a current 1.1.0 audit.
 * Called from the authorised editor session (browser fetch) after exclusive-
 * primary classification fixes. No prior route refreshes evidenceState without
 * Prepare. Reads/writes ArticleResearchAudit.facts evidenceState only.
 * User instruction: repair implementation defects within governance; do not
 * manipulate scores; complete assessment then publish if eligible.
 */
import { NextRequest, NextResponse } from "next/server"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"
import { reclassifyAuditEvidenceStates } from "../../../../lib/research/reclassify-audit-evidence-states"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const auth = await requireEditorAuth()
    if (!auth.ok) return auth.response

    const body = await req.json()
    const articleId = body?.articleId
    const auditId = body?.auditId
    if (typeof articleId !== "string" || typeof auditId !== "string") {
      return NextResponse.json(
        { ok: false, error: "articleId and auditId are required." },
        { status: 400 },
      )
    }

    const result = await reclassifyAuditEvidenceStates({
      articleId,
      auditId,
      actor: auth.actor,
    })
    if (!result.ok) {
      return NextResponse.json(result, {
        status: result.code === "not_found" ? 404 : 409,
      })
    }
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Reclassify failed",
      },
      { status: 500 },
    )
  }
}
