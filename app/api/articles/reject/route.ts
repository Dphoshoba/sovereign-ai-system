import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"
import { transitionArticleLifecycle } from "../../../../lib/publishing/article-lifecycle"

export async function POST(req: NextRequest) {
  try {
    const auth = await requireEditorAuth()
    if (!auth.ok) return auth.response

    const { articleId, rejectionReason } = await req.json()

    if (!articleId) {
      return NextResponse.json({ ok: false, error: "Missing articleId" }, { status: 400 })
    }

    const reviewer = auth.actor
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