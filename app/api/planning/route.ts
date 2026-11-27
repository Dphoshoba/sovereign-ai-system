import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"
import { requireEditorAuth } from "../../../lib/publishing/require-editor-auth"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  try {
    const articles = await prisma.article.findMany({
      where: {
        status: "published",
      },
      orderBy: {
        publishedAt: "desc",
      },
    })

    const categories = articles.reduce(
      (acc, article) => {
        acc[article.category] =
          (acc[article.category] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const completion =
      await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You are a content strategist. Return valid JSON only.",
          },
          {
            role: "user",
            content: `
Published Categories:

${JSON.stringify(categories, null, 2)}

Return:

{
  "nextArticleTitle": "...",
  "nextNewsletterTopic": "...",
  "underrepresentedCategory": "...",
  "recommendedContentPillar": "...",
  "reasoning": "..."
}
            `,
          },
        ],
      })

    const plan = JSON.parse(
      completion.choices[0].message.content!
        .replace(/```json|```/g, "")
        .trim()
    )

    return NextResponse.json({
      ok: true,
      categories,
      plan,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Planning failed",
      },
      { status: 500 }
    )
  }
}