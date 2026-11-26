import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"
import {
  prepareArticleForReview,
  type PrepareForReviewStore,
} from "../../../../lib/research/prepare-article-for-review"

export const runtime = "nodejs"
export const maxDuration = 60

const ERROR_STATUS: Record<string, number> = {
  not_found: 404,
  missing_evidence: 422,
  insufficient_article_evidence: 422,
  audit_failure: 500,
  duplicate_audit: 409,
  invalid_status: 409,
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireEditorAuth()
    if (!auth.ok) return auth.response

    const { articleId } = await req.json()

    if (!articleId || typeof articleId !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing articleId" },
        { status: 400 }
      )
    }

    const result = await prepareArticleForReview(articleId, {
      prisma: prisma as unknown as PrepareForReviewStore,
      reviewer: auth.actor,
    })

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
          code: result.code,
          articleUnchanged: true,
          sourceDiagnostics: result.sourceDiagnostics ?? [],
        },
        { status: ERROR_STATUS[result.code] ?? 400 }
      )
    }

    return NextResponse.json({
      ok: true,
      article: result.article,
      audit: result.audit,
      sourceDiagnostics: result.sourceDiagnostics ?? [],
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Prepare for review failed",
      },
      { status: 500 }
    )
  }
}
