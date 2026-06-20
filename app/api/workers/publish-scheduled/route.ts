import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { publicationGuard } from "../../../../lib/publishing/publication-guard"
import { autoGenerateSocialPosts } from "../../../../lib/social/auto-generate-social"
import { generateNewsletterForArticle } from "../../../../lib/newsletter/generate-newsletter"

export async function GET() {
  try {
    const now = new Date()

    const articles = await prisma.article.findMany({
      where: {
        status: { in: ["approved", "scheduled"] },
        scheduledFor: {
          lte: now,
        },
      },
    })

    let published = 0
    const skipped: { id: string; status: string; reason: string }[] = []

    for (const article of articles) {
      const guard = publicationGuard(article.status)

      if (!guard.allowed) {
        skipped.push({
          id: article.id,
          status: article.status,
          reason: guard.reason,
        })
        continue
      }

      const updatedArticle = await prisma.article.update({
        where: {
          id: article.id,
        },
        data: {
          status: "published",
          publishedAt: new Date(),
          scheduledFor: null,
        },
      })

      await autoGenerateSocialPosts(updatedArticle.id)
      await generateNewsletterForArticle(updatedArticle.id)

      published += 1
    }

    return NextResponse.json({
      ok: true,
      published,
      skipped,
    })
  } catch (error) {
    console.error("Scheduled publish worker failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Scheduled publish worker failed",
      },
      { status: 500 }
    )
  }
}