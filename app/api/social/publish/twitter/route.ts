import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { twitterClient } from "@/lib/twitter"
import { getPlatformCapabilities } from "@/lib/platform/execution/provider-contracts/social-provider"

export async function POST(req: Request) {
  let capturedPostId: string | undefined
  let capturedArticleId: string | undefined
  try {
    const caps = getPlatformCapabilities('twitter')
    if (caps.publishStatus !== 'publish_capable') {
      return NextResponse.json({ ok: false, error: 'Twitter publishing is not currently available' }, { status: 503 })
    }

    const { postId } = await req.json()
    capturedPostId = postId

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
      include: {
        article: true,
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

    capturedPostId = post.id
    capturedArticleId = post.articleId ?? undefined

    if (post.platform !== "twitter") {
      return NextResponse.json(
        {
          ok: false,
          error: "Not a Twitter post",
        },
        { status: 400 }
      )
    }

    if (post.status === "published") {
      return NextResponse.json(
        {
          ok: false,
          alreadyPublished: true,
          error: "This Twitter post has already been published.",
          externalId: post.externalId ?? undefined,
        },
        { status: 400 }
      )
    }

    if (post.article && post.article.status !== "published") {
      return NextResponse.json(
        {
          ok: false,
          error: "Linked article must be published before posting to Twitter/X.",
        },
        { status: 403 }
      )
    }

    if (!post.content || post.content.length > 280) {
      return NextResponse.json(
        {
          ok: false,
          error: "Twitter/X post must be between 1 and 280 characters.",
        },
        { status: 400 }
      )
    }

    if (post.status !== "approved") {
      return NextResponse.json(
        {
          ok: false,
          error: "Social post must be approved before publishing.",
        },
        { status: 403 }
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

    await prisma.operationalEvent.create({
      data: {
        type: 'social_publish',
        source: 'twitter',
        title: `Tweet published for article`,
        message: `Tweet ID ${tweet.data.id} published`,
        severity: 'info',
        status: 'new',
        entityType: 'SocialPost',
        entityId: post.id,
        payload: { tweetId: tweet.data.id, articleId: post.articleId },
      },
    })

    return NextResponse.json({
      ok: true,
      post: updated,
    })
  } catch (error) {
    console.error("Twitter publish failed:", error)

    await prisma.operationalEvent.create({
      data: {
        type: 'social_publish_failed',
        source: 'twitter',
        title: `Twitter publish failed`,
        message: error instanceof Error ? error.message : 'Unknown error',
        severity: 'high',
        status: 'new',
        entityType: 'SocialPost',
        entityId: capturedPostId,
        payload: capturedArticleId ? { articleId: capturedArticleId } : undefined,
      },
    })

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