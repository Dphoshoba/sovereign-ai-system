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
      include: { article: true },
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

    if (post.status === "published") {
      return NextResponse.json({
        ok: true,
        alreadyPublished: true,
        externalId: post.externalId,
        post,
      })
    }

    if (post.status !== "approved") {
      return NextResponse.json(
        { ok: false, error: "Social post must be approved before publishing." },
        { status: 403 }
      )
    }

    if (post.article && post.article.status !== "published") {
      return NextResponse.json(
        { ok: false, error: "Linked article must be published before posting to LinkedIn." },
        { status: 403 }
      )
    }

    if (!post.content || post.content.length < 1) {
      return NextResponse.json(
        { ok: false, error: "LinkedIn post content is required." },
        { status: 400 }
      )
    }

    const integration = await prisma.externalIntegration.findUnique({
      where: { name: "LinkedIn" },
    })

    if (!integration || !integration.enabled) {
      return NextResponse.json(
        { ok: false, error: "LinkedIn publishing is not connected. Authorize via /api/social/oauth/linkedin/authorize." },
        { status: 503 }
      )
    }

    const config = integration.config as Record<string, unknown> | null
    const accessToken = config?.accessToken as string | undefined
    const memberUrn = config?.memberUrn as string | undefined

    if (!accessToken) {
      return NextResponse.json(
        { ok: false, error: "LinkedIn access token is missing. Re-authorize." },
        { status: 503 }
      )
    }

    if (config?.expiresAt && new Date(config.expiresAt as string) < new Date()) {
      return NextResponse.json(
        { ok: false, error: "LinkedIn access token has expired. Re-authorize." },
        { status: 503 }
      )
    }

    let authorUrn = memberUrn

    if (!authorUrn) {
      try {
        const meResponse = await fetch("https://api.linkedin.com/v2/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (meResponse.ok) {
          const meData = await meResponse.json()
          authorUrn = meData.id ? `urn:li:person:${meData.id}` : null
        }
      } catch {
        // /v2/me unavailable — member URN cannot be resolved
      }
    }

    if (!authorUrn) {
      return NextResponse.json(
        { ok: false, error: "LinkedIn member identity could not be resolved. Add OpenID Connect or r_liteprofile permission to the LinkedIn app." },
        { status: 503 }
      )
    }

    const body: Record<string, unknown> = {
      author: authorUrn,
      commentary: post.content,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    }

    const linkedinResponse = await fetch("https://api.linkedin.com/v2/posts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
        "LinkedIn-Version": "202503",
        "X-RestLi-Method": "create",
      },
      body: JSON.stringify(body),
    })

    if (!linkedinResponse.ok) {
      const errorText = await linkedinResponse.text()
      await prisma.operationalEvent.create({
        data: {
          type: "social_publish_failed",
          source: "linkedin",
          title: "LinkedIn publish failed",
          message: errorText.slice(0, 500),
          severity: "high",
          status: "new",
          entityType: "SocialPost",
          entityId: post.id,
          payload: { articleId: post.articleId },
        },
      })
      return NextResponse.json(
        { ok: false, error: `LinkedIn API error: ${errorText.slice(0, 200)}` },
        { status: 502 }
      )
    }

    const responseData = await linkedinResponse.json()
    const linkedinUrn = responseData.id || responseData.urn

    if (!linkedinUrn) {
      await prisma.operationalEvent.create({
        data: {
          type: "social_publish_failed",
          source: "linkedin",
          title: "LinkedIn publish returned no identifier",
          message: "No URN in response",
          severity: "high",
          status: "new",
          entityType: "SocialPost",
          entityId: post.id,
          payload: { articleId: post.articleId },
        },
      })
      return NextResponse.json(
        { ok: false, error: "LinkedIn did not return a post identifier." },
        { status: 502 }
      )
    }

    const updated = await prisma.socialPost.update({
      where: { id: post.id },
      data: {
        status: "published",
        externalId: linkedinUrn,
        publishedAt: new Date(),
      },
    })

    await prisma.operationalEvent.create({
      data: {
        type: "social_publish",
        source: "linkedin",
        title: "LinkedIn post published",
        message: `URN ${linkedinUrn}`,
        severity: "info",
        status: "new",
        entityType: "SocialPost",
        entityId: post.id,
        payload: { linkedinUrn, articleId: post.articleId },
      },
    })

    return NextResponse.json({
      ok: true,
      post: updated,
      externalId: linkedinUrn,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "LinkedIn publish failed",
      },
      { status: 500 }
    )
  }
}
