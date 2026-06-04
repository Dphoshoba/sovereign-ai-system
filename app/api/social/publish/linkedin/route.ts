import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
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

    if (post.platform !== "linkedin") {
      return NextResponse.json(
        { ok: false, error: "Not a LinkedIn post" },
        { status: 400 }
      )
    }

    if (post.article && post.article.status !== "published") {
      return NextResponse.json(
        {
          ok: false,
          error: "Linked article must be published before posting to LinkedIn.",
        },
        { status: 403 }
      )
    }

    if (!post.content || post.content.length < 1) {
      return NextResponse.json(
        {
          ok: false,
          error: "LinkedIn post content is required.",
        },
        { status: 400 }
      )
    }

    if (post.status === "published") {
      return NextResponse.json({
        ok: true,
        alreadyPublished: true,
        message: "This LinkedIn post has already been published.",
        post,
      })
    }

    return NextResponse.json({
      ok: false,
      error: "LinkedIn publishing is not connected yet.",
      post,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "LinkedIn publish failed",
      },
      { status: 500 }
    )
  }
}
