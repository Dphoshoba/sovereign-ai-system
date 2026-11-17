/**
 * Behaviour under test: Mission 006 scripture exclusive-primary classification
 * under EV-REG-SPEC-1.1.0 (Director authorisation — classification only).
 * Module: lib/research/versioned-evidence.ts + claim-source-attribution.ts
 * Existing related: ev-reg-1.1.0-primary-source-publication.test.ts,
 * mission-006r-scripture-reliability.test.ts
 * User instruction: classify accurately cited KJV quote/narrative claims as
 * primary-source supported for the human confirmation pathway; exclude
 * pastoral/interpretation; collapse dual Bible hosts; no auto-confirm.
 */
import { describe, expect, it } from "vitest"
import { EV_REG_SPEC_1_1_0 } from "../../lib/research/audit-specification-compatibility"
import {
  isExclusivePrimaryEligibleScriptureClaim,
  SCRIPTURE_TEXT_IDENTITY,
} from "../../lib/research/claim-source-attribution"
import { evaluateEvReg11PublicationEligibility } from "../../lib/research/primary-source-publication"
import {
  evaluateVersionedClaim,
  versionedCanonicalIdentity,
} from "../../lib/research/versioned-evidence"

const GATEWAY_EX8 =
  "https://www.biblegateway.com/passage/?search=Exodus%208%3A25&version=KJV"
const HUB_EX8 = "https://biblehub.com/exodus/8.htm"
const QUOTE =
  'In Exodus 8:25 (KJV), Pharaoh says, "Go ye, sacrifice to your God in the land."'
const PASSAGE =
  "And Pharaoh called for Moses and for Aaron, and said, Go ye, sacrifice to your God in the land."

describe("Mission 006 scripture primary-source classification", () => {
  it("collapses Bible Gateway and Bible Hub to one scripture-text identity", () => {
    expect(versionedCanonicalIdentity({ url: GATEWAY_EX8 })).toBe(
      SCRIPTURE_TEXT_IDENTITY,
    )
    expect(versionedCanonicalIdentity({ url: HUB_EX8 })).toBe(
      SCRIPTURE_TEXT_IDENTITY,
    )
  })

  it("classifies an accurately cited KJV quotation as primary-source supported", () => {
    expect(isExclusivePrimaryEligibleScriptureClaim(QUOTE)).toBe(true)
    const result = evaluateVersionedClaim({
      claim: QUOTE,
      passages: [
        { url: GATEWAY_EX8, passage: PASSAGE, polarity: "supports" },
      ],
    })
    expect(result.identities).toEqual([SCRIPTURE_TEXT_IDENTITY])
    expect(result.verificationCount).toBe(1)
    expect(result.evidenceState).toBe("primary-source supported")
    expect(result.verificationMethod).toBe("single-source-supported")
    expect(result.publication).toBe("not publish-ready")
  })

  it("does not treat Gateway + Hub as independent corroboration", () => {
    const result = evaluateVersionedClaim({
      claim: QUOTE,
      passages: [
        { url: GATEWAY_EX8, passage: PASSAGE, polarity: "supports" },
        { url: HUB_EX8, passage: PASSAGE, polarity: "supports" },
      ],
    })
    expect(result.verificationCount).toBe(1)
    expect(result.identities).toEqual([SCRIPTURE_TEXT_IDENTITY])
    expect(result.evidenceState).toBe("primary-source supported")
  })

  it("keeps pastoral / theological application out of exclusive primary status", () => {
    const pastoral =
      "Exodus 8:25 (KJV) teaches us that Christians today should compromise with worldly pressure."
    expect(isExclusivePrimaryEligibleScriptureClaim(pastoral)).toBe(false)
    const result = evaluateVersionedClaim({
      claim: pastoral,
      passages: [
        { url: GATEWAY_EX8, passage: PASSAGE, polarity: "supports" },
      ],
    })
    expect(result.evidenceState).not.toBe("primary-source supported")
  })

  it("rejects mismatched verse evidence as unsupported", () => {
    const mismatched =
      "And Moses said, We will go with our young and with our old, with our sons and with our daughters."
    const result = evaluateVersionedClaim({
      claim: QUOTE,
      passages: [
        { url: GATEWAY_EX8, passage: mismatched, polarity: "supports" },
      ],
    })
    expect(result.evidenceState).toBe("unsupported")
    expect(result.verificationCount).toBe(0)
  })

  it("does not auto-confirm: unconfirmed primary-source stays blocked from publish-ready", () => {
    const classified = evaluateVersionedClaim({
      claim: QUOTE,
      passages: [
        { url: GATEWAY_EX8, passage: PASSAGE, polarity: "supports" },
      ],
    })
    expect(classified.evidenceState).toBe("primary-source supported")

    const eligibility = evaluateEvReg11PublicationEligibility({
      auditId: "audit-scripture-1",
      specificationVersion: EV_REG_SPEC_1_1_0,
      consensusScore: 100,
      sourceQualityScore: 83,
      averageVerificationScore: 53,
      facts: [
        {
          claim: QUOTE,
          verificationStatus: "partially verified",
          verificationMethod: "single-source-supported",
          verificationCount: 1,
          verificationScore: 53,
          evidenceState: "primary-source supported",
          sourceUrl: GATEWAY_EX8,
          supportingSources: [
            {
              sourceUrl: GATEWAY_EX8,
              sourceTitle: "BibleGateway Exodus 8 (KJV)",
              evidenceId: "e1",
            },
          ],
        },
      ],
    })
    expect(eligibility.ready).toBe(false)
    expect(eligibility.recommendation).not.toBe("publish-ready")
  })

  it("requires verse-level citation and named translation before exclusive primary", () => {
    expect(
      isExclusivePrimaryEligibleScriptureClaim(
        "In Exodus 8, Pharaoh says, Go ye, sacrifice to your God in the land.",
      ),
    ).toBe(false)
    expect(
      isExclusivePrimaryEligibleScriptureClaim(
        'In Exodus 8:25, Pharaoh says, "Go ye, sacrifice to your God in the land."',
      ),
    ).toBe(false)
  })
})
