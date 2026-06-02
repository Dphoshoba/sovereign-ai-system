import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"

export async function POST(req: Request) {
  try {
    const { articleId } = await req.json()

    if (!articleId) {
      return NextResponse.json(
        { ok: false, error: "Missing articleId" },
        { status: 400 }
      )
    }

    const article = await prisma.article.findUnique({
      where: { id: articleId },
    })

    if (!article) {
      return NextResponse.json(
        { ok: false, error: "Article not found" },
        { status: 404 }
      )
    }

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content:
            "You write warm, practical newsletter emails for Echoes & Visions. Return only valid JSON with subject, previewText, and body.",
        },
        {
          role: "user",
          content: `
Create a newsletter email for this article.

Title: ${article.title}
Excerpt: ${article.excerpt}
Content: ${article.content}

Return JSON:
{
  "subject": "...",
  "previewText": "...",
  "body": "..."
}
          `,
        },
      ],
    })

    const raw = completion.choices[0]?.message?.content || "{}"
    const cleaned = raw.replace(/```json|```/g, "").trim()
    const parsed = JSON.parse(cleaned)

    const draft = await prisma.newsletterDraft.create({
      data: {
        articleId: article.id,
        subject: parsed.subject,
        previewText: parsed.previewText || null,
        body: parsed.body,
        status: "review-required",
      },
    })

    return NextResponse.json({
      ok: true,
      draft,
    })
  } catch (error) {
    console.error("Newsletter draft generation failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate newsletter draft",
      },
      { status: 500 }
    )
  }
}