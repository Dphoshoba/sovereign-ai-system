import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"

export async function POST() {
  try {
    const articles = await prisma.article.findMany({
      where: {
        status: "published",
      },
    })

    let processed = 0

    for (const article of articles) {
      const content = `
Title: ${article.title}

Category: ${article.category}

Excerpt:
${article.excerpt || ""}

Content:
${article.content || ""}
`

      const embeddingResponse = await getOpenAI().embeddings.create({
        model: "text-embedding-3-small",
        input: content,
      })

      const embedding = embeddingResponse.data[0].embedding

      await prisma.articleEmbedding.upsert({
        where: {
          articleId: article.id,
        },
        update: {
          content,
          embedding,
        },
        create: {
          articleId: article.id,
          content,
          embedding,
        },
      })

      processed++
    }

    return NextResponse.json({
      ok: true,
      processed,
    })
  } catch (error) {
    console.error("Embedding generation failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate embeddings",
      },
      { status: 500 }
    )
  }
}