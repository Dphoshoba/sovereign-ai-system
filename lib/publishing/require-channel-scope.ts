/**
 * Shared I2 distribution-scope gate for direct publish routes and workers.
 */

import {
  channelAuthorised,
  resolveAuthorisedChannels,
  type DistributionChannel,
  type ReviewNoteLike,
} from "./distribution-scope"

export type ScopeGateResult =
  | { ok: true; channels: DistributionChannel[] }
  | {
      ok: false
      status: number
      body: {
        ok: false
        code: "article_required" | "stale_scope" | "channel_not_authorised"
        error: string
      }
    }

export function requireAuthorisedChannel(input: {
  articleId: string | null | undefined
  reviewNotes: ReviewNoteLike[]
  channel: DistributionChannel
  channelLabel?: string
}): ScopeGateResult {
  if (!input.articleId) {
    return {
      ok: false,
      status: 403,
      body: {
        ok: false,
        code: "article_required",
        error: `${input.channelLabel || input.channel} publish requires a linked article with distribution scope.`,
      },
    }
  }

  const authorised = resolveAuthorisedChannels({
    articleId: input.articleId,
    reviewNotes: input.reviewNotes,
  })

  if (authorised.stale) {
    return {
      ok: false,
      status: 409,
      body: {
        ok: false,
        code: "stale_scope",
        error:
          "Distribution scope is stale after material package changes; re-approval required.",
      },
    }
  }

  if (!channelAuthorised(authorised.scope, input.channel)) {
    return {
      ok: false,
      status: 403,
      body: {
        ok: false,
        code: "channel_not_authorised",
        error: `${input.channelLabel || input.channel} is not in the authorised I2 distribution scope.`,
      },
    }
  }

  return { ok: true, channels: authorised.channels }
}
