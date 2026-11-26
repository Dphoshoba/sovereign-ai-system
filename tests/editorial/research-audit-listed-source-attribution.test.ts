import { describe, expect, it } from "vitest";
import { passageSupportsClaim } from "../../lib/research/article-claim-extractor";
import { groundedFactVerification } from "../../lib/research/claim-evidence-matcher";
import { claimAllowsEvidence } from "../../lib/research/claim-source-attribution";
import { consensusEngine } from "../../lib/research/consensus-engine";
import type { VerifiedFact } from "../../lib/research/fact-verification-engine";
import { NIST_PDF_PASSAGE } from "../fixtures/research-audit/article-2";

const SIGHT_URL = "https://www.trysight.ai/blog/ai-powered-content-automation";
const STORYTEQ_URL =
  "https://storyteq.com/blog/how-to-use-ai-in-content-marketing-automation-a-practical-example/";
const UXMATTERS_URL =
  "https://www.uxmatters.com/mt/archives/2024/09/ai-powered-content-creation-how-artificial-intelligence-automates-and-streamlines-the-workflow.php";
const FLOODLIGHT_URL =
  "https://www.floodlightnewmarketing.co.uk/blog/future-of-content-creation";
const BIBLEGATEWAY_URL =
  "https://www.biblegateway.com/passage/?search=1%20Samuel%2017&version=KJV";
const NIST_URL = "https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf";
const DELOITTE_URL =
  "https://www.deloitte.com/us/en/insights/topics/technology-management/ai-infrastructure-survey.html";

const SIGHT_CLAIM =
  "According to the AI Powered Content Automation guide, intelligent systems handle the repetitive, time-intensive tasks so your team can focus on strategy and creativity.";
const UX_CLAIM =
  "According to UXmatters, content creation has become more efficient and streamlined.";
const FLOODLIGHT_CLAIM =
  "According to Floodlight, many repetitive bottlenecks in traditional content workflows are eliminated by AI.";
const SCRIPTURE_CLAIM =
  "According to 1 Samuel 17, the Philistine and Israelite forces faced one another.";
const NIST_CLAIM =
  "NIST’s AI Risk Management Framework says AI risk management should be integrated into broader enterprise risk processes.";
const UNATTRIBUTED_CLAIM =
  "AI automation is streamlining repetitive work and improving creator workflows.";

const LISTED_SOURCES = [
  {
    url: SIGHT_URL,
    title: "AI Powered Content Automation: Complete 2026 Guide",
  },
  {
    url: STORYTEQ_URL,
    title: "Automate, personalize, and optimize your content: AI makes content creation effortless",
  },
  {
    url: UXMATTERS_URL,
    title:
      "AI-Powered Content Creation: How Artificial Intelligence Automates and Streamlines the Workflow :: UXmatters",
  },
  {
    url: FLOODLIGHT_URL,
    title: "The Future of Content Creation: How AI Will Transform Creative Industries by 2025",
  },
  {
    url: BIBLEGATEWAY_URL,
    title: "1 Samuel 17 KJV",
  },
  { url: NIST_URL, title: "NIST AI RMF" },
  { url: DELOITTE_URL, title: "Deloitte AI infrastructure survey" },
];

function evidence(id: string, url: string, title: string, text: string) {
  return {
    id,
    sourceTitle: title,
    sourceUrl: url,
    sourceType: "stored-research-source",
    extractedText: text,
    confidence: 70,
    requiresHumanReview: true,
  };
}

function factualClaim(claim: string) {
  return {
    claim,
    articleExcerpt: claim,
    section: "body" as const,
    blockType: "paragraph" as const,
    kind: "factual" as const,
  };
}

function partialFact(claim: string, url: string): VerifiedFact {
  return {
    claim,
    evidenceId: `${url}-1`,
    sourceTitle: url,
    sourceUrl: url,
    sourceType: "stored-research-source",
    evidenceText: claim,
    confidence: "medium",
    requiresHumanReview: true,
    articleExcerpt: claim,
    articleSection: "body",
    blockType: "paragraph",
    verificationCount: 1,
    verificationStatus: "partially verified",
    verificationMethod: "single-source-supported",
    supportingSources: [
      { sourceTitle: url, sourceUrl: url, evidenceId: `${url}-1` },
    ],
    similarityMatches: [],
    verificationScore: 53,
  };
}

