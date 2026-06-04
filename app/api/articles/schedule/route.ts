import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { publicationGuard } from "../../../../lib/publishing/publication-guard"

export async function POST(req: NextRequest) {
  try {
    const { articleId, scheduledFor } = await req.json()

    if (!articleId) {
      return NextResponse.json(
        { ok: false, error: "Missing articleId" },
        { status: 400 }
      )
    }

    if (!scheduledFor) {
      return NextResponse.json(
        {
          ok: false,
          error: "Please choose a schedule date and time.",
        },
        { status: 400 }
      )
    }

    const article = await prisma.article.findUnique({
      where: { id: articleId },
    })

    if (!article) {
      return NextResponse.json(
        { ok: false, error: "Article not found" },
        { status: 404 }
      )
    }

    const guard = publicationGuard(article.status)

    if (!guard.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: guard.reason,
          guard,
        },
        { status: 403 }
      )
    }

    const date = new Date(scheduledFor)

    if (isNaN(date.getTime())) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid schedule date.",
        },
        { status: 400 }
      )
    }

    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
      data: {
        status: "scheduled",
        scheduledFor: date,
        publishedAt: null,
      },
    })

    return NextResponse.json({
      ok: true,
      article: updatedArticle,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Scheduling failed",
      },
      { status: 500 }
    )
  }
}
