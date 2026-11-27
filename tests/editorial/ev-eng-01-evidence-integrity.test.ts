/**
 * EV-ENG-01 — Evidence verification integrity remediation.
 * Tip baseline: 918b8447. Mode A inflation (mirror sourceCount) + Mode B passage matching.
 * Does not lower publish thresholds or engineer predetermined publish-ready.
 */
import { describe, expect, it } from "vitest";
import { assessPassageSupport } from "../../lib/research/article-claim-extractor";
import {
  scriptureCanonicalIdentity,
  SCRIPTURE_EDITION_AUTHORITY_SCORE,
} from "../../lib/research/biblical-editorial-evidence-profile";
import {
  evidenceCorroborationKey,
  independentDocumentKey,
  isPrimaryScriptureClaim,
  resolveClaimSourceBinding,
} from "../../lib/research/claim-source-attribution";
import { consensusEngine } from "../../lib/research/consensus-engine";
import type { VerifiedFact } from "../../lib/research/fact-verification-engine";

const GW_COL =
  "https://www.biblegateway.com/passage/?search=Colossians%203%3A23-24&version=ESV";
const HUB_COL = "https://biblehub.com/esv/colossians/3.htm";
const GW_THESS =
  "https://www.biblegateway.com/passage/?search=1%20Thessalonians%204%3A11-12&version=ESV";
const HUB_THESS = "https://biblehub.com/esv/1_thessalonians/4.htm";

function fact(
  claim: string,
  urls: string[],
  status: VerifiedFact["verificationStatus"] = "partially verified",
): VerifiedFact {
  const primary = urls[0] ?? GW_COL;
  return {
    claim,
    evidenceId: "e0",
    sourceTitle: "Scripture",
    sourceUrl: primary,
    sourceType: "primary-scripture",
    evidenceText: claim,
    confidence: "medium",
    requiresHumanReview: true,
    verificationStatus: status,
    verificationScore: status === "unverified" ? 0 : 60,
    verificationMethod: "single-source-supported",
    verificationCount: status === "unverified" ? 0 : 1,
    supportingSources: urls.map((sourceUrl, i) => ({
      sourceUrl,
      sourceTitle: "Scripture",
      evidenceId: `e${i}`,
    })),
  };
}

describe("EV-ENG-01 P1 scripture mirror collapse", () => {
  it("collapses Gateway + Hub same-passage ESV URLs; keeps chapters distinct", () => {
    expect(scriptureCanonicalIdentity({ url: GW_COL })).toBe("scripture:esv");
    expect(scriptureCanonicalIdentity({ url: HUB_COL })).toBe("scripture:esv");
    expect(independentDocumentKey(GW_COL)).toBe(
      "scripture:esv:colossians-3",
    );
    expect(independentDocumentKey(HUB_COL)).toBe(
      "scripture:esv:colossians-3",
    );
    expect(independentDocumentKey(GW_COL)).not.toBe(
      independentDocumentKey(GW_THESS),
    );
    expect(
      evidenceCorroborationKey("Colossians 3:23-24 (ESV)", { url: GW_COL }),
    ).toBe("scripture:esv:colossians-3");
    expect(
      evidenceCorroborationKey("Colossians 3:23-24 (ESV)", { url: HUB_COL }),
    ).toBe("scripture:esv:colossians-3");
  });

  it("Mode A: Hub+Gateway pairs no longer inflate sourceCount to 2", () => {
    const result = consensusEngine([
      fact(
        "According to Colossians 3 (ESV) Bible Gateway, faith and courage in ordinary labour for the Lord",
        [GW_COL],
      ),
      fact(
        "According to Colossians 3 (ESV) Bible Hub, faith and courage in ordinary labour for the Lord",
        [HUB_COL],
      ),
      fact(
        "According to 1 Thessalonians 4 (ESV) Bible Gateway, aspire to live quietly and work with your hands",
        [GW_THESS],
      ),
      fact(
        "According to 1 Thessalonians 4 (ESV) Bible Hub, aspire to live quietly and work with your hands",
        [HUB_THESS],
      ),
    ]);
    for (const group of result.consensusGroups) {
      expect(group.sourceCount).toBe(1);
    }
    expect(result.sourceQualityScore).toBe(SCRIPTURE_EDITION_AUTHORITY_SCORE);
    // Tip 918b8447 already blocks false publish-ready via avgVerification / single-source.
    expect(result.publicationRecommendation).not.toBe("publish-ready");
    expect(result.verifiedFacts).toBe(0);
  });
});

