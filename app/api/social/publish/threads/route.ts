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
  publishApprovedThreadsPost,
  type ThreadsPublishStore,
} from "../../../../../lib/social/threads-publish"

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

    if (post.platform !== "threads") {
      return NextResponse.json(
        { ok: false, error: "Not a Threads post" },
        { status: 400 },
      )
    }

    const scope = requireAuthorisedChannel({
      articleId: post.articleId,
      reviewNotes: post.article?.reviewNotes ?? [],
      channel: "threads",
      channelLabel: "Threads",
    })
    if (!scope.ok) {
      return NextResponse.json(scope.body, { status: scope.status })
    }

    const ledger = prisma as unknown as ChannelLedgerStore
    const state = await loadChannelExecutionState({
      store: ledger,
      channel: "threads",
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
      channel: "threads",
      articleId: post.articleId!,
      payloadId: post.id,
      actor: auth.actor,
    })

    const result = await publishApprovedThreadsPost({
      postId,
      store: prisma as unknown as ThreadsPublishStore,
      requireCanonicalUrl: true,
    })

    await recordChannelOutcome({
      store: ledger,
      outcome: {
        v: 1,
        channel: "threads",
        articleId: post.articleId!,
        payloadId: post.id,
        claimId: `threads:${post.articleId}:${post.id}`,
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
        error: error instanceof Error ? error.message : "Threads publish failed",
      },
      { status: 500 },
    )
  }
}
