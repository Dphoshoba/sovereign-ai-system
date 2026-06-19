import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const limit = Number(body.limit || 3)

    const topics = await prisma.discoveredTopic.findMany({
      where: {
        status: "discovered",
      },
      orderBy: {
        opportunityScore: "desc",
      },
      take: limit,
    })

    const results = []

    for (const topic of topics) {
      await prisma.discoveredTopic.update({
        where: { id: topic.id },
        data: { status: "researching" },
      })

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/ai/generate-article`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topic: topic.title,
            category: topic.category,
          }),
        }
      )

      const articleResult = await response.json()

      if (!response.ok || !articleResult?.ok) {
        await prisma.discoveredTopic.update({
          where: { id: topic.id },
          data: { status: "discovered" },
        })

        results.push({
          topicId: topic.id,
          title: topic.title,
          ok: false,
          error: "Article generation failed",
          articleResult,
        })

        continue
      }

      const updatedTopic = await prisma.discoveredTopic.update({
        where: { id: topic.id },
        data: { status: "generated" },
      })

      results.push({
        topicId: updatedTopic.id,
        title: updatedTopic.title,
        ok: true,
        status: updatedTopic.status,
        articleId: articleResult.article?.id,
        articleStatus: articleResult.article?.status,
      })
    }

    return NextResponse.json({
      ok: true,
      requestedLimit: limit,
      processedCount: results.length,
      results,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to run discovery queue",
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return POST(new Request("http://localhost"))
}