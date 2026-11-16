/**
 * Behaviour under test: EV-REG-SPEC-1.1.0 primary-source + confirmation
 * publication eligibility (Director Option A + §3.4 redline).
 * Module: lib/research/primary-source-publication.ts + publication-guard.
 * Existing related tests: publication-guard.test.ts, ev-reg-spec-1.0.0-*.test.ts
 * (none cover the 1.1.0 primary-source confirmation pathway).
 * User instruction: implement versioned EV-REG-SPEC-1.1.0 with regression tests;
 * independence thresholds must not disqualify confirmed primary-source claims.
 */
import { describe, expect, it } from "vitest"
import { EV_REG_SPEC_1_1_0 } from "../../lib/research/audit-specification-compatibility"
import { VERSIONED_RESEARCH_AUDIT_ENGINE_REVISION } from "../../lib/research/research-audit-engine-revision"
import {
  claimTextChecksum,
  evaluateEvReg11PublicationEligibility,
} from "../../lib/research/primary-source-publication"
import { researchPublicationBlockReason } from "../../lib/publishing/publication-guard"

const AUDIT_ID = "audit-primary-1"

function primaryFact(claim: string, url: string, confirmed = false) {
  return {
    claim,
    verificationStatus: "partially verified",
    verificationMethod: "single-source-supported",
    verificationCount: 1,
    verificationScore: 53,
    evidenceState: "primary-source supported",
    sourceUrl: url,
    supportingSources: [{ sourceUrl: url, sourceTitle: "Primary", evidenceId: "e1" }],
    primarySourceConfirmation: confirmed
      ? {
          claimChecksum: claimTextChecksum(claim),
          decision: "confirmed" as const,
          decidedBy: "editor@example.com",
          decidedAt: "2026-11-16T00:00:00.000Z",
          primarySourceUrl: url,
          rationale: "Matches vendor documentation.",
          auditId: AUDIT_ID,
        }
      : undefined,
  }
}

function independentFact(claim: string) {
  return {
    claim,
    verificationStatus: "verified",
    verificationMethod: "exact",
    verificationCount: 2,
    verificationScore: 85,
    evidenceState: "independently corroborated",
    sourceUrl: "https://www.nist.gov/a",
    supportingSources: [
      { sourceUrl: "https://help.zapier.com/a", sourceTitle: "Zapier", evidenceId: "z1" },
      { sourceUrl: "https://developers.openai.com/a", sourceTitle: "OpenAI", evidenceId: "o1" },
    ],
  }
}

describe("EV-REG-SPEC-1.1.0 primary-source publication", () => {
  it("allows publish-ready when every claim is confirmed primary-source despite low independence scores", () => {
    const facts = [
      primaryFact(
        "Zapier's ChatGPT setup guide lists Conversation as recommended.",
        "https://help.zapier.com/hc/en-us/articles/14860148802829",
        true,
      ),
      primaryFact(
        "The NIST Generative AI Profile identifies generative AI risks that include confabulation.",
        "https://nvlpubs.nist.gov/nistpubs/AI/NIST.AI.600-1.pdf",
        true,
      ),
    ]

    const eligibility = evaluateEvReg11PublicationEligibility({
      auditId: AUDIT_ID,
      specificationVersion: EV_REG_SPEC_1_1_0,
      consensusScore: 78,
      sourceQualityScore: 83,
      averageVerificationScore: 47,
      facts,
    })
    expect(eligibility.ready).toBe(true)
    expect(eligibility.recommendation).toBe("publish-ready")
    expect(eligibility.usesPrimarySourcePathway).toBe(true)
    expect(eligibility.usesIndependentPathway).toBe(false)

    expect(
      researchPublicationBlockReason({
        id: AUDIT_ID,
        specificationVersion: EV_REG_SPEC_1_1_0,
        disputes: [],
        engineRevision: VERSIONED_RESEARCH_AUDIT_ENGINE_REVISION,
        consensusScore: 78,
        sourceQualityScore: 83,
        averageVerificationScore: 47,
        publicationRecommendation: "publish-ready",
        facts,
      }),
    ).toBeNull()
  })

  it("blocks unconfirmed primary-source claims", () => {
    const facts = [
      primaryFact(
        "Zapier's ChatGPT setup guide requires prepaid billing.",
        "https://help.zapier.com/hc/en-us/articles/14860148802829",
        false,
      ),
    ]
    const eligibility = evaluateEvReg11PublicationEligibility({
      auditId: AUDIT_ID,
      specificationVersion: EV_REG_SPEC_1_1_0,
      consensusScore: 90,
      sourceQualityScore: 83,
      averageVerificationScore: 90,
      facts,
    })
    expect(eligibility.ready).toBe(false)
    expect(eligibility.reason).toMatch(/confirmation/i)
  })

  it("blocks unsupported claims even when other claims are confirmed", () => {
    const facts = [
      primaryFact(
        "Zapier's documentation describes Conversation as powered by the OpenAI Responses API.",
        "https://help.zapier.com/hc/en-us/articles/44865998484365",
        true,
      ),
      {
        claim: "Invented statistic shows 90% productivity gains.",
        verificationStatus: "unverified",
        verificationMethod: "single-source-supported",
        verificationCount: 0,
        verificationScore: 0,
        evidenceState: "unsupported",
        sourceUrl: "",
        supportingSources: [],
      },
    ]
    expect(
      evaluateEvReg11PublicationEligibility({
        auditId: AUDIT_ID,
        specificationVersion: EV_REG_SPEC_1_1_0,
        consensusScore: 90,
        sourceQualityScore: 83,
        averageVerificationScore: 40,
        facts,
      }).ready,
    ).toBe(false)
  })

  it("keeps independent-corroboration thresholds when any claim uses that pathway", () => {
    const facts = [
      independentFact("Zapier and OpenAI both document Responses API usage."),
      primaryFact(
        "Zapier's ChatGPT setup guide lists Conversation as recommended.",
        "https://help.zapier.com/hc/en-us/articles/14860148802829",
        true,
      ),
    ]
    expect(
      evaluateEvReg11PublicationEligibility({
        auditId: AUDIT_ID,
        specificationVersion: EV_REG_SPEC_1_1_0,
        consensusScore: 78,
        sourceQualityScore: 83,
        averageVerificationScore: 70,
        facts,
      }).ready,
    ).toBe(false)

    expect(
      evaluateEvReg11PublicationEligibility({
        auditId: AUDIT_ID,
        specificationVersion: EV_REG_SPEC_1_1_0,
        consensusScore: 80,
        sourceQualityScore: 83,
        averageVerificationScore: 80,
        facts,
      }).ready,
    ).toBe(true)
  })

  it("does not mutate reported scores when evaluating eligibility", () => {
    const facts = [
      primaryFact(
        "Zapier's older Assistants API-based actions reached their announced end-of-service date on 26 August 2026.",
        "https://help.zapier.com/hc/en-us/articles/44865998484365",
        true,
      ),
    ]
    const input = {
      auditId: AUDIT_ID,
      specificationVersion: EV_REG_SPEC_1_1_0,
      consensusScore: 78,
      sourceQualityScore: 83,
      averageVerificationScore: 47,
      facts,
    }
    evaluateEvReg11PublicationEligibility(input)
    expect(input.consensusScore).toBe(78)
    expect(input.sourceQualityScore).toBe(83)
    expect(input.averageVerificationScore).toBe(47)
    expect(facts[0].verificationScore).toBe(53)
  })
})
