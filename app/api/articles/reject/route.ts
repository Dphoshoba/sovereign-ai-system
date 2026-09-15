import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { transitionArticleLifecycle } from "../../../../lib/publishing/article-lifecycle"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          code: "AUTHENTICATION_REQUIRED",
          error: "Authentication required.",
          articleUnchanged: true,
        },
        { status: 401 },
      )
    }

    const { articleId, rejectionReason } = await req.json()

    if (!articleId) {
      return NextResponse.json({ ok: false, error: "Missing articleId" }, { status: 400 })
    }

    const reviewer = user.email || user.id
    const note = rejectionReason || "Rejected during editorial review"

    const result = await transitionArticleLifecycle(
      {
        articleId,
        transition: "reject",
        actor: reviewer,
        reviewNote: note,
      },
      { prisma },
    )
    if (!result.ok) {
      return NextResponse.json(result, {
        status: result.code === "not_found" ? 404 : 409,
      })
    }

    return NextResponse.json({
      ok: true,
      article: result.article,
      alreadyApplied: result.alreadyApplied,
      articleUnchanged: result.articleUnchanged,
      rejection: {
        rejectedBy: reviewer,
        rejectionReason: note,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Rejection failed",
      },
      { status: 500 }
    )
  }
}