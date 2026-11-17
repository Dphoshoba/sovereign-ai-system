/**
 * Behaviour under test: EV-BIBLE-AUTHORITY-001 Biblical Editorial Evidence Profile
 * under EV-REG-SPEC-1.1.0 (permanent scripture standard).
 * Module: lib/research/biblical-editorial-evidence-profile.ts,
 * versioned-evidence.ts, consensus-engine.ts, primary-source-publication.ts
 * Existing related: mission-006-scripture-primary-source-classification.test.ts
 * User instruction: permanent regression tests for KJV quotes, mismatches,
 * "we must" in Scripture, multi-verse contrasts, pastoral vs fact, dual hosts,
 * SQ, confirmation, and non-Exodus reuse.
 */
import { describe, expect, it } from "vitest"
import { EV_REG_SPEC_1_1_0 } from "../../lib/research/audit-specification-compatibility"
import {
  classifyBiblicalClaimCategory,
  isBiblicalTeachingArticle,
  isCategoryBInterpretationClaim,
  isExclusivePrimaryEligibleScriptureClaim,
  SCRIPTURE_EDITION_AUTHORITY_SCORE,
  SCRIPTURE_KJV_IDENTITY,
} from "../../lib/research/biblical-editorial-evidence-profile"
import { consensusEngine } from "../../lib/research/consensus-engine"
import type { VerifiedFact } from "../../lib/research/fact-verification-engine"
import {
  claimTextChecksum,
  evaluateEvReg11PublicationEligibility,
} from "../../lib/research/primary-source-publication"
import { researchPublicationBlockReason } from "../../lib/publishing/publication-guard"
import {
  evaluateVersionedClaim,
  versionedCanonicalIdentity,
} from "../../lib/research/versioned-evidence"

const GATEWAY_EX =
  "https://www.biblegateway.com/passage/?search=Exodus%2010&version=KJV"
const HUB_EX = "https://biblehub.com/exodus/10.htm"
const GATEWAY_JN =
  "https://www.biblegateway.com/passage/?search=John%203%3A16&version=KJV"
const GATEWAY_NIV =
  "https://www.biblegateway.com/passage/?search=John%203%3A16&version=NIV"

function fact(
  claim: string,
  urls: string[],
  status: VerifiedFact["verificationStatus"] = "partially verified",
): VerifiedFact {
  const primary = urls[0] ?? GATEWAY_EX
  return {
    claim,
    evidenceId: "e0",
    sourceTitle: "Scripture",
    sourceUrl: primary,
    sourceType: "scripture-reference",
    evidenceText: claim,
    confidence: "medium",
    requiresHumanReview: false,
    verificationStatus: status,
    verificationScore: 61,
    verificationMethod: "single-source-supported",
    verificationCount: 1,
    supportingSources: urls.map((sourceUrl, i) => ({
      sourceUrl,
      sourceTitle: "Scripture",
      evidenceId: `e${i}`,
    })),
  }
}

