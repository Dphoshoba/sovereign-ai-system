import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"

export async function POST(req: NextRequest) {
  try {
    const { articleId } = await req.json()

    const article = await prisma.article.findUnique({
      where: {
        id: articleId,
      },
    })

    if (!article) {
      return NextResponse.json(
        {
          ok: false,
          error: "Article not found",
        },
        { status: 404 }
      )
    }

    const completion =
      await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You are a professional content strategist and editor. Return valid JSON only. Never fabricate facts. Use cautious wording where evidence is uncertain.",
          },
          {
            role: "user",
            content: `
Create a publishable article.

Title:
${article.title}

Category:
${article.category}

Return:

{
  "excerpt": "...",
  "seoTitle": "...",
  "seoDescription": "...",
  "content": "...",
  "faq": [
    {
      "question": "...",
      "answer": "..."
    }
  ]
}
            `,
          },
        ],
      })

    const raw =
      completion.choices[0]?.message?.content || "{}"

    const generated = JSON.parse(
      raw.replace(/```json|```/g, "").trim()
    )

    const updatedArticle =
      await prisma.article.update({
        where: {
          id: articleId,
        },
        data: {
          excerpt: generated.excerpt,
          seoTitle: generated.seoTitle,
          seoDescription:
            generated.seoDescription,
          content: generated.content,
          status: "review-required",
        },
      })

    return NextResponse.json({
      ok: true,
      article: updatedArticle,
      faq: generated.faq,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Generation failed",
      },
      { status: 500 }
    )
  }
}