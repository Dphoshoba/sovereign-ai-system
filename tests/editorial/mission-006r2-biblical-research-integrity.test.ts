/**
 * Mission 006R2 — subject-preserving biblical research integrity.
 * Under test: bible-extractor, fact-extractor, claim-source-attribution narrative gate,
 * fact verification + article grounding for Exodus vs David/Goliath fidelity.
 * Existing related tests: mission-006r-scripture-reliability.test.ts (sources only; not extraction).
 * Director: "Create reproducible tests demonstrating: 1…10" and eliminate hard-coded D&G contamination.
 */
import { describe, expect, it, vi } from "vitest";
import {
  bibleExtractor,
  detectBibleSubject,
} from "../../lib/research/bible-extractor";
import {
  biblicalNarrativeAllowsEvidence,
  claimAllowsEvidence,
  resolveClaimSourceBinding,
} from "../../lib/research/claim-source-attribution";
import { extractArticleClaims } from "../../lib/research/article-claim-extractor";
import { factExtractor } from "../../lib/research/fact-extractor";
import { factVerificationEngine } from "../../lib/research/fact-verification-engine";
import { verifyGeneratedArticleAgainstEvidence } from "../../lib/research/ground-generated-article";
import type { EvidenceRecord } from "../../lib/research/evidence-registry";

vi.mock("../../lib/research/search-adapter", () => ({
  searchAdapter: vi.fn(async () => []),
}));

const EXODUS_5_TEXT =
  "And afterward Moses and Aaron went in, and told Pharaoh, Thus saith the Lord God of Israel, Let my people go, that they may hold a feast unto me in the wilderness. And Pharaoh said, Who is the Lord, that I should obey his voice to let Israel go? I know not the Lord, neither will I let Israel go. Let there be more work laid upon the men, that they may labour therein; and let them not regard vain words. Ye shall no more give the people straw to make brick.";

const EXODUS_8_TEXT =
  "And Pharaoh called for Moses and for Aaron, and said, Go ye, sacrifice to your God in the land. And Moses said, It is not meet so to do. And Pharaoh said, I will let you go, that ye may sacrifice to the Lord your God in the wilderness; only ye shall not go very far away.";

const EXODUS_10_TEXT =
  "And Moses and Aaron were brought again unto Pharaoh: and he said unto them, Go, serve the Lord your God: but who are they that shall go? And Moses said, We will go with our young and with our old, with our sons and with our daughters, with our flocks and with our herds. And he said unto them, Go now ye that are men, and serve the Lord; for that ye did desire. And Pharaoh called unto Moses, and said, Go ye, serve the Lord; only let your flocks and your herds be stayed: let your little ones also go with you.";

const SAMUEL_17_TEXT =
  "And there went out a champion out of the camp of the Philistines, named Goliath, of Gath. And David said to Saul, Thy servant will go and fight with this Philistine. Then said David to the Philistine, Thou comest to me with a sword; but I come to thee in the name of the Lord of hosts. So David prevailed over the Philistine with a sling and with a stone.";

function evidence(
  id: string,
  title: string,
  url: string,
  text: string,
): EvidenceRecord {
  return {
    id,
    sourceTitle: title,
    sourceUrl: url,
    sourceType: "scripture-reference",
    extractedText: text,
    confidence: 90,
    requiresHumanReview: true,
  };
}

const EXODUS_EVIDENCE: EvidenceRecord[] = [
  evidence(
    "exodus-5",
    "BibleGateway Exodus 5 (KJV)",
    "https://www.biblegateway.com/passage/?search=Exodus%205&version=KJV",
    EXODUS_5_TEXT,
  ),
  evidence(
    "exodus-8",
    "BibleGateway Exodus 8 (KJV)",
    "https://www.biblegateway.com/passage/?search=Exodus%208&version=KJV",
    EXODUS_8_TEXT,
  ),
  evidence(
    "exodus-10",
    "BibleGateway Exodus 10 (KJV)",
    "https://www.biblegateway.com/passage/?search=Exodus%2010&version=KJV",
    EXODUS_10_TEXT,
  ),
];

const DG_TOPIC = "David and Goliath courage from 1 Samuel 17";
const EXODUS_TOPIC =
  "The Devil's Tactics: Pharaoh's counterplans in Exodus 5, Exodus 8, Exodus 10";

