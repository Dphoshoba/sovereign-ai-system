import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePublishingEditor } from "../../../../../lib/publishing/require-editor-auth"

export async function POST(req: NextRequest) {
  const auth = await requirePublishingEditor()
  if (!auth.ok) return auth.response

  try {
    const { postId } = await req.json()

    if (!postId) {
      return NextResponse.json({ ok: false, error: "Missing postId" }, { status: 400 })
    }

    const post = await prisma.socialPost.findUnique({
      where: { id: postId },
      include: { article: { select: { status: true, slug: true, title: true } } },
    })

    if (!post) {
      return NextResponse.json({ ok: false, error: "Post not found" }, { status: 404 })
    }

    if (post.platform !== "facebook") {
      return NextResponse.json({ ok: false, error: "Not a Facebook post" }, { status: 400 })
    }

    if (post.status === "published") {
      return NextResponse.json({ ok: true, alreadyPublished: true, externalId: post.externalId, post })
    }

    if (post.status !== "approved") {
      return NextResponse.json(
        { ok: false, error: "Social post must be approved before publishing." },
        { status: 403 }
      )
    }

    if (post.article && post.article.status !== "published") {
      return NextResponse.json(
        { ok: false, error: "Linked article must be published before posting to Facebook." },
        { status: 403 }
      )
    }

    const integration = await prisma.externalIntegration.findUnique({
      where: { name: "Facebook" },
    })

    if (!integration || !integration.enabled) {
      return NextResponse.json(
        { ok: false, error: "Facebook is not connected. Authorize via /api/social/oauth/facebook/authorize." },
        { status: 503 }
      )
    }

    const config = integration.config as Record<string, unknown> | null
    const pageToken = config?.pageAccessToken as string | undefined
    const pageId = config?.pageId as string | undefined
    const graphVersion = process.env.FACEBOOK_GRAPH_API_VERSION || "v21.0"

    if (!pageToken || !pageId) {
      return NextResponse.json(
        { ok: false, error: "Facebook Page not selected. Complete Page selection." },
        { status: 503 }
      )
    }

    if (config?.expiresAt && new Date(config.expiresAt as string) < new Date()) {
      return NextResponse.json(
        { ok: false, error: "Facebook access token has expired. Re-authorize." },
        { status: 503 }
      )
    }

    const articleUrl = post.article?.slug && process.env.NEXT_PUBLIC_APP_URL
      ? `${(process.env.NEXT_PUBLIC_APP_URL).replace(/\/+$/, "")}/blog/ai-tools/${post.article.slug}`
      : null

    const body = new URLSearchParams({
      message: post.content,
      access_token: pageToken,
    })
    if (articleUrl) body.append("link", articleUrl)

    const fbResponse = await fetch(
      `https://graph.facebook.com/${graphVersion}/${pageId}/feed`,
      { method: "POST", body }
    )
    const fbData = await fbResponse.json()

    if (!fbResponse.ok || !fbData.id) {
      await prisma.operationalEvent.create({
        data: {
          type: "social_publish_failed", source: "facebook",
          title: "Facebook publish failed",
          message: JSON.stringify(fbData).slice(0, 500),
          severity: "high", status: "new",
          entityType: "SocialPost", entityId: post.id,
          payload: { articleId: post.articleId },
        },
      })
      return NextResponse.json(
        { ok: false, error: `Facebook API error: ${fbData.error?.message || JSON.stringify(fbData).slice(0, 200)}` },
        { status: 502 }
      )
    }

    const fbPostId = fbData.id

    const updated = await prisma.socialPost.update({
      where: { id: post.id },
      data: {
        status: "published",
        externalId: fbPostId,
        publishedAt: new Date(),
      },
    })

    await prisma.operationalEvent.create({
      data: {
        type: "social_publish", source: "facebook",
        title: "Facebook post published",
        message: `Post ID ${fbPostId} on page ${pageId}`,
        severity: "info", status: "new",
        entityType: "SocialPost", entityId: post.id,
        payload: { fbPostId, pageId, articleId: post.articleId },
      },
    })

    return NextResponse.json({ ok: true, post: updated, externalId: fbPostId })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Facebook publish failed" },
      { status: 500 }
    )
  }
}
