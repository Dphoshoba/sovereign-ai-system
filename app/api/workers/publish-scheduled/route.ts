import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const now = new Date()

    const articles = await prisma.article.findMany({
      where: {
        status: "scheduled",
        scheduledFor: {
          lte: now,
        },
      },
    })

    let published = 0

    for (const article of articles) {
      await prisma.article.update({
        where: {
          id: article.id,
        },
        data: {
          status: "published",
          publishedAt: new Date(),
        },
      })

      await prisma.newsletter.updateMany({
        where: {
          articleId: article.id,
        },
        data: {
          status: "approved",
        },
      })

      await prisma.socialPost.updateMany({
        where: {
          articleId: article.id,
        },
        data: {
          status: "approved",
        },
      })

      published++
    }

    return NextResponse.json({
      ok: true,
      published,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Worker failed",
      },
      { status: 500 }
    )
  }
}