describe("listed source attribution", () => {
  it("accepts the named guide and rejects a high-overlap Storyteq passage", () => {
    const storyteqText =
      "By using these four types of automation, brands can increase content efficiency, reduce manual workload, and focus on creativity and strategy instead of repetitive tasks.";
    const guideText =
      "This is building intelligent systems that handle the repetitive, time-intensive tasks so your team can focus on strategy, creativity, and the work that moves the needle.";
    expect(passageSupportsClaim(SIGHT_CLAIM, storyteqText)).toBe(true);
    expect(passageSupportsClaim(SIGHT_CLAIM, guideText)).toBe(true);
    expect(
      claimAllowsEvidence(
        SIGHT_CLAIM,
        { url: SIGHT_URL, title: LISTED_SOURCES[0].title },
        LISTED_SOURCES,
      ),
    ).toBe(true);
    expect(
      claimAllowsEvidence(
        SIGHT_CLAIM,
        { url: STORYTEQ_URL, title: LISTED_SOURCES[1].title },
        LISTED_SOURCES,
      ),
    ).toBe(false);

    const verification = groundedFactVerification(
      [factualClaim(SIGHT_CLAIM)],
      [
        evidence("storyteq", STORYTEQ_URL, LISTED_SOURCES[1].title, storyteqText),
        evidence("sight", SIGHT_URL, LISTED_SOURCES[0].title, guideText),
      ],
      SIGHT_CLAIM,
      LISTED_SOURCES,
    );
    expect(verification.facts[0]?.sourceUrl).toBe(SIGHT_URL);
    expect(verification.facts[0]?.verificationStatus).toBe("partially verified");
    expect(
      verification.facts[0]?.supportingSources.some((source) =>
        source.sourceUrl.includes("storyteq.com"),
      ),
    ).toBe(false);
  });

  it("accepts UXmatters and Floodlight evidence only from the named source", () => {
    const efficiency =
      "With generative artificial intelligence, content creation has become more efficient and streamlined.";
    const bottlenecks =
      "AI eliminates many repetitive bottlenecks in traditional content workflows, enabling creators to expand operational efficiencies.";
    expect(
      claimAllowsEvidence(
        UX_CLAIM,
        { url: UXMATTERS_URL, title: LISTED_SOURCES[2].title },
        LISTED_SOURCES,
      ),
    ).toBe(true);
    expect(
      claimAllowsEvidence(
        UX_CLAIM,
        { url: STORYTEQ_URL, title: LISTED_SOURCES[1].title },
        LISTED_SOURCES,
      ),
    ).toBe(false);
    expect(
      claimAllowsEvidence(
        FLOODLIGHT_CLAIM,
        { url: FLOODLIGHT_URL, title: LISTED_SOURCES[3].title },
        LISTED_SOURCES,
      ),
    ).toBe(true);
    expect(
      claimAllowsEvidence(
        FLOODLIGHT_CLAIM,
        { url: SIGHT_URL, title: LISTED_SOURCES[0].title },
        LISTED_SOURCES,
      ),
    ).toBe(false);

    const ux = groundedFactVerification(
      [factualClaim(UX_CLAIM)],
      [
        evidence("storyteq-copy", STORYTEQ_URL, LISTED_SOURCES[1].title, efficiency),
        evidence("ux", UXMATTERS_URL, LISTED_SOURCES[2].title, efficiency),
      ],
      UX_CLAIM,
      LISTED_SOURCES,
    );
    expect(ux.facts[0]?.sourceUrl).toBe(UXMATTERS_URL);
    expect(ux.facts[0]?.supportingSources).toHaveLength(1);

    const floodlight = groundedFactVerification(
      [factualClaim(FLOODLIGHT_CLAIM)],
      [
        evidence("sight-copy", SIGHT_URL, LISTED_SOURCES[0].title, bottlenecks),
        evidence("floodlight", FLOODLIGHT_URL, LISTED_SOURCES[3].title, bottlenecks),
      ],
      FLOODLIGHT_CLAIM,
      LISTED_SOURCES,
    );
    expect(floodlight.facts[0]?.sourceUrl).toBe(FLOODLIGHT_URL);
    expect(
      floodlight.facts[0]?.supportingSources.every((source) =>
        source.sourceUrl.includes("floodlightnewmarketing.co.uk"),
      ),
    ).toBe(true);
  });

  it("rejects unknown and ambiguous explicit attributions instead of using another source", () => {
    const unknown =
      "According to the Missing Quarterly, content creation has become more efficient and streamlined.";
    expect(
      claimAllowsEvidence(
        unknown,
        { url: UXMATTERS_URL, title: LISTED_SOURCES[2].title },
        LISTED_SOURCES,
      ),
    ).toBe(false);
    const unknownVerification = groundedFactVerification(
      [factualClaim(unknown)],
      [evidence("ux-copy", UXMATTERS_URL, LISTED_SOURCES[2].title, unknown)],
      unknown,
      LISTED_SOURCES,
    );
    expect(unknownVerification.facts[0]?.verificationStatus).toBe("unverified");
    expect(unknownVerification.acceptedEvidence).toHaveLength(0);

    const ambiguous =
      "According to the Northwind Quarterly, output increased across the measured teams.";
    const ambiguousSources = [
      { url: "https://northwind.example/quarterly", title: "Northwind Quarterly Review" },
      { url: "https://archive.example/northwind", title: "Northwind Quarterly Supplement" },
    ];
    expect(claimAllowsEvidence(ambiguous, ambiguousSources[0], ambiguousSources)).toBe(
      false,
    );
    expect(claimAllowsEvidence(ambiguous, ambiguousSources[1], ambiguousSources)).toBe(
      false,
    );
  });

  it("keeps 1 Samuel 17 bound to Bible Gateway", () => {
    expect(
      claimAllowsEvidence(
        SCRIPTURE_CLAIM,
        { url: BIBLEGATEWAY_URL, title: "1 Samuel 17 KJV" },
        LISTED_SOURCES,
      ),
    ).toBe(true);
    expect(
      claimAllowsEvidence(
        SCRIPTURE_CLAIM,
        { url: STORYTEQ_URL, title: LISTED_SOURCES[1].title },
        LISTED_SOURCES,
      ),
    ).toBe(false);
    const verification = groundedFactVerification(
      [factualClaim(SCRIPTURE_CLAIM)],
      [
        evidence("storyteq-scripture", STORYTEQ_URL, LISTED_SOURCES[1].title, SCRIPTURE_CLAIM),
        evidence("biblegateway", BIBLEGATEWAY_URL, "1 Samuel 17 KJV", SCRIPTURE_CLAIM),
      ],
      SCRIPTURE_CLAIM,
      LISTED_SOURCES,
    );
    expect(verification.facts[0]?.sourceUrl).toBe(BIBLEGATEWAY_URL);
    expect(verification.facts[0]?.supportingSources).toHaveLength(1);
  });

  it("keeps NIST evidence restricted to NIST", () => {
    expect(
      claimAllowsEvidence(
        NIST_CLAIM,
        { url: DELOITTE_URL, title: "Deloitte AI infrastructure survey" },
        LISTED_SOURCES,
      ),
    ).toBe(false);
    expect(
      claimAllowsEvidence(
        NIST_CLAIM,
        { url: NIST_URL, title: "NIST AI RMF" },
        LISTED_SOURCES,
      ),
    ).toBe(true);
    const verification = groundedFactVerification(
      [factualClaim(NIST_CLAIM)],
      [
        evidence(
          "deloitte-copy",
          DELOITTE_URL,
          "Deloitte AI infrastructure survey",
          `${NIST_CLAIM} ${NIST_PDF_PASSAGE}`,
        ),
        evidence("nist", NIST_URL, "NIST AI RMF", NIST_PDF_PASSAGE),
      ],
      NIST_CLAIM,
      LISTED_SOURCES,
    );
    expect(verification.facts[0]?.sourceUrl).toBe(NIST_URL);
    expect(
      verification.facts[0]?.supportingSources.some((source) =>
        source.sourceUrl.includes("deloitte.com"),
      ),
    ).toBe(false);
  });

  it("still matches an unattributed claim across sources", () => {
    const verification = groundedFactVerification(
      [factualClaim(UNATTRIBUTED_CLAIM)],
      [
        evidence("sight", SIGHT_URL, LISTED_SOURCES[0].title, UNATTRIBUTED_CLAIM),
        evidence("storyteq", STORYTEQ_URL, LISTED_SOURCES[1].title, UNATTRIBUTED_CLAIM),
      ],
      UNATTRIBUTED_CLAIM,
      LISTED_SOURCES,
    );
    const urls = verification.facts[0]?.supportingSources.map((source) => source.sourceUrl) ?? [];
    expect(urls).toContain(SIGHT_URL);
    expect(urls).toContain(STORYTEQ_URL);
    expect(verification.facts[0]?.verificationCount).toBe(2);
    expect(verification.facts[0]?.verificationStatus).toBe("verified");
  });

  it("counts multiple chunks from the same URL as one source", () => {
    const verification = groundedFactVerification(
      [factualClaim(UX_CLAIM)],
      [
        evidence("ux-1", UXMATTERS_URL, LISTED_SOURCES[2].title, UX_CLAIM),
        evidence("ux-2", UXMATTERS_URL, LISTED_SOURCES[2].title, `${UX_CLAIM} Further workflow detail.`),
      ],
      UX_CLAIM,
      LISTED_SOURCES,
    );
    expect(verification.facts[0]?.supportingSources).toHaveLength(2);
    expect(verification.facts[0]?.verificationCount).toBe(1);
    expect(verification.facts[0]?.verificationStatus).toBe("partially verified");
  });
});

describe("consensus verification strength", () => {
  it("does not give three single-source partial claims a perfect score", () => {
    const one = partialFact(
      "AI automation is streamlining repetitive creator work in this workflow.",
      "https://example.com/one",
    );
    const three = [one, { ...one, evidenceId: "b" }, { ...one, evidenceId: "c" }];
    const single = consensusEngine([one]);
    const repeated = consensusEngine(three);
    expect(single.consensusScore).toBe(repeated.consensusScore);
    expect(repeated.consensusScore).toBeLessThan(100);
    expect(repeated.consensusScore).toBeGreaterThanOrEqual(0);
    expect(repeated.verifiedFacts).toBe(0);
    expect(repeated.partiallyVerifiedFacts).toBe(3);
  });
});
