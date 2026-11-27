/**
 * Shared channel execution claim / ambiguous-outcome helpers for R4-A.
 * Reuses OperationalEvent patterns — does not introduce a parallel ledger.
 */

export type ChannelExecutionClaim = {
  v: 1
  channel: string
  articleId: string
  payloadId: string
  claimId: string
  claimedAt: string
  actor: string
}

export type ChannelExecutionOutcome = {
  v: 1
  channel: string
  articleId: string
  payloadId: string
  claimId: string
  status:
    | "provider_accepted"
    | "provider_rejected"
    | "ambiguous"
    | "skipped_already_published"
  externalId?: string | null
  recordedAt: string
  detail?: string
}

export function buildChannelClaimId(parts: {
  channel: string
  articleId: string
  payloadId: string
}): string {
  return `${parts.channel}:${parts.articleId}:${parts.payloadId}`
}

export function isTerminalChannelOutcome(
  outcome: ChannelExecutionOutcome | null | undefined,
): boolean {
  if (!outcome) return false
  return (
    outcome.status === "provider_accepted" ||
    outcome.status === "skipped_already_published"
  )
}

export function shouldBlockRetry(input: {
  existingExternalId?: string | null
  priorOutcome?: ChannelExecutionOutcome | null
  openClaim?: ChannelExecutionClaim | null
}): {
  block: boolean
  reason?: string
  code?:
    | "already_published"
    | "claim_in_progress"
    | "ambiguous_unresolved"
} {
  if (input.existingExternalId) {
    return {
      block: true,
      code: "already_published",
      reason: "Provider external id already present; not republishing.",
    }
  }
  if (isTerminalChannelOutcome(input.priorOutcome)) {
    return {
      block: true,
      code: "already_published",
      reason: "Prior terminal provider acceptance recorded; not republishing.",
    }
  }
  if (input.priorOutcome?.status === "ambiguous") {
    return {
      block: true,
      code: "ambiguous_unresolved",
      reason:
        "Prior provider outcome was ambiguous; reconcile before any retry.",
    }
  }
  if (input.openClaim) {
    return {
      block: true,
      code: "claim_in_progress",
      reason: "An open execution claim exists; concurrent publish blocked.",
    }
  }
  return { block: false }
}

export function classifyProviderTimeoutAsAmbiguous(input: {
  submittedToProvider: boolean
  providerId?: string | null
  timedOut?: boolean
}): ChannelExecutionOutcome["status"] {
  if (input.providerId) return "provider_accepted"
  if (input.submittedToProvider || input.timedOut) return "ambiguous"
  return "provider_rejected"
}
