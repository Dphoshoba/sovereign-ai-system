import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const now = new Date()

    const articles = await prisma.article.findMany({
      where: {
        status: "draft",
        scheduledFor: {
          lte: now,
        },
      },
    })

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
    }

    return NextResponse.json({
      ok: true,
      published: articles.length,
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
