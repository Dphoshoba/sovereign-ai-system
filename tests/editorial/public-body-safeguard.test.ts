import { describe, expect, it } from "vitest"
import {
  detectInternalEditorialLeak,
  hasInternalEditorialLeak,
  publicBodyLeakBlockReason,
  stripInternalEditorialCommentary,
} from "../../lib/editorial/public-body-safeguard"
import { publicBodyPublicationBlockReason } from "../../lib/publishing/publication-guard"

const CLEAN_ARTICLE = `
# Faithful Work in an Age of Automation

Scholars debate how far automation can go without crowding out human judgment.
Some findings remain uncertain, and careful readers should weigh competing studies.

## What the research shows

A measured reading of the evidence points to modest productivity gains when
editors keep final authority. AI-generated content could be incorrect, so verify
summaries against the primary source.

## Practical application

Keep a short review checklist, cite Scripture where it guides vocation, and
publish only after a human signs off.

## Conclusion

Automation can serve the work; it must not replace accountable judgment.
`.trim()

const LEAKY_ARTICLE = `
# Faithful Work in an Age of Automation

Scholars debate how far automation can go without crowding out human judgment.

## What the research shows

Evidence remains mixed across populations.

## Unresolved concerns

- Fingerprint association still needs Director confirmation.
- Source quality score below gate.

## Audit fingerprint

contentFingerprint: abcdef1234567890

## Verification status

Current audit is review-required, not publish-ready.

## Internal source-comparison notes

NIST page thinner than Phil paper; prefer DOI link.

## AI-generated editorial assessment

Recommend rewrite of section 2 before approve.

## Approval recommendation

Recommend: publish-ready after cosmetic edits.

## Conversation between AI agents and the Director

Agent: Should we save this draft?
Director: Hold for evidence.

## Internal workflow commentary

HOLD: audit completed but not publish-ready.

## Instructions to save

Please save this article after the Director signs off.

## Practical application

Keep human review.

## Conclusion

Automation can serve the work.
`.trim()

describe("public-body editorial safeguard", () => {
  it("keeps legitimate uncertainty and product caveats in article voice", () => {
    expect(hasInternalEditorialLeak(CLEAN_ARTICLE)).toBe(false)
    expect(detectInternalEditorialLeak(CLEAN_ARTICLE)).toEqual([])
    expect(publicBodyLeakBlockReason(CLEAN_ARTICLE)).toBeNull()
    expect(publicBodyPublicationBlockReason(CLEAN_ARTICLE)).toBeNull()
  })

  it("detects internal editorial / audit leak sections", () => {
    const findings = detectInternalEditorialLeak(LEAKY_ARTICLE)
    const kinds = findings.map((finding) => finding.kind)

    expect(kinds).toEqual(
      expect.arrayContaining([
        "unresolved_concerns",
        "audit_fingerprint",
        "verification_status",
        "source_comparison",
        "editorial_assessment",
        "approval_recommendation",
        "workflow_instruction",
        "agent_director_conversation",
        "internal_workflow_commentary",
      ]),
    )
    expect(publicBodyLeakBlockReason(LEAKY_ARTICLE)).toContain(
      "internal editorial or audit commentary",
    )
    expect(publicBodyPublicationBlockReason(LEAKY_ARTICLE)).toContain(
      "Unresolved concerns",
    )
  })

  it("does not flag ordinary discussion of AI-generated product content", () => {
    const body = [
      "Microsoft says AI-generated content could be incorrect.",
      "Scholars debate the scope of those findings.",
      "Verification of claims against primary sources remains essential.",
    ].join("\n\n")

    expect(hasInternalEditorialLeak(body)).toBe(false)
  })

  it("strips leak sections while preserving reader-facing prose", () => {
    const cleaned = stripInternalEditorialCommentary(LEAKY_ARTICLE)

    expect(hasInternalEditorialLeak(cleaned)).toBe(false)
    expect(cleaned).toContain("Scholars debate how far automation can go")
    expect(cleaned).toContain("## What the research shows")
    expect(cleaned).toContain("## Practical application")
    expect(cleaned).toContain("## Conclusion")
    expect(cleaned).not.toContain("Unresolved concerns")
    expect(cleaned).not.toContain("contentFingerprint")
    expect(cleaned).not.toContain("Conversation between AI agents")
    expect(cleaned).not.toContain("Please save this article")
  })

  it("treats empty content as clear (no false positive)", () => {
    expect(hasInternalEditorialLeak(null)).toBe(false)
    expect(hasInternalEditorialLeak("")).toBe(false)
    expect(publicBodyLeakBlockReason(undefined)).toBeNull()
  })
})
