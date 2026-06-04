import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"
import { encodingNormalizer } from "../../../../lib/research/encoding-normalizer"

export async function POST(req: Request) {
  try {
    const { postId } = await req.json()

    if (!postId) {
      return NextResponse.json(
        { ok: false, error: "Missing postId" },
        { status: 400 }
      )
    }

    const post = await prisma.socialPost.findUnique({
      where: { id: postId },
      include: {
        article: true,
      },
    })

    if (!post) {
      return NextResponse.json(
        { ok: false, error: "Post not found" },
        { status: 404 }
      )
    }

    if (!post.article) {
      return NextResponse.json(
        { ok: false, error: "Linked article not found" },
        { status: 404 }
      )
    }

    const response = await getOpenAI().responses.create({
      model: "gpt-5.2",
      instructions:
        "You write wise, clear, practical social media copy for Echoes & Visions. Return only the post text. No markdown. No emojis. No hype.",
      input:
        `Regenerate one ${post.platform} post for this article.\n\n` +
        `Tone: wise, clear, human, practical, calm, founder-level.\n` +
        `Do not use emojis. Do not invent facts.\n\n` +
        `Article title:\n${post.article.title}\n\n` +
        `Article excerpt:\n${post.article.excerpt || ""}\n\n` +
        `Current post:\n${post.content}`,
    })

    let content = encodingNormalizer(response.output_text)

    if (post.platform === "twitter") {
      content = content.slice(0, 280)
    }

    const updated = await prisma.socialPost.update({
      where: { id: post.id },
      data: {
        content,
        status: "review-required",
      },
    })

    return NextResponse.json({
      ok: true,
      post: updated,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Regeneration failed",
      },
      { status: 500 }
    )
  }
}
