import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { publicationGuard } from "../../../../lib/publishing/publication-guard"
import { autoGenerateSocialPosts } from "../../../../lib/social/auto-generate-social"

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

    const existingPostIds = (
      await prisma.socialPost.findMany({
        where: { articleId },
        select: { id: true },
      })
    ).map((p) => p.id)

    const publishedArticle = await prisma.article.update({
      where: { id: articleId },
      data: {
        status: "published",
        approvedAt: article.approvedAt || new Date(),
        approvedBy: approvedBy || article.approvedBy || "system",
        publishedAt: new Date(),
        scheduledFor: null,
      },
    })

    let socialResult = null
    try {
      socialResult = await autoGenerateSocialPosts(articleId)
    } catch {
      socialResult = { ok: false, reason: "Social draft generation failed", posts: [] }
    }

    await prisma.newsletter.updateMany({
      where: {
        articleId,
        status: "review-required",
      },
      data: {
        status: "approved",
        approvedAt: new Date(),
        approvedBy: approvedBy || article.approvedBy || "system",
      },
    })

    if (existingPostIds.length > 0) {
      await prisma.socialPost.updateMany({
        where: {
          id: { in: existingPostIds },
          status: "review-required",
        },
        data: {
          status: "approved",
        },
      })
    }

    return NextResponse.json({
      ok: true,
      article: publishedArticle,
      message:
        "Article published, newsletter approved, and social posts processed.",
      socialDrafts: socialResult
        ? {
            generated: socialResult.ok,
            reason: socialResult.reason,
            count: socialResult.posts.length,
          }
        : undefined,
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