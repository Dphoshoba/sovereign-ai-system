import { phase1Rules } from "./pipeline-registry"
import type { ExtractedFact } from "./fact-extractor"

export type FactVerificationRecord = {
  claim: string
  evidenceId: string
  sourceTitle: string
  sourceUrl: string
  confidence: "high" | "medium" | "low"
  verified: boolean
  verificationStatus: string
  requiresHumanReview: boolean
}

export type FactVerificationResult = {
  topic: string
  verifications: FactVerificationRecord[]
  verifiedCount: number
  unverifiedCount: number
  publicationBlocked: boolean
  phase1Rules: readonly string[]
  verificationStatus: string
}

function verifyFact(fact: ExtractedFact): FactVerificationRecord {
  const hasSource = Boolean(fact.sourceUrl && fact.sourceTitle)
  const hasEvidence = Boolean(fact.evidenceId && fact.evidenceText)
  const hasConfidence = fact.confidence === "high" || fact.confidence === "medium"

  const verified = hasSource && hasEvidence && hasConfidence

  let verificationStatus = "Verified against registered evidence and source."

  if (!hasSource) {
    verificationStatus = "Blocked: missing source link."
  } else if (!hasEvidence) {
    verificationStatus = "Blocked: missing registered evidence."
  } else if (!hasConfidence) {
    verificationStatus = "Blocked: confidence too low for factual use."
  }

  return {
    claim: fact.claim,
    evidenceId: fact.evidenceId,
    sourceTitle: fact.sourceTitle,
    sourceUrl: fact.sourceUrl,
    confidence: fact.confidence,
    verified,
    verificationStatus,
    requiresHumanReview: true,
  }
}

export function factVerifier(
  topic: string,
  facts: ExtractedFact[]
): FactVerificationResult {
  const verifications = facts.map(verifyFact)
  const verifiedCount = verifications.filter((record) => record.verified).length
  const unverifiedCount = verifications.length - verifiedCount

  return {
    topic,
    verifications,
    verifiedCount,
    unverifiedCount,
    publicationBlocked: facts.length === 0 || unverifiedCount > 0,
    phase1Rules,
    verificationStatus:
      facts.length === 0
        ? "Publication blocked: no facts to verify."
        : unverifiedCount === 0
        ? "All facts verified against registered evidence. Human review still required."
        : `${unverifiedCount} fact(s) failed verification. Publication blocked.`,
  }
}
