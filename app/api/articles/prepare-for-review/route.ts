import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
  prepareArticleForReview,
  type PrepareForReviewStore,
} from "../../../../lib/research/prepare-article-for-review"

const ERROR_STATUS: Record<string, number> = {
  not_found: 404,
  missing_evidence: 422,
  audit_failure: 500,
  duplicate_audit: 409,
  invalid_status: 409,
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Authentication required." },
        { status: 401 }
      )
    }

    const { articleId } = await req.json()

    if (!articleId || typeof articleId !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing articleId" },
        { status: 400 }
      )
    }

    const result = await prepareArticleForReview(articleId, {
      prisma: prisma as unknown as PrepareForReviewStore,
      reviewer: user.email || user.id,
    })

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
          code: result.code,
          articleUnchanged: true,
        },
        { status: ERROR_STATUS[result.code] ?? 400 }
      )
    }

    return NextResponse.json({
      ok: true,
      article: result.article,
      audit: result.audit,
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
