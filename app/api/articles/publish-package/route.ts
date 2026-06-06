import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { articleId, approvedBy } = await req.json()

    if (!articleId) {
      return NextResponse.json(
        { ok: false, error: "Missing articleId" },
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

    const publishedArticle = await prisma.article.update({
      where: { id: articleId },
      data: {
        status: "published",
        approvedAt: article.approvedAt || new Date(),
        approvedBy: approvedBy || "system",
        publishedAt: new Date(),
      },
    })

    await prisma.newsletter.updateMany({
      where: {
        articleId,
        status: "review-required",
      },
      data: {
        status: "approved",
        approvedAt: new Date(),
        approvedBy: approvedBy || "system",
      },
    })

    await prisma.socialPost.updateMany({
      where: {
        articleId,
        status: "review-required",
      },
      data: {
        status: "approved",
      },
    })

    return NextResponse.json({
      ok: true,
      article: publishedArticle,
      message:
        "Article published, newsletter approved, and social posts approved.",
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Package publish failed",
      },
      { status: 500 }
    )
  }
}