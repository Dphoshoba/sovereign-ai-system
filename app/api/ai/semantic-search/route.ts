import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"

function cosineSimilarity(a: number[], b: number[]) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0)

  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))

  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))

  return dot / (magnitudeA * magnitudeB)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const query = body.query as string

    if (!query) {
      return NextResponse.json(
        { ok: false, error: "Query is required" },
        { status: 400 }
      )
    }

    const queryEmbeddingResponse = await getOpenAI().embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    })

    const queryEmbedding = queryEmbeddingResponse.data[0].embedding

    const embeddings = await prisma.articleEmbedding.findMany({
      include: {
        article: true,
      },
    })

    const scored = embeddings.map((item) => {
      const similarity = cosineSimilarity(
        queryEmbedding,
        item.embedding as number[]
      )

      return {
        similarity,
        article: item.article,
      }
    })

    const topResults = scored
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5)

    return NextResponse.json({
      ok: true,
      results: topResults,
    })
  } catch (error) {
    console.error("Semantic search failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Semantic search failed",
      },
      { status: 500 }
    )
  }
}