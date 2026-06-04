import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { encodingNormalizer } from "../../../../lib/research/encoding-normalizer"

export async function POST(req: Request) {
  try {
    const { postId, content } = await req.json()

    if (!postId || !content) {
      return NextResponse.json(
        { ok: false, error: "Missing postId or content" },
        { status: 400 }
      )
    }

    const post = await prisma.socialPost.update({
      where: { id: postId },
      data: {
        content: encodingNormalizer(content),
        status: "review-required",
      },
    })

    return NextResponse.json({ ok: true, post })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Update failed",
      },
      { status: 500 }
    )
  }
}
