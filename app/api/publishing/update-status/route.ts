import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { publicationGuard } from "../../../../lib/publishing/publication-guard"

export async function POST(req: Request) {
  try {
    const { queueId, status } = await req.json()

    if (!queueId || !status) {
      return NextResponse.json(
        { ok: false, error: "Missing queueId or status" },
        { status: 400 }
      )
    }

    const queueItem = await prisma.publishingQueue.findUnique({
      where: { id: queueId },
    })

    if (!queueItem) {
      return NextResponse.json(
        { ok: false, error: "Queue item not found" },
        { status: 404 }
      )
    }

    if (status === "published") {
      const existingArticle = await prisma.article.findUnique({
        where: { id: queueItem.articleId },
      })

      if (!existingArticle) {
        return NextResponse.json(
          { ok: false, error: "Article not found" },
          { status: 404 }
        )
      }

      const guard = publicationGuard(existingArticle.status)

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
    }

    const updated = await prisma.publishingQueue.update({
      where: { id: queueId },
      data: {
        status,
        publishedAt: status === "published" ? new Date() : null,
      },
    })

    return NextResponse.json({
      ok: true,
      item: updated,
    })
  } catch (error) {
    console.error("Queue update failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to update queue",
      },
      { status: 500 }
    )
  }
}
