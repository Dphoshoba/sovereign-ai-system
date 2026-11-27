import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePublishingEditor } from "../../../../../lib/publishing/require-editor-auth"
import { requireAuthorisedChannel } from "../../../../../lib/publishing/require-channel-scope"
import {
  loadChannelExecutionState,
  recordChannelClaim,
  recordChannelOutcome,
  type ChannelLedgerStore,
} from "../../../../../lib/publishing/channel-execution-ledger"
import { shouldBlockRetry } from "../../../../../lib/publishing/channel-execution-guard"
import {
  publishApprovedFacebookPost,
  type FacebookPublishStore,
} from "../../../../../lib/social/facebook-publish"
import { DEFAULT_FACEBOOK_GRAPH_VERSION } from "../../../../../lib/social/facebook-oauth"

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

    if (post.platform !== "facebook") {
      return NextResponse.json(
        { ok: false, error: "Not a Facebook post" },
        { status: 400 },
      )
    }

    const scope = requireAuthorisedChannel({
      articleId: post.articleId,
      reviewNotes: post.article?.reviewNotes ?? [],
      channel: "facebook",
      channelLabel: "Facebook",
    })
    if (!scope.ok) {
      return NextResponse.json(scope.body, { status: scope.status })
    }

    const ledger = prisma as unknown as ChannelLedgerStore
    const state = await loadChannelExecutionState({
      store: ledger,
      channel: "facebook",
      articleId: post.articleId!,
      payloadId: post.id,
    })
    const blocked = shouldBlockRetry({
      existingExternalId: post.externalId,
      openClaim: state.openClaim,
      priorOutcome: state.priorOutcome,
    })
    if (blocked.block) {
      return NextResponse.json(
        {
          ok: false,
          code: blocked.code,
          error: blocked.reason,
        },
        { status: 409 },
      )
    }

    await recordChannelClaim({
      store: ledger,
      channel: "facebook",
      articleId: post.articleId!,
      payloadId: post.id,
      actor: auth.actor,
    })

    const result = await publishApprovedFacebookPost({
      postId,
      store: prisma as unknown as FacebookPublishStore,
      requireCanonicalUrl: true,
      graphVersion:
        process.env.FACEBOOK_GRAPH_API_VERSION?.trim() ||
        DEFAULT_FACEBOOK_GRAPH_VERSION,
    })

    await recordChannelOutcome({
      store: ledger,
      outcome: {
        v: 1,
        channel: "facebook",
        articleId: post.articleId!,
        payloadId: post.id,
        claimId: `facebook:${post.articleId}:${post.id}`,
        status:
          result.body.ok && (result.body.externalId || result.body.alreadyPublished)
            ? result.body.alreadyPublished
              ? "skipped_already_published"
              : "provider_accepted"
            : result.body.code === "ambiguous_provider_outcome"
              ? "ambiguous"
              : "provider_rejected",
        externalId:
          typeof result.body.externalId === "string"
            ? result.body.externalId
            : null,
        recordedAt: new Date().toISOString(),
        detail:
          typeof result.body.error === "string" ? result.body.error : undefined,
      },
    })

    return NextResponse.json(result.body, { status: result.status })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Facebook publish failed",
      },
      { status: 500 },
    )
  }
}
