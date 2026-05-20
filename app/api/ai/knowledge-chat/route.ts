import { NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

function cosineSimilarity(a: number[], b: number[]) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))

  if (magnitudeA === 0 || magnitudeB === 0) return 0

  return dot / (magnitudeA * magnitudeB)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const question = body.question as string

    if (!question) {
      return NextResponse.json(
        { ok: false, error: "Question is required" },
        { status: 400 }
      )
    }

    const queryEmbeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: question,
    })

    const queryEmbedding = queryEmbeddingResponse.data[0].embedding

    const embeddings = await prisma.articleEmbedding.findMany({
      include: {
        article: true,
      },
    })

    const scoredArticles = embeddings
      .map((item) => {
        const similarity = cosineSimilarity(
          queryEmbedding,
          item.embedding as number[]
        )

        return {
          similarity,
          article: item.article,
          embeddedContent: item.content,
        }
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5)

    const context = scoredArticles
      .map((item) => {
        return `
Title: ${item.article.title}
Slug: /blog/${item.article.slug}
Category: ${item.article.category}
Similarity: ${item.similarity.toFixed(4)}

Context:
${item.embeddedContent}
`
      })
      .join("\n---\n")

    const response = await openai.responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the Echoes & Visions Knowledge Assistant. " +
        DAVID_WRITING_DNA +
        " Answer only from the retrieved article context. " +
        "If the answer is not supported by the retrieved context, say so clearly. " +
        "Do not invent sources. Do not pretend the content says something it does not. " +
        "Use a clear, practical, warm tone.",
      input: `
Question:
${question}

Retrieved article context:
${context}

Answer the question clearly.
At the end, include 1-3 related article links from the retrieved slugs if relevant.
`,
    })

    return NextResponse.json({
      ok: true,
      answer: response.output_text,
      sources: scoredArticles.map((item) => ({
        title: item.article.title,
        slug: `/blog/${item.article.slug}`,
        similarity: item.similarity,
      })),
    })
  } catch (error) {
    console.error("RAG knowledge chat failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to answer question",
      },
      { status: 500 }
    )
  }
}