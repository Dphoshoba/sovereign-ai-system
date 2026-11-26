import { describe, expect, it } from "vitest"
import {
  evaluateBiblicalPastoralPublicationEligibility,
  pastoralL2FactSatisfied,
} from "../../lib/research/biblical-pastoral-publication"
import { researchPublicationBlockReason } from "../../lib/publishing/publication-guard"
import { EV_REG_SPEC_1_1_0 } from "../../lib/research/audit-specification-compatibility"
import { claimTextChecksum } from "../../lib/research/primary-source-publication"

const GATEWAY =
  "https://www.biblegateway.com/passage/?search=Philippians%204%3A4-9&version=ESV"

const PASTORAL_CLAIM =
  "Philippians 4 answers that intrusion with God’s peace standing watch over heart and mind in Christ Jesus."

const QUOTE_CLAIM =
  'Philippians 4:7 (ESV) records, "And the peace of God, which surpasses all understanding, will guard your hearts and your minds in Christ Jesus."'

describe("biblical pastoral L2 publication pathway", () => {
  it("treats Peace-style pastoral paraphrase as L2-satisfiable Category B", () => {
    expect(
      pastoralL2FactSatisfied({
        claim: PASTORAL_CLAIM,
        verificationStatus: "partially verified",
        verificationMethod: "single-source-supported",
        verificationCount: 1,
        verificationScore: 61,
        evidenceState: "partially supported",
        sourceUrl: GATEWAY,
        requiresHumanReview: true,
      } as never),
    ).toBe(true)
  })

  it("does not let Category A exclusive-primary skip §9 via L2 alone", () => {
    expect(
      pastoralL2FactSatisfied({
        claim: QUOTE_CLAIM,
        verificationStatus: "partially verified",
        verificationMethod: "single-source-supported",
        verificationCount: 1,
        verificationScore: 61,
        evidenceState: "partially supported",
        sourceUrl: GATEWAY,
      }),
    ).toBe(false)
  })

  it("allows publish when biblical article is L2-approved with Category B partial facts and SQ≥70", () => {
    const audit = {
      id: "audit-peace-1",
      specificationVersion: EV_REG_SPEC_1_1_0,
      sourceQualityScore: 85,
      consensusScore: 59,
      averageVerificationScore: 61,
      unverifiedCount: 0,
      publicationRecommendation: "review-required",
      facts: [
        {
          claim: PASTORAL_CLAIM,
          verificationStatus: "partially verified",
          verificationMethod: "single-source-supported",
          verificationCount: 1,
          verificationScore: 61,
          evidenceState: "partially supported",
          sourceUrl: GATEWAY,
          requiresHumanReview: true,
        },
      ],
      disputes: [],
      engineRevision: "article-grounded-ev-reg-1",
    }

    const eligibility = evaluateBiblicalPastoralPublicationEligibility({
      audit,
      context: {
        articleStatus: "approved",
        approvedAt: "2026-11-25T08:58:33.921Z",
        approvedBy: "davidoshoba@gmail.com",
        category: "bible-stories",
        content: PASTORAL_CLAIM,
        sourceTypes: ["primary-scripture"],
      },
    })
    expect(eligibility.ready).toBe(true)
    expect(eligibility.usesPastoralL2Pathway).toBe(true)

    expect(
      researchPublicationBlockReason(audit, {
        articleStatus: "approved",
        approvedAt: "2026-11-25T08:58:33.921Z",
        approvedBy: "davidoshoba@gmail.com",
        category: "bible-stories",
        content: PASTORAL_CLAIM,
        sourceTypes: ["primary-scripture"],
      }),
    ).toBeNull()
  })

  it("still blocks without documented pastoral approval", () => {
    const audit = {
      id: "audit-peace-2",
      specificationVersion: EV_REG_SPEC_1_1_0,
      sourceQualityScore: 85,
      consensusScore: 59,
      averageVerificationScore: 61,
      unverifiedCount: 0,
      publicationRecommendation: "review-required",
      facts: [
        {
          claim: PASTORAL_CLAIM,
          verificationStatus: "partially verified",
          evidenceState: "partially supported",
          sourceUrl: GATEWAY,
        },
      ],
      disputes: [],
      engineRevision: "article-grounded-ev-reg-1",
    }
    expect(
      researchPublicationBlockReason(audit, {
        articleStatus: "review-required",
        category: "bible-stories",
      }),
    ).toContain("not publish-ready")
  })

  it("still requires §9 confirmation for primary-source supported facts", () => {
    const audit = {
      id: "audit-a-1",
      specificationVersion: EV_REG_SPEC_1_1_0,
      sourceQualityScore: 85,
      consensusScore: 59,
      averageVerificationScore: 61,
      unverifiedCount: 0,
      publicationRecommendation: "review-required",
      facts: [
        {
          claim: QUOTE_CLAIM,
          verificationStatus: "partially verified",
          verificationMethod: "single-source-supported",
          verificationCount: 1,
          verificationScore: 61,
          evidenceState: "primary-source supported",
          sourceUrl: GATEWAY,
          supportingSources: [{ sourceUrl: GATEWAY }],
        },
      ],
      disputes: [],
      engineRevision: "article-grounded-ev-reg-1",
    }
    expect(
      researchPublicationBlockReason(audit, {
        articleStatus: "approved",
        approvedAt: "2026-11-25T08:58:33.921Z",
        approvedBy: "editor@example.com",
        category: "bible-stories",
      }),
    ).not.toBeNull()

    expect(
      researchPublicationBlockReason(
        {
          ...audit,
          publicationRecommendation: "publish-ready",
          facts: [
            {
              ...audit.facts[0],
              primarySourceConfirmation: {
                claimChecksum: claimTextChecksum(QUOTE_CLAIM),
                decision: "confirmed",
                decidedBy: "editor@example.com",
                decidedAt: "2026-11-25T00:00:00.000Z",
                primarySourceUrl: GATEWAY,
                rationale: "Matches ESV.",
                auditId: "audit-a-1",
              },
            },
          ],
        },
        {
          articleStatus: "approved",
          approvedAt: "2026-11-25T08:58:33.921Z",
          approvedBy: "editor@example.com",
          category: "bible-stories",
        },
      ),
    ).toBeNull()
  })
})
