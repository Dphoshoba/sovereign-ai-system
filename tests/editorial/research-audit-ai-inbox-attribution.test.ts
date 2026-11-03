import { describe, expect, it } from "vitest"
import {
  assessPassageSupport,
  passageSupportsClaim,
  verifiableClauses,
} from "../../lib/research/article-claim-extractor"
import { groundedFactVerification } from "../../lib/research/claim-evidence-matcher"
import { selectClaimAwareEvidence } from "../../lib/research/claim-evidence-selector"
import {
  claimAllowsEvidence,
  publishersForSource,
  publishersNamedInClaim,
} from "../../lib/research/claim-source-attribution"
import type { EvidenceChunk } from "../../lib/research/evidence-chunker"
import type { EvidenceRecord } from "../../lib/research/evidence-registry"
import {
  AI_INBOX_CLAIM,
  AI_INBOX_TITLE,
  AI_INBOX_URL,
  HELP_ME_WRITE_CLAIM,
  HELP_ME_WRITE_PASSAGES,
  HELP_ME_WRITE_TITLE,
  HELP_ME_WRITE_URL,
} from "../fixtures/research-audit/article-2-gmail-ai-inbox"

const GENERIC_OVERLAP_TOKENS = new Set(["google", "gmail", "feature"])

const MICROSOFT_URL =
  "https://support.microsoft.com/en-us/outlook/copilot-pages/draft-an-email-message-with-copilot-in-outlook"
const MICROSOFT_TITLE =
  "Draft an email message with Copilot in Outlook | Microsoft Support"

const LISTED_SOURCES = [
  { url: HELP_ME_WRITE_URL, title: HELP_ME_WRITE_TITLE },
  { url: AI_INBOX_URL, title: AI_INBOX_TITLE },
  { url: MICROSOFT_URL, title: MICROSOFT_TITLE },
]

function factualClaim(claim: string) {
  return {
    claim,
    articleExcerpt: claim,
    section: "body" as const,
    blockType: "paragraph" as const,
    kind: "factual" as const,
  }
}

function helpMeWriteEvidence(): EvidenceRecord[] {
  return HELP_ME_WRITE_PASSAGES.map((passage) => ({
    id: passage.id,
    sourceTitle: HELP_ME_WRITE_TITLE,
    sourceUrl: HELP_ME_WRITE_URL,
    sourceType: "html",
    extractedText: passage.extractedText,
    confidence: 80,
    requiresHumanReview: true,
  }))
}

function helpMeWriteChunks(): EvidenceChunk[] {
  return HELP_ME_WRITE_PASSAGES.map((passage) => ({
    id: passage.id,
    text: passage.extractedText,
    wordCount: passage.extractedText.split(/\s+/).filter(Boolean).length,
  }))
}

function clauseSupport(clause: string) {
  const assessments = HELP_ME_WRITE_PASSAGES.map((passage) => ({
    id: passage.id,
    assessment: assessPassageSupport(clause, passage.extractedText),
  }))
  return {
    supportedPassageIds: assessments
      .filter((item) => item.assessment.supported)
      .map((item) => item.id),
    genericOverlapPassageIds: assessments
      .filter(
        (item) =>
          item.assessment.supported &&
          item.assessment.actionTokenMatches.length > 0 &&
          item.assessment.actionTokenMatches.every((token) =>
            GENERIC_OVERLAP_TOKENS.has(token),
          ),
      )
      .map((item) => item.id),
  }
}

describe("Gmail AI Inbox attribution", () => {
  it("rejects Help me write passages for the Gmail AI Inbox claim", () => {
    const clauses = verifiableClauses(AI_INBOX_CLAIM)
    expect(clauses).toHaveLength(2)

    const verification = groundedFactVerification(
      [factualClaim(AI_INBOX_CLAIM)],
      helpMeWriteEvidence(),
      AI_INBOX_CLAIM,
      LISTED_SOURCES,
    )
    const fact = verification.facts[0]
    const selection = selectClaimAwareEvidence({
      claims: [AI_INBOX_CLAIM],
      documents: [
        {
          url: HELP_ME_WRITE_URL,
          title: HELP_ME_WRITE_TITLE,
          sourceType: "html",
          extractedText: HELP_ME_WRITE_PASSAGES.map(
            (passage) => passage.extractedText,
          ).join("\n\n"),
          chunks: helpMeWriteChunks(),
        },
      ],
      listedSources: LISTED_SOURCES,
    })

    expect({
      verificationStatus: fact?.verificationStatus,
      supportingUrls: [
        ...new Set(fact?.supportingSources.map((source) => source.sourceUrl) ?? []),
      ],
      publisherIdentityAloneVerifies:
        publishersNamedInClaim(AI_INBOX_CLAIM).includes("google") &&
        publishersForSource({
          url: HELP_ME_WRITE_URL,
          title: HELP_ME_WRITE_TITLE,
        }).includes("google") &&
        fact?.verificationStatus !== "unverified",
      clauses: clauses.map((clause) => clauseSupport(clause)),
      selectorUrls: [
        ...new Set(selection.evidence.map((record) => record.sourceUrl)),
      ],
    }).toEqual({
      verificationStatus: "unverified",
      supportingUrls: [],
      publisherIdentityAloneVerifies: false,
      clauses: [
        { supportedPassageIds: [], genericOverlapPassageIds: [] },
        { supportedPassageIds: [], genericOverlapPassageIds: [] },
      ],
      selectorUrls: [],
    })
  })

  it("keeps a genuine Help me write claim supported by its official passage", () => {
    expect(
      passageSupportsClaim(
        HELP_ME_WRITE_CLAIM,
        HELP_ME_WRITE_PASSAGES[0].extractedText,
      ),
    ).toBe(true)

    const verification = groundedFactVerification(
      [factualClaim(HELP_ME_WRITE_CLAIM)],
      helpMeWriteEvidence(),
      HELP_ME_WRITE_CLAIM,
      LISTED_SOURCES,
    )
    const fact = verification.facts[0]
    expect(fact?.verificationStatus).toBe("partially verified")
    expect([
      ...new Set(fact?.supportingSources.map((source) => source.sourceUrl) ?? []),
    ]).toEqual([HELP_ME_WRITE_URL])
    expect(fact?.supportingSources.some((source) => source.sourceUrl === AI_INBOX_URL)).toBe(
      false,
    )
  })

  it("keeps a publisher mismatch from supporting a Google claim", () => {
    const microsoft = {
      url: MICROSOFT_URL,
      title: MICROSOFT_TITLE,
    }
    expect(claimAllowsEvidence(AI_INBOX_CLAIM, microsoft, LISTED_SOURCES)).toBe(
      false,
    )
    expect(
      publishersForSource(microsoft).some((publisher) =>
        publishersNamedInClaim(AI_INBOX_CLAIM).includes(publisher),
      ),
    ).toBe(false)

    const verification = groundedFactVerification(
      [factualClaim(AI_INBOX_CLAIM)],
      [
        {
          id: "microsoft-draft-copy",
          sourceTitle: MICROSOFT_TITLE,
          sourceUrl: MICROSOFT_URL,
          sourceType: "html",
          extractedText: AI_INBOX_CLAIM,
          confidence: 80,
          requiresHumanReview: true,
        },
      ],
      AI_INBOX_CLAIM,
      LISTED_SOURCES,
    )
    expect(verification.facts[0]?.verificationStatus).toBe("unverified")
    expect(verification.facts[0]?.supportingSources).toEqual([])
    expect(verification.facts[0]?.matchDiagnostics?.[0]?.failureReason).toBe(
      "publisher-mismatch",
    )
  })
})
