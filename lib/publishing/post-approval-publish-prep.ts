/**
 * EV-EDITORIAL-07-P2/P4 — after approval: image prep then optional calendar slot.
 * Never publishes and never bypasses schedule/publication guards.
 */
import { prepareFeaturedImageAfterApproval } from "./post-approval-image-prep"
import {
  assertSlotNotEarly,
  nextPublishingSlot,
  type PublishingSlotPolicy,
} from "./publishing-calendar-policy"
import { parseSchedulingTimestamp } from "./adelaide-time"
import {
  transitionArticleLifecycle,
  type ArticleLifecycleStore,
} from "./article-lifecycle"

export type PostApprovalPublishPrepResult = {
  image: Awaited<ReturnType<typeof prepareFeaturedImageAfterApproval>>
  schedule:
    | {
        ok: true
        outcome: "scheduled" | "already_scheduled" | "skipped"
        scheduledFor: string | null
        articleUnchanged: boolean
      }
    | {
        ok: false
        outcome: "failed" | "skipped"
        error: string
        articleUnchanged: true
      }
}

export async function runPostApprovalPublishPrep(
  input: {
    articleId: string
    actor: string
    assignCalendarSlot?: boolean
    policy?: PublishingSlotPolicy
    generateImage?: (prompt: string) => Promise<string | undefined>
  },
  deps: {
    prisma: ArticleLifecycleStore & {
      article: {
        findUnique: (args: {
          where: { id: string }
          include?: Record<string, unknown>
        }) => Promise<{
          id: string
          status: string
          featuredImage: string | null
          scheduledFor: Date | string | null
        } | null>
        findMany?: (args: {
          where: { scheduledFor: { not: null } }
          select: { scheduledFor: true }
        }) => Promise<Array<{ scheduledFor: Date | string | null }>>
      }
    } & Parameters<typeof prepareFeaturedImageAfterApproval>[1]["prisma"]
  },
): Promise<PostApprovalPublishPrepResult> {
  const image = await prepareFeaturedImageAfterApproval(
    {
      articleId: input.articleId,
      actor: input.actor,
      generateImage: input.generateImage,
    },
    { prisma: deps.prisma },
  )

  if (!input.assignCalendarSlot) {
    return {
      image,
      schedule: {
        ok: true,
        outcome: "skipped",
        scheduledFor: null,
        articleUnchanged: true,
      },
    }
  }

  if (!image.ok && image.code !== "not_approved") {
    // Still allow scheduling only when image path succeeded or already applied.
  }

  const article = await deps.prisma.article.findUnique({
    where: { id: input.articleId },
  })
  if (!article) {
    return {
      image,
      schedule: {
        ok: false,
        outcome: "failed",
        error: "Article not found for scheduling",
        articleUnchanged: true,
      },
    }
  }

  if (article.status !== "approved" && article.status !== "scheduled") {
    return {
      image,
      schedule: {
        ok: false,
        outcome: "skipped",
        error: "Calendar assignment requires an approved article.",
        articleUnchanged: true,
      },
    }
  }

  if (article.status === "scheduled" && article.scheduledFor) {
    return {
      image,
      schedule: {
        ok: true,
        outcome: "already_scheduled",
        scheduledFor: new Date(article.scheduledFor).toISOString(),
        articleUnchanged: true,
      },
    }
  }

  if (!article.featuredImage && !(image.ok && image.featuredImage)) {
    return {
      image,
      schedule: {
        ok: false,
        outcome: "skipped",
        error: "Featured image required before calendar assignment.",
        articleUnchanged: true,
      },
    }
  }

  const occupied = deps.prisma.article.findMany
    ? await deps.prisma.article.findMany({
        where: { scheduledFor: { not: null } },
        select: { scheduledFor: true },
      })
    : []

  const slotIso = nextPublishingSlot({
    policy: input.policy,
    occupiedUtc: occupied.map((row) => row.scheduledFor),
  })

  if (!assertSlotNotEarly(slotIso)) {
    return {
      image,
      schedule: {
        ok: false,
        outcome: "failed",
        error: "Computed slot was not in the future.",
        articleUnchanged: true,
      },
    }
  }

  const parsed = parseSchedulingTimestamp(slotIso)
  if (!parsed.ok) {
    return {
      image,
      schedule: {
        ok: false,
        outcome: "failed",
        error: parsed.error,
        articleUnchanged: true,
      },
    }
  }

  const scheduled = await transitionArticleLifecycle(
    {
      articleId: input.articleId,
      transition: "schedule",
      actor: input.actor,
      scheduledFor: parsed.date,
    },
    { prisma: deps.prisma },
  )

  if (!scheduled.ok) {
    return {
      image,
      schedule: {
        ok: false,
        outcome: "failed",
        error: scheduled.error,
        articleUnchanged: true,
      },
    }
  }

  return {
    image,
    schedule: {
      ok: true,
      outcome: scheduled.alreadyApplied ? "already_scheduled" : "scheduled",
      scheduledFor: parsed.iso,
      articleUnchanged: Boolean(scheduled.alreadyApplied),
    },
  }
}
