/**
 * OperationalEvent-backed claim / outcome ledger for channel execution.
 * Reuses existing OperationalEvent rows — not a parallel ledger.
 */

import {
  buildChannelClaimId,
  type ChannelExecutionClaim,
  type ChannelExecutionOutcome,
} from "./channel-execution-guard"

export const CHANNEL_CLAIM_EVENT = "channel_execution_claim"
export const CHANNEL_OUTCOME_EVENT = "channel_execution_outcome"

export type ChannelLedgerStore = {
  operationalEvent: {
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>
    findMany?: (args: {
      where: Record<string, unknown>
      orderBy?: Record<string, string>
      take?: number
    }) => Promise<
      Array<{
        type: string
        payload: unknown
        createdAt?: Date | string
      }>
    >
  }
}

export async function recordChannelClaim(input: {
  store: ChannelLedgerStore
  channel: string
  articleId: string
  payloadId: string
  actor: string
}): Promise<ChannelExecutionClaim> {
  const claimId = buildChannelClaimId({
    channel: input.channel,
    articleId: input.articleId,
    payloadId: input.payloadId,
  })
  const claim: ChannelExecutionClaim = {
    v: 1,
    channel: input.channel,
    articleId: input.articleId,
    payloadId: input.payloadId,
    claimId,
    claimedAt: new Date().toISOString(),
    actor: input.actor,
  }
  await input.store.operationalEvent.create({
    data: {
      type: CHANNEL_CLAIM_EVENT,
      source: input.channel,
      title: `${input.channel} execution claim`,
      message: claimId,
      severity: "info",
      status: "new",
      entityType: "SocialPost",
      entityId: input.payloadId,
      payload: claim,
    },
  })
  return claim
}

export async function recordChannelOutcome(input: {
  store: ChannelLedgerStore
  outcome: ChannelExecutionOutcome
}): Promise<void> {
  await input.store.operationalEvent.create({
    data: {
      type: CHANNEL_OUTCOME_EVENT,
      source: input.outcome.channel,
      title: `${input.outcome.channel} execution outcome: ${input.outcome.status}`,
      message: input.outcome.detail || input.outcome.externalId || input.outcome.status,
      severity:
        input.outcome.status === "provider_accepted" ||
        input.outcome.status === "skipped_already_published"
          ? "info"
          : "high",
      status: "new",
      entityType: "SocialPost",
      entityId: input.outcome.payloadId,
      payload: input.outcome,
    },
  })
}

export async function loadChannelExecutionState(input: {
  store: ChannelLedgerStore
  channel: string
  articleId: string
  payloadId: string
}): Promise<{
  openClaim: ChannelExecutionClaim | null
  priorOutcome: ChannelExecutionOutcome | null
}> {
  const claimId = buildChannelClaimId({
    channel: input.channel,
    articleId: input.articleId,
    payloadId: input.payloadId,
  })
  if (!input.store.operationalEvent.findMany) {
    return { openClaim: null, priorOutcome: null }
  }

  const rows = await input.store.operationalEvent.findMany({
    where: {
      entityType: "SocialPost",
      entityId: input.payloadId,
      type: { in: [CHANNEL_CLAIM_EVENT, CHANNEL_OUTCOME_EVENT] },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  let priorOutcome: ChannelExecutionOutcome | null = null
  let openClaim: ChannelExecutionClaim | null = null

  for (const row of rows) {
    const payload = row.payload as Record<string, unknown> | null
    if (!payload || payload.claimId !== claimId) continue
    if (row.type === CHANNEL_OUTCOME_EVENT && !priorOutcome) {
      priorOutcome = payload as unknown as ChannelExecutionOutcome
    }
    if (row.type === CHANNEL_CLAIM_EVENT && !openClaim) {
      openClaim = payload as unknown as ChannelExecutionClaim
    }
  }

  // Claim is not open once a terminal or ambiguous outcome exists for same claimId.
  if (priorOutcome) {
    openClaim = null
  }

  return { openClaim, priorOutcome }
}
