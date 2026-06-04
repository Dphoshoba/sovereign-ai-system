import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"
import { encodingNormalizer } from "../../../../lib/research/encoding-normalizer"

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
      where: {
        id: articleId,
      },
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
            "You create high-performing social media posts for creators, founders, ministries, and AI businesses. Return only valid JSON.",
        },
        {
          role: "user",
          content: `
Create:
1 Twitter/X post
1 LinkedIn post
1 Threads post

Article title:
${article.title}

Article excerpt:
${article.excerpt}

Return JSON:

{
  "twitter": "...",
  "linkedin": "...",
  "threads": "..."
}

Do not use emojis. Do not use hype. Keep the tone wise, practical, clear, and human.
          `,
        },
      ],
    })

    const raw = completion.choices[0]?.message?.content || "{}"

    const cleaned = raw.replace(/```json|```/g, "").trim()

    const parsed = JSON.parse(cleaned)

    const twitterContent = parsed.twitter
      ? encodingNormalizer(parsed.twitter)
      : ""

    const linkedinContent = parsed.linkedin
      ? encodingNormalizer(parsed.linkedin)
      : ""

    const threadsContent = parsed.threads
      ? encodingNormalizer(parsed.threads)
      : ""

    const posts = await Promise.all([
      prisma.socialPost.create({
        data: {
          articleId: article.id,
          platform: "twitter",
          content: twitterContent,
        },
      }),

      prisma.socialPost.create({
        data: {
          articleId: article.id,
          platform: "linkedin",
          content: linkedinContent,
        },
      }),

      prisma.socialPost.create({
        data: {
          articleId: article.id,
          platform: "threads",
          content: threadsContent,
        },
      }),
    ])

    return NextResponse.json({
      ok: true,
      posts,
    })
  } catch (error) {
    console.error("Social generation failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate social posts",
      },
      { status: 500 }
    )
  }
}