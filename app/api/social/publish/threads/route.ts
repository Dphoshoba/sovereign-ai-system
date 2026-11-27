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
      include: { article: { select: { status: true } } },
    })

    if (!post) {
      return NextResponse.json({ ok: false, error: "Post not found" }, { status: 404 })
    }

    if (post.platform !== "threads") {
      return NextResponse.json({ ok: false, error: "Not a Threads post" }, { status: 400 })
    }

    if (post.status === "published") {
      return NextResponse.json({ ok: true, alreadyPublished: true, externalId: post.externalId, post })
    }

    if (post.status !== "approved") {
      return NextResponse.json({ ok: false, error: "Social post must be approved before publishing." }, { status: 403 })
    }

    if (post.article && post.article.status !== "published") {
      return NextResponse.json({ ok: false, error: "Linked article must be published before posting to Threads." }, { status: 403 })
    }

    const integration = await prisma.externalIntegration.findUnique({ where: { name: "Threads" } })
    if (!integration || !integration.enabled) {
      return NextResponse.json({ ok: false, error: "Threads is not connected. Authorize via /api/social/oauth/threads/authorize." }, { status: 503 })
    }

    const config = integration.config as Record<string, unknown> | null
    const accessToken = config?.accessToken as string | undefined
    const userId = config?.userId as string | undefined

    if (!accessToken || !userId) {
      return NextResponse.json({ ok: false, error: "Threads access token or user ID missing." }, { status: 503 })
    }

    if (config?.expiresAt && new Date(config.expiresAt as string) < new Date()) {
      return NextResponse.json({ ok: false, error: "Threads access token has expired. Re-authorize." }, { status: 503 })
    }

    // Step 1: Create media container
    const containerResponse = await fetch(
      `https://graph.threads.net/v1.0/${userId}/threads?media_type=TEXT&text=${encodeURIComponent(post.content)}&access_token=${accessToken}`,
      { method: "POST" }
    )
    const containerData = await containerResponse.json()

    if (!containerResponse.ok || !containerData.id) {
      await prisma.operationalEvent.create({
        data: {
          type: "social_publish_failed", source: "threads",
          title: "Threads container creation failed",
          message: JSON.stringify(containerData).slice(0, 500),
          severity: "high", status: "new",
          entityType: "SocialPost", entityId: post.id,
          payload: { articleId: post.articleId },
        },
      })
      return NextResponse.json({ ok: false, error: `Threads container creation failed: ${JSON.stringify(containerData).slice(0, 200)}` }, { status: 502 })
    }

    const creationId = containerData.id

    // Step 2: Publish container
    const publishResponse = await fetch(
      `https://graph.threads.net/v1.0/${userId}/threads_publish?creation_id=${creationId}&access_token=${accessToken}`,
      { method: "POST" }
    )
    const publishData = await publishResponse.json()

    if (!publishResponse.ok || !publishData.id) {
      await prisma.operationalEvent.create({
        data: {
          type: "social_publish_failed", source: "threads",
          title: "Threads publish failed",
          message: JSON.stringify(publishData).slice(0, 500),
          severity: "high", status: "new",
          entityType: "SocialPost", entityId: post.id,
          payload: { creationId, articleId: post.articleId },
        },
      })
      return NextResponse.json({ ok: false, error: `Threads publish failed: ${JSON.stringify(publishData).slice(0, 200)}` }, { status: 502 })
    }

    const threadsMediaId = publishData.id
    const username = config?.username as string | undefined
    const publicUrl = username && threadsMediaId
      ? `https://www.threads.net/@${username}/post/${threadsMediaId}`
      : null

    const updated = await prisma.socialPost.update({
      where: { id: post.id },
      data: { status: "published", externalId: threadsMediaId, publishedAt: new Date() },
    })

    await prisma.operationalEvent.create({
      data: {
        type: "social_publish", source: "threads",
        title: "Threads post published",
        message: `Media ID ${threadsMediaId}`,
        severity: "info", status: "new",
        entityType: "SocialPost", entityId: post.id,
        payload: { threadsMediaId, creationId, publicUrl, articleId: post.articleId },
      },
    })

    return NextResponse.json({
      ok: true,
      post: updated,
      externalId: threadsMediaId,
      publicUrl,
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Threads publish failed" },
      { status: 500 }
    )
  }
}