describe("Mission 006R2 biblical research integrity", () => {
  it("1. Exodus 5, 8 and 10 produce relevant Exodus claims", () => {
    const extracted = factExtractor(EXODUS_TOPIC, EXODUS_EVIDENCE, "bible-stories");
    expect(extracted.factCount).toBeGreaterThan(0);
    expect(
      extracted.facts.every((fact) => !/david and goliath|\bgoliath\b/i.test(fact.claim)),
    ).toBe(true);
    expect(
      extracted.facts.some((fact) => /pharaoh|exodus|israel|moses/i.test(fact.claim)),
    ).toBe(true);

    const from5 = bibleExtractor(EXODUS_5_TEXT, EXODUS_TOPIC);
    expect(from5.subject).toBe("exodus-deliverance");
    expect(from5.claims.some((c) => /pharaoh|exodus|israel/i.test(c))).toBe(true);
  });

  it("2. Exodus evidence cannot verify David and Goliath assertions", () => {
    const exodusSource = {
      url: "https://www.biblegateway.com/passage/?search=Exodus%205&version=KJV",
      title: "BibleGateway Exodus 5 (KJV)",
    };
    expect(
      biblicalNarrativeAllowsEvidence(
        "The David and Goliath account highlights trust in God.",
        exodusSource,
      ),
    ).toBe(false);
    expect(
      biblicalNarrativeAllowsEvidence(
        "David volunteers to confront the Philistine.",
        exodusSource,
      ),
    ).toBe(false);
    expect(
      claimAllowsEvidence(
        "David volunteers to confront the Philistine.",
        exodusSource,
        [exodusSource],
      ),
    ).toBe(false);
  });

  it("3. Generic religious vocabulary does not trigger unrelated narratives", () => {
    const generic = bibleExtractor(
      "Trust in the Lord with all thine heart, and lean not unto thine own understanding.",
      "a general devotion on trust",
    );
    expect(generic.subject).toBe("generic");
    expect(generic.claims.every((c) => !/david and goliath|\bgoliath\b/i.test(c))).toBe(
      true,
    );
    expect(generic.claims).toEqual([]);

    const israelOnly = bibleExtractor(
      "The Lord God of Israel is faithful to His covenant people.",
      "covenant faithfulness study",
    );
    expect(israelOnly.claims.every((c) => !/david and goliath/i.test(c))).toBe(true);
  });

  it("4. David and Goliath research still works when specifically requested", () => {
    expect(detectBibleSubject(DG_TOPIC)).toBe("david-goliath");
    const samuelEvidence = [
      evidence(
        "samuel-17",
        "BibleGateway 1 Samuel 17 (KJV)",
        "https://www.biblegateway.com/passage/?search=1%20Samuel%2017&version=KJV",
        SAMUEL_17_TEXT,
      ),
    ];
    const extracted = factExtractor(DG_TOPIC, samuelEvidence, "bible-stories");
    expect(extracted.factCount).toBeGreaterThan(0);
    expect(
      extracted.facts.some((fact) => /david|goliath|philistine/i.test(fact.claim)),
    ).toBe(true);

    // Topic underspecified but evidence is clearly 1 Samuel 17 — still preserve D&G.
    const fromEvidence = factExtractor(
      "Courage when you feel outmatched",
      samuelEvidence,
      "bible-stories",
    );
    expect(fromEvidence.factCount).toBeGreaterThan(0);
    expect(
      fromEvidence.facts.some((fact) => /david|goliath|philistine/i.test(fact.claim)),
    ).toBe(true);

    // Saul + David alone is not enough to force the D&G extractor.
    expect(
      detectBibleSubject("David anointed by Samuel while Saul reigns"),
    ).toBe("generic");
  });

  it("5. Unsupported biblical claims remain unverified", () => {
    const fabricated = factExtractor(
      EXODUS_TOPIC,
      EXODUS_EVIDENCE,
      "bible-stories",
    );
    const unsupported = {
      claim: "The David and Goliath account highlights trust in God.",
      sourceTitle: "BibleGateway Exodus 5 (KJV)",
      sourceUrl:
        "https://www.biblegateway.com/passage/?search=Exodus%205&version=KJV",
    };
    expect(
      biblicalNarrativeAllowsEvidence(unsupported.claim, {
        url: unsupported.sourceUrl,
        title: unsupported.sourceTitle,
      }),
    ).toBe(false);
    expect(fabricated.facts.some((f) => /david and goliath/i.test(f.claim))).toBe(
      false,
    );
  });

  it("6. Scripture claims retain passage-level provenance", () => {
    const claim = "According to Exodus 5, Pharaoh refuses to let Israel go.";
    const sources = [
      {
        url: "https://www.biblegateway.com/passage/?search=Exodus%205&version=KJV",
        title: "BibleGateway Exodus 5 (KJV)",
      },
      {
        url: "https://www.biblegateway.com/passage/?search=Exodus%208&version=KJV",
        title: "BibleGateway Exodus 8 (KJV)",
      },
    ];
    const binding = resolveClaimSourceBinding(claim, sources);
    expect(binding.role).toBe("primary-scripture");
    expect(binding.exclusiveDocumentKey).toBe("exodus-5");
    expect(binding.exclusiveUrl).toMatch(/Exodus(%20|\+)5/i);
  });

  it("7. Composer path only receives subject-relevant verified material", () => {
    const extracted = factExtractor(EXODUS_TOPIC, EXODUS_EVIDENCE, "bible-stories");
    expect(
      extracted.facts.some((fact) => /According to Exodus \d+/i.test(fact.claim)),
    ).toBe(true);
    const verified = factVerificationEngine(extracted.facts);
    const publishable = verified.verifiedFacts.filter(
      (fact) =>
        fact.verificationStatus === "verified" ||
        fact.verificationStatus === "partially verified",
    );
    expect(publishable.length).toBeGreaterThan(0);
    expect(
      publishable.every((fact) => !/david and goliath|\bgoliath\b|philistine/i.test(fact.claim)),
    ).toBe(true);
    expect(
      extracted.facts.every((fact) => !/^The David and Goliath account/i.test(fact.claim)),
    ).toBe(true);
    // Residual confrontation phrasing without "Goliath" must not survive Exodus extraction.
    expect(
      extracted.facts.every(
        (fact) => !/David uses simple weapons in the confrontation\.?$/i.test(fact.claim),
      ),
    ).toBe(true);
  });

  it("8. Article-grounded verification identifies supported and unsupported statements", () => {
    const content = `
## Increased suffering (Exodus 5:1-9)
According to Exodus 5, Pharaoh refuses to let Israel go and lays more work on the people.
## Unrelated invention
David secretly trained with Goliath in the Valley of Elah before Saul was born.
`;
    const claims = extractArticleClaims({
      title: "Pharaoh's Counterplans",
      excerpt: "Exodus deliverance and bondage.",
      content,
    });
    expect(claims.claims.some((c) => /Exodus 5|Pharaoh refuses/i.test(c.claim))).toBe(
      true,
    );

    const grounded = verifyGeneratedArticleAgainstEvidence({
      title: "Pharaoh's Counterplans",
      excerpt: "Exodus deliverance and bondage.",
      content,
      evidence: EXODUS_EVIDENCE,
      listedSources: EXODUS_EVIDENCE.map((e) => ({
        url: e.sourceUrl,
        title: e.sourceTitle,
      })),
    });

    expect(grounded.facts.length).toBeGreaterThan(0);
    expect(
      grounded.facts.every(
        (f) =>
          !/david and goliath/i.test(f.claim) ||
          f.verificationStatus === "unverified",
      ),
    ).toBe(true);
  });

  it("9. Simulated end-to-end Exodus article path has no unrelated narrative contamination", () => {
    const extracted = factExtractor(EXODUS_TOPIC, EXODUS_EVIDENCE, "bible-stories");
    const verified = factVerificationEngine(extracted.facts);
    const allClaims = [
      ...extracted.facts.map((f) => f.claim),
      ...verified.verifiedFacts.map((f) => f.claim),
    ].join("\n");

    expect(allClaims).not.toMatch(/david and goliath/i);
    expect(allClaims).not.toMatch(/\bgoliath\b/i);
    expect(allClaims).toMatch(/pharaoh|exodus|israel|moses/i);

    const factHeadings = verified.verifiedFacts
      .filter(
        (f) =>
          f.verificationStatus === "verified" ||
          f.verificationStatus === "partially verified",
      )
      .map((f, i) => `FACT ${i + 1}: ${f.claim}`);
    expect(factHeadings.every((h) => !/goliath|david and goliath/i.test(h))).toBe(true);
  });

  it("10. Uncited primary-scripture claims do not default to 1 Samuel 17", () => {
    const binding = resolveClaimSourceBinding(
      "According to the biblical narrative, the Lord delivers His people.",
      [
        {
          url: "https://www.biblegateway.com/passage/?search=Exodus%205&version=KJV",
          title: "BibleGateway Exodus 5 (KJV)",
        },
      ],
    );
    expect(binding.exclusiveDocumentKey).not.toBe("1-samuel-17");
  });
});
