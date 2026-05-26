import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { twitterClient } from "@/lib/twitter"

export async function POST(req: Request) {
  try {
    const { postId } = await req.json()

    if (!postId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing postId",
        },
        { status: 400 }
      )
    }

    const post = await prisma.socialPost.findUnique({
      where: {
        id: postId,
      },
    })

    if (!post) {
      return NextResponse.json(
        {
          ok: false,
          error: "Post not found",
        },
        { status: 404 }
      )
    }

    if (post.platform !== "twitter") {
      return NextResponse.json(
        {
          ok: false,
          error: "Not a Twitter post",
        },
        { status: 400 }
      )
    }

    const tweet = await twitterClient.v2.tweet(post.content)

    const updated = await prisma.socialPost.update({
      where: {
        id: post.id,
      },
      data: {
        status: "published",
        externalId: tweet.data.id,
        publishedAt: new Date(),
      },
    })

    return NextResponse.json({
      ok: true,
      post: updated,
    })
  } catch (error) {
    console.error("Twitter publish failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to publish tweet",
      },
      { status: 500 }
    )
  }
}