describe("EV-ENG-01 P2 quote-span-first passage support", () => {
  const esvCol =
    "Whatever you do, work heartily, as for the Lord and not for men, knowing that from the Lord you will receive the inheritance as your reward. You are serving the Lord Christ.";

  it("supports long pastoral Colossians claim via quoted span", () => {
    const claim =
      "Paul speaks inside household instructions, addressing bondservants and then masters: “Whatever you do, work heartily, as for the Lord and not for men, knowing that from the Lord you will receive the inheritance as your reward. You are serving the Lord Christ” (Colossians 3:23-24, ESV).";
    const assessment = assessPassageSupport(claim, esvCol, {
      documentKind: "html",
    });
    expect(assessment.supported).toBe(true);
    expect(assessment.failureReason).toBe("supported");
  });

  it("supports short Mark carpenter quote", () => {
    const assessment = assessPassageSupport(
      "Even the Lord Jesus was known in His hometown as “the carpenter” (Mark 6:3, ESV).",
      "Is not this the carpenter, the son of Mary and brother of James and Joses and Judas and Simon? And are not his sisters here with us?",
      { documentKind: "html" },
    );
    expect(assessment.supported).toBe(true);
  });

  it("supports ellipsis-normalised Genesis quote", () => {
    const assessment = assessPassageSupport(
      "“God created man in his own image… male and female he created them” (Genesis 1:27, ESV).",
      "So God created man in his own image, in the image of God he created him; male and female he created them.",
      { documentKind: "html" },
    );
    expect(assessment.supported).toBe(true);
  });

  it("still rejects chrome-only passages", () => {
    const assessment = assessPassageSupport(
      "“The Lord God took the man and put him in the garden of Eden to work it and keep it” (Genesis 2:15, ESV).",
      "Please enable JavaScript. Cookie settings. Skip to main content. Privacy policy. Subscribe to our newsletter.",
      { documentKind: "html" },
    );
    expect(assessment.supported).toBe(false);
    expect(assessment.failureReason).toBe("chrome");
  });

  it("does not fabricate support for mismatched wording", () => {
    const assessment = assessPassageSupport(
      "“Whatever you do, work heartily, as for the Lord and not for men” (Colossians 3:23, ESV).",
      "In the beginning, God created the heavens and the earth.",
      { documentKind: "html" },
    );
    expect(assessment.supported).toBe(false);
  });
});

describe("EV-ENG-01 P3 dynamic biblical authority binding", () => {
  it("binds Colossians / Genesis / Mark / Zechariah forms beyond 1 Samuel 17", () => {
    const listed = [
      {
        url: GW_COL,
        title: "Colossians 3:23-24 (ESV) Bible Gateway",
      },
      {
        url: "https://www.biblegateway.com/passage/?search=Genesis%202%3A15&version=ESV",
        title: "Genesis 2:15 (ESV) Bible Gateway",
      },
      {
        url: "https://www.biblegateway.com/passage/?search=Mark%206%3A3&version=ESV",
        title: "Mark 6:3 (ESV) Bible Gateway",
      },
      {
        url: "https://www.biblegateway.com/passage/?search=Zechariah%204%3A10&version=ESV",
        title: "Zechariah 4:10 (ESV) Bible Gateway",
      },
    ];
    const col =
      "“Whatever you do, work heartily, as for the Lord and not for men” (Colossians 3:23-24, ESV).";
    const gen =
      "“The Lord God took the man and put him in the garden of Eden to work it and keep it” (Genesis 2:15, ESV).";
    const mark =
      "Even the Lord Jesus was known in His hometown as “the carpenter” (Mark 6:3, ESV).";
    const zech =
      "“For whoever has despised the day of small things shall rejoice” (Zechariah 4:10, ESV).";

    expect(isPrimaryScriptureClaim(col)).toBe(true);
    expect(isPrimaryScriptureClaim(gen)).toBe(true);
    expect(isPrimaryScriptureClaim(mark)).toBe(true);
    expect(isPrimaryScriptureClaim(zech)).toBe(true);
    expect(
      isPrimaryScriptureClaim("According to 1 Samuel 17, David kept sheep."),
    ).toBe(true);

    expect(resolveClaimSourceBinding(col, listed).role).toBe(
      "primary-scripture",
    );
    expect(resolveClaimSourceBinding(gen, listed).role).toBe(
      "primary-scripture",
    );
    expect(resolveClaimSourceBinding(mark, listed).role).toBe(
      "primary-scripture",
    );
    expect(resolveClaimSourceBinding(zech, listed).role).toBe(
      "primary-scripture",
    );
    expect(resolveClaimSourceBinding(col, listed).exclusiveDocumentKey).toBe(
      "colossians-3",
    );
    expect(resolveClaimSourceBinding(gen, listed).exclusiveDocumentKey).toBe(
      "genesis-2",
    );
    expect(resolveClaimSourceBinding(zech, listed).exclusiveDocumentKey).toBe(
      "zechariah-4",
    );

    const paraphrase =
      "He tells Saul he has kept sheep, and that the Lord delivered him from lion and bear (1 Samuel 17:34–37, ESV).";
    expect(isPrimaryScriptureClaim(paraphrase)).toBe(true);
    expect(
      resolveClaimSourceBinding(paraphrase, [
        {
          url: "https://www.biblegateway.com/passage/?search=1%20Samuel%2017%3A34-37&version=ESV",
          title: "1 Samuel 17:34-37 (ESV)",
        },
      ]).role,
    ).toBe("primary-scripture");
  });
});

describe("EV-ENG-01 P4 aggregation integrity", () => {
  it("nine empty-support facts stay review-required at 0/0", () => {
    const facts = Array.from({ length: 9 }, (_, i) =>
      fact(`Unverified claim ${i + 1}`, [], "unverified"),
    );
    const result = consensusEngine(facts);
    expect(result.consensusScore).toBe(0);
    expect(result.sourceQualityScore).toBe(0);
    expect(result.unverifiedFacts).toBe(9);
    expect(result.publicationRecommendation).toBe("review-required");
  });

  it("preserves publish thresholds (80/70) and does not auto-promote partials", () => {
    const result = consensusEngine([
      fact("Single Gateway Colossians partial", [GW_COL]),
    ]);
    expect(result.publicationRecommendation).not.toBe("publish-ready");
    expect(result.partiallyVerifiedFacts).toBe(1);
    expect(result.verifiedFacts).toBe(0);
  });
});