describe("EV-BIBLE-AUTHORITY-001 permanent scripture profile", () => {
  it("detects biblical teaching by category and scripture sources", () => {
    expect(isBiblicalTeachingArticle({ category: "bible-stories" })).toBe(true)
    expect(
      isBiblicalTeachingArticle({
        category: "ai-tools",
        sourceTypes: ["scripture-reference"],
      }),
    ).toBe(true)
    expect(isBiblicalTeachingArticle({ category: "ai-tools" })).toBe(false)
  })

  it("collapses Gateway + Hub to scripture:kjv and keeps NIV distinct", () => {
    expect(versionedCanonicalIdentity({ url: GATEWAY_EX })).toBe(
      SCRIPTURE_KJV_IDENTITY,
    )
    expect(versionedCanonicalIdentity({ url: HUB_EX })).toBe(
      SCRIPTURE_KJV_IDENTITY,
    )
    expect(versionedCanonicalIdentity({ url: GATEWAY_NIV })).toBe("scripture:niv")
  })

  it("classifies accurate KJV quotations as primary-source supported", () => {
    const claim =
      'In Exodus 8:25 (KJV), Pharaoh says, "Go ye, sacrifice to your God in the land."'
    const passage =
      "And Pharaoh called for Moses and for Aaron, and said, Go ye, sacrifice to your God in the land."
    const result = evaluateVersionedClaim({
      claim,
      passages: [{ url: GATEWAY_EX, passage, polarity: "supports" }],
    })
    expect(result.evidenceState).toBe("primary-source supported")
    expect(result.identities).toEqual([SCRIPTURE_KJV_IDENTITY])
    expect(result.verificationCount).toBe(1)
  })

  it("does not reject KJV quotations containing we must / we should", () => {
    const claim =
      'Moses answers, "We will go with our young and with our old, with our sons and with our daughters, with our flocks and with our herds will we go; for we must hold a feast unto the Lord" (Exodus 10:9 KJV).'
    expect(isCategoryBInterpretationClaim(claim)).toBe(false)
    expect(isExclusivePrimaryEligibleScriptureClaim(claim)).toBe(true)
    const result = evaluateVersionedClaim({
      claim,
      passages: [
        {
          url: GATEWAY_EX,
          passage:
            "And Moses said, We will go with our young and with our old, with our sons and with our daughters, with our flocks and with our herds will we go; for we must hold a feast unto the Lord.",
          polarity: "supports",
        },
      ],
    })
    expect(result.evidenceState).toBe("primary-source supported")
  })

  it("classifies faithful multi-verse contrast as Category A primary-source", () => {
    const claim =
      "Moses' stated company includes sons and daughters (Exodus 10:9); Pharaoh's reply limits the going to the men (Exodus 10:11)."
    expect(classifyBiblicalClaimCategory(claim)).toBe("A")
    const passage =
      "And Moses said, We will go with our young and with our old, with our sons and with our daughters. And Pharaoh said, Not so: go now ye that are men, and serve the Lord; for that ye did desire."
    const result = evaluateVersionedClaim({
      claim,
      passages: [
        { url: GATEWAY_EX, passage, polarity: "supports" },
        { url: HUB_EX, passage, polarity: "supports" },
      ],
    })
    expect(result.verificationCount).toBe(1)
    expect(result.evidenceState).toBe("primary-source supported")
  })

  it("allows translation identification from the KJV source URL", () => {
    const claim =
      "Moses answers with the need for sacrifices and burnt offerings, and that the cattle also shall go (Exodus 10:25–26)."
    const passage =
      "And Moses said, Thou must give us also sacrifices and burnt offerings, that we may sacrifice unto the Lord our God. Our cattle also shall go with us;"
    const passages = [{ url: GATEWAY_EX, passage, polarity: "supports" as const }]
    expect(
      isExclusivePrimaryEligibleScriptureClaim(claim, { passages }),
    ).toBe(true)
    expect(evaluateVersionedClaim({ claim, passages }).evidenceState).toBe(
      "primary-source supported",
    )
  })

  it("rejects pastoral interpretation presented as biblical fact", () => {
    const claim =
      "Exodus 8:25 (KJV) teaches us that Christians today should compromise with worldly pressure."
    expect(classifyBiblicalClaimCategory(claim)).toBe("B")
    expect(isExclusivePrimaryEligibleScriptureClaim(claim)).toBe(false)
    const result = evaluateVersionedClaim({
      claim,
      passages: [
        {
          url: GATEWAY_EX,
          passage: "Go ye, sacrifice to your God in the land.",
          polarity: "supports",
        },
      ],
    })
    expect(result.evidenceState).not.toBe("primary-source supported")
  })

  it("rejects mismatched verse wording as unsupported", () => {
    const claim =
      'In Exodus 8:25 (KJV), Pharaoh says, "Go ye, sacrifice to your God in the land."'
    const result = evaluateVersionedClaim({
      claim,
      passages: [
        {
          url: GATEWAY_EX,
          passage:
            "And Moses said, We will go with our young and with our old, with our sons and with our daughters.",
          polarity: "supports",
        },
      ],
    })
    expect(result.evidenceState).toBe("unsupported")
  })

  it("rejects incorrect translation attribution for KJV claims on NIV hosts", () => {
    const claim =
      'John 3:16 (KJV) records, "For God so loved the world, that he gave his only begotten Son."'
    const result = evaluateVersionedClaim({
      claim,
      passages: [
        {
          url: GATEWAY_NIV,
          passage:
            "For God so loved the world that he gave his one and only Son.",
          polarity: "supports",
        },
      ],
    })
    expect(result.evidenceState).toBe("unsupported")
  })

  it("reuses the standard on a non-Exodus passage (John 3:16)", () => {
    const claim =
      'John 3:16 (KJV) records, "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life."'
    const passage =
      "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life."
    const result = evaluateVersionedClaim({
      claim,
      passages: [{ url: GATEWAY_JN, passage, polarity: "supports" }],
    })
    expect(result.evidenceState).toBe("primary-source supported")
  })

  it("keeps Category C external facts off the scripture exclusive pathway", () => {
    const claim =
      "Archaeological excavations near Pi-Ramesses report a 19th-century BC inscription discovered by researchers."
    expect(classifyBiblicalClaimCategory(claim)).toBe("C")
    expect(isExclusivePrimaryEligibleScriptureClaim(claim)).toBe(false)
  })

  it("assigns documented scripture edition authority for source-quality", () => {
    const result = consensusEngine([
      fact("Exodus 10:9 (KJV) quotation.", [GATEWAY_EX]),
      fact("Exodus 10:11 (KJV) quotation.", [HUB_EX]),
    ])
    expect(result.sourceQualityScore).toBe(SCRIPTURE_EDITION_AUTHORITY_SCORE)
    expect(result.sourceQualityScore).toBeGreaterThanOrEqual(70)
  })

  it("does not auto-confirm or publish unconfirmed primary-source claims", () => {
    const claim =
      'John 3:16 (KJV) records, "For God so loved the world, that he gave his only begotten Son."'
    const eligibility = evaluateEvReg11PublicationEligibility({
      auditId: "audit-bible-1",
      specificationVersion: EV_REG_SPEC_1_1_0,
      consensusScore: 100,
      sourceQualityScore: SCRIPTURE_EDITION_AUTHORITY_SCORE,
      averageVerificationScore: 61,
      facts: [
        {
          claim,
          verificationStatus: "partially verified",
          verificationMethod: "single-source-supported",
          verificationCount: 1,
          verificationScore: 61,
          evidenceState: "primary-source supported",
          sourceUrl: GATEWAY_JN,
          supportingSources: [{ sourceUrl: GATEWAY_JN, sourceTitle: "KJV" }],
        },
      ],
    })
    expect(eligibility.ready).toBe(false)
    expect(
      researchPublicationBlockReason({
        id: "audit-bible-1",
        specificationVersion: EV_REG_SPEC_1_1_0,
        disputes: [],
        engineRevision: "article-grounded-ev-reg-1",
        consensusScore: 100,
        sourceQualityScore: SCRIPTURE_EDITION_AUTHORITY_SCORE,
        averageVerificationScore: 61,
        publicationRecommendation: "review-required",
        facts: [
          {
            claim,
            verificationStatus: "partially verified",
            verificationMethod: "single-source-supported",
            verificationCount: 1,
            verificationScore: 61,
            evidenceState: "primary-source supported",
            sourceUrl: GATEWAY_JN,
            supportingSources: [{ sourceUrl: GATEWAY_JN }],
            primarySourceConfirmation: {
              claimChecksum: claimTextChecksum(claim),
              decision: "confirmed",
              decidedBy: "editor@example.com",
              decidedAt: "2026-11-17T00:00:00.000Z",
              primarySourceUrl: GATEWAY_JN,
              rationale: "Matches KJV.",
              auditId: "wrong-audit",
            },
          },
        ],
      }),
    ).not.toBeNull()
  })

  it("allows publish-ready only when confirmed primary-source + SQ threshold hold", () => {
    const claim =
      'John 3:16 (KJV) records, "For God so loved the world, that he gave his only begotten Son."'
    const facts = [
      {
        claim,
        verificationStatus: "partially verified" as const,
        verificationMethod: "single-source-supported" as const,
        verificationCount: 1,
        verificationScore: 61,
        evidenceState: "primary-source supported",
        sourceUrl: GATEWAY_JN,
        supportingSources: [{ sourceUrl: GATEWAY_JN, sourceTitle: "KJV" }],
        primarySourceConfirmation: {
          claimChecksum: claimTextChecksum(claim),
          decision: "confirmed" as const,
          decidedBy: "editor@example.com",
          decidedAt: "2026-11-17T00:00:00.000Z",
          primarySourceUrl: GATEWAY_JN,
          rationale: "Matches KJV wording.",
          auditId: "audit-bible-2",
        },
      },
    ]
    const eligibility = evaluateEvReg11PublicationEligibility({
      auditId: "audit-bible-2",
      specificationVersion: EV_REG_SPEC_1_1_0,
      consensusScore: 61,
      sourceQualityScore: SCRIPTURE_EDITION_AUTHORITY_SCORE,
      averageVerificationScore: 61,
      facts,
    })
    expect(eligibility.ready).toBe(true)
    expect(eligibility.usesPrimarySourcePathway).toBe(true)
  })
})
