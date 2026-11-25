/**
 * EV-EDITORIAL-07-P1 — bounded evidence recovery helpers.
 * Retries transient I/O only. Never invents citations or raises scores.
 */

export const EVIDENCE_RECOVERY_MAX_ATTEMPTS = 3
export const EVIDENCE_RECOVERY_BASE_DELAY_MS = 50
export const EVIDENCE_RECOVERY_MAX_DELAY_MS = 2_000

const TRANSIENT_PATTERN =
  /fetch failed|econnreset|etimedout|socket hang up|network|temporar|timeout|503|502|429|rate limit|throttl|unavailable|eai_again|enotfound/i

export type EvidenceRecoveryClassification =
  | "transient"
  | "unsupported"
  | "irrecoverable"

export function classifyEvidenceFailure(
  error: string | null | undefined,
  code?: string | null,
): EvidenceRecoveryClassification {
  const normalizedCode = (code || "").toLowerCase()
  if (
    normalizedCode === "missing_evidence" ||
    normalizedCode === "insufficient_article_evidence" ||
    normalizedCode === "unsupported_claims"
  ) {
    return "unsupported"
  }
  if (error && TRANSIENT_PATTERN.test(error)) return "transient"
  if (normalizedCode === "audit_failure" && error && TRANSIENT_PATTERN.test(error)) {
    return "transient"
  }
  return "irrecoverable"
}

export function isTransientEvidenceFailure(
  error: string | null | undefined,
  code?: string | null,
): boolean {
  return classifyEvidenceFailure(error, code) === "transient"
}

export function buildEvidenceHoldReason(input: {
  code?: string | null
  error?: string | null
  unsupportedClaimCount?: number | null
}): string {
  const classification = classifyEvidenceFailure(input.error, input.code)
  if (classification === "unsupported") {
    const count =
      typeof input.unsupportedClaimCount === "number" &&
      input.unsupportedClaimCount > 0
        ? ` (${input.unsupportedClaimCount} unsupported claim(s))`
        : ""
    return `HOLD: evidence incomplete or unsupported${count}. ${input.error || "Director review required."}`
  }
  if (classification === "transient") {
    return `HOLD: recoverable research failure exhausted retries. ${input.error || "Retry later."}`
  }
  return `HOLD: irrecoverable research failure. ${input.error || "Director intervention required."}`
}

export function evidenceRecoveryDelayMs(attempt: number): number {
  const exp = Math.max(0, attempt - 1)
  return Math.min(
    EVIDENCE_RECOVERY_BASE_DELAY_MS * 2 ** exp,
    EVIDENCE_RECOVERY_MAX_DELAY_MS,
  )
}

export async function withBoundedEvidenceRecovery<T>(input: {
  maxAttempts?: number
  sleep?: (ms: number) => Promise<void>
  run: (attempt: number) => Promise<T>
  isRetryable: (result: T, attempt: number) => boolean
}): Promise<{ result: T; attempts: number }> {
  const maxAttempts = Math.max(1, input.maxAttempts ?? EVIDENCE_RECOVERY_MAX_ATTEMPTS)
  const sleep =
    input.sleep ??
    (async (ms: number) => {
      await new Promise((resolve) => setTimeout(resolve, ms))
    })

  let attempt = 0
  let last!: T
  while (attempt < maxAttempts) {
    attempt += 1
    last = await input.run(attempt)
    if (!input.isRetryable(last, attempt) || attempt >= maxAttempts) {
      return { result: last, attempts: attempt }
    }
    await sleep(evidenceRecoveryDelayMs(attempt))
  }
  return { result: last, attempts: attempt }
}
