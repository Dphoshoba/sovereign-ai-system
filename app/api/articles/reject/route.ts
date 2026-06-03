import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { articleId, rejectedBy, rejectionReason } = await req.json()

    if (!articleId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing articleId",
        },
        { status: 400 }
      )
    }

    const article = await prisma.article.findUnique({
      where: {
        id: articleId,
      },
    })

    if (!article) {
      return NextResponse.json(
        {
          ok: false,
          error: "Article not found",
        },
        { status: 404 }
      )
    }

    const updatedArticle = await prisma.article.update({
      where: {
        id: articleId,
      },
      data: {
        status: "rejected",
        approvedAt: null,
        approvedBy: null,
      },
    })

    return NextResponse.json({
      ok: true,
      article: updatedArticle,
      rejection: {
        rejectedBy: rejectedBy || "system",
        rejectionReason:
          rejectionReason || "Rejected during editorial review",
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Rejection failed",
      },
      { status: 500 }
    )
  }
}
