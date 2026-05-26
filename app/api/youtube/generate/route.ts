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
      temperature: 0.8,
      messages: [
        {
          role: "system",
          content:
            "You create high-performing YouTube metadata and video outlines for Echoes & Visions. Return only valid JSON.",
        },
        {
          role: "user",
          content: `
Create YouTube content from this article.

Article title:
${article.title}

Excerpt:
${article.excerpt}

Content:
${article.content}

Return JSON:
{
  "title": "...",
  "description": "...",
  "tags": "tag1, tag2, tag3",
  "shortsCaption": "...",
  "thumbnailPrompt": "...",
  "scriptOutline": "..."
}
          `,
        },
      ],
    })

    const raw = completion.choices[0]?.message?.content || "{}"
    const cleaned = raw.replace(/```json|```/g, "").trim()
    const parsed = JSON.parse(cleaned)

    const youtubePost = await prisma.youTubePost.create({
      data: {
        articleId: article.id,
        title: parsed.title,
        description: parsed.description,
        tags: parsed.tags || null,
        shortsCaption: parsed.shortsCaption || null,
        thumbnailPrompt: parsed.thumbnailPrompt || null,
        scriptOutline: JSON.stringify(parsed.scriptOutline, null, 2),
        status: "draft",
      },
    })

    return NextResponse.json({
      ok: true,
      youtubePost,
    })
  } catch (error) {
    console.error("YouTube generation failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to generate YouTube content",
      },
      { status: 500 }
    )
  }
}