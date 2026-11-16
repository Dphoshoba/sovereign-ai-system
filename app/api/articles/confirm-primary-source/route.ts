/**
 * Authenticated editor confirmation for EV-REG-SPEC-1.1.0 primary-source claims.
 * Called from the editorial decision board (ArticleAuditPanel confirm actions).
 * Reads/writes via confirmPrimarySourceClaim (audit facts + recommendation only).
 * User instruction: authorised human editor confirms exact claim and evidence;
 * scores retained without alteration; lifecycle controls remain mandatory.
 */
import { NextRequest, NextResponse } from "next/server"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"
import { confirmPrimarySourceClaim } from "../../../../lib/research/confirm-primary-source-claims"

export const runtime = "nodejs"

const ERROR_STATUS: Record<string, number> = {
  not_found: 404,
  invalid_audit: 409,
  claim_not_found: 404,
  not_primary_source: 422,
  stale_audit: 409,
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireEditorAuth()
    if (!auth.ok) return auth.response

    const body = await req.json()
    const articleId = body?.articleId
    const auditId = body?.auditId
    const claim = body?.claim
    const decision = body?.decision
    const rationale =
      typeof body?.rationale === "string" ? body.rationale : ""

    if (
      typeof articleId !== "string" ||
      typeof auditId !== "string" ||
      typeof claim !== "string" ||
      (decision !== "confirmed" && decision !== "declined")
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "articleId, auditId, claim, and decision (confirmed|declined) are required.",
        },
        { status: 400 },
      )
    }

    const result = await confirmPrimarySourceClaim({
      articleId,
      auditId,
      claim,
      decision,
      rationale,
      actor: auth.actor,
    })

    if (!result.ok) {
      return NextResponse.json(result, {
        status: ERROR_STATUS[result.code] ?? 400,
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Primary-source confirmation failed",
      },
      { status: 500 },
    )
  }
}
