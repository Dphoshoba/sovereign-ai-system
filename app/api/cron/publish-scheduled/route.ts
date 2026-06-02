import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { publicationGuard } from "../../../../lib/publishing/publication-guard"

export async function GET() {
  try {
    const now = new Date()

    // Only consider content that has cleared review. Never auto-publish
    // drafts or articles still pending review.
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
      // Defense-in-depth: re-check each article against the publication guard
      // before flipping it to published, in case the status changed.
      const guard = publicationGuard(article.status)

      if (!guard.allowed) {
        skipped.push({
          id: article.id,
          status: article.status,
          reason: guard.reason,
        })
        continue
      }

      await prisma.article.update({
        where: {
          id: article.id,
        },
        data: {
          status: "published",
          publishedAt: new Date(),
        },
      })

      published += 1
    }

    return NextResponse.json({
      ok: true,
      published,
      skipped,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        ok: false,
      },
      { status: 500 }
    )
  }
}
