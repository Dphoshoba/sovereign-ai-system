import { buildTenantSessionModel } from "./tenant-session-model"

export type ClaimCheckpoint = {
  id: string
  claim: string
  required: boolean
  source: "future-provider-claim" | "runtime-context"
  reportOnly: true
}

export function buildClaimCheckpoints(): ClaimCheckpoint[] {
  return buildTenantSessionModel().map((field) => ({
    id: `claim-${field.key}`,
    claim: field.key,
    required: field.required,
    source: field.source,
    reportOnly: true,
  }))
}

export function evaluateClaimCoverage(
  checkpoints: ClaimCheckpoint[] = buildClaimCheckpoints()
) {
  const required = checkpoints.filter((checkpoint) => checkpoint.required).length
  const providerBacked = checkpoints.filter(
    (checkpoint) => checkpoint.source === "future-provider-claim"
  ).length

  return {
    score: Math.round(
      (required / checkpoints.length) * 65 + (providerBacked / checkpoints.length) * 25
    ),
    status: "CLAIM_CHECKPOINTS_DEFINED_REPORT_ONLY" as const,
    checkpointCount: checkpoints.length,
    checkpoints,
  }
}
