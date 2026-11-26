import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePublishingEditor } from "../../../../../lib/publishing/require-editor-auth"
import {
  channelAuthorised,
  resolveAuthorisedChannels,
} from "../../../../../lib/publishing/distribution-scope"
import {
  publishApprovedLinkedInPost,
  type LinkedInPublishStore,
} from "../../../../../lib/social/linkedin-publish"

export async function POST(req: NextRequest) {
  const auth = await requirePublishingEditor()
  if (!auth.ok) return auth.response

  try {
    const { postId } = await req.json()

    if (!postId || typeof postId !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing postId" },
        { status: 400 },
      )
    }

    const post = await prisma.socialPost.findUnique({
      where: { id: postId },
      include: {
        article: {
          include: { reviewNotes: true },
        },
      },
    })

    if (!post) {
      return NextResponse.json(
        { ok: false, error: "Post not found" },
        { status: 404 },
      )
    }

    if (post.platform !== "linkedin") {
      return NextResponse.json(
        { ok: false, error: "Not a LinkedIn post" },
        { status: 400 },
      )
    }

    if (!post.articleId || !post.article) {
      return NextResponse.json(
        {
          ok: false,
          code: "article_required",
          error: "LinkedIn publish requires a linked article with distribution scope.",
        },
        { status: 403 },
      )
    }

    const authorised = resolveAuthorisedChannels({
      articleId: post.articleId,
      reviewNotes: post.article.reviewNotes ?? [],
    })

    if (authorised.stale) {
      return NextResponse.json(
        {
          ok: false,
          code: "stale_scope",
          error:
            "Distribution scope is stale after material package changes; re-approval required.",
        },
        { status: 409 },
      )
    }

    if (!channelAuthorised(authorised.scope, "linkedin")) {
      return NextResponse.json(
        {
          ok: false,
          code: "channel_not_authorised",
          error:
            "LinkedIn is not in the approved distribution scope for this article.",
        },
        { status: 403 },
      )
    }

    const result = await publishApprovedLinkedInPost({
      postId,
      store: prisma,
      actor: auth.actor,
      requireCanonicalUrl: true,
    })

    return NextResponse.json(result.body, { status: result.status })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "LinkedIn publish failed",
      },
      { status: 500 },
    )
  }
}
