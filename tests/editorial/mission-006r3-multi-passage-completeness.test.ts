/**
 * Mission 006R3 — multi-passage biblical teaching completeness.
 *
 * Behaviour under test: balanced evidence selection across scripture sources;
 * multi-chapter source retention; teaching-plan completeness diagnostics;
 * Exodus movement coverage; D&G exclusion; claim binding; single-passage and
 * non-bible paths unchanged; Prepare/approve boundaries untouched.
 *
 * Modules: biblical-teaching-completeness, claim-evidence-selector
 * (selectSourceBalancedEvidence), scripture-ref, source-collector,
 * fact-extractor, claim-source-attribution, article-lifecycle.
 *
 * Existing related tests: mission-006r-scripture-reliability.test.ts,
 * mission-006r2-biblical-research-integrity.test.ts (none cover multi-passage
 * evidence-cap starvation or teaching completeness gates).
 *
 * Director: "Use the original Mission 006 brief as a fixed regression fixture.
 * Prove that: 1…10"
 */
import { describe, expect, it, vi } from "vitest";
import {
  MISSION_006_TEACHING_BRIEF,
  assessArticleTeachingCoverage,
  assessEvidenceTeachingCoverage,
  buildScriptureTeachingPlan,
  evidenceChapterKeys,
} from "../../lib/research/biblical-teaching-completeness";
import { selectSourceBalancedEvidence } from "../../lib/research/claim-evidence-selector";
import {
  biblicalNarrativeAllowsEvidence,
  claimAllowsEvidence,
} from "../../lib/research/claim-source-attribution";
import { factExtractor } from "../../lib/research/fact-extractor";
import { factVerificationEngine } from "../../lib/research/fact-verification-engine";
import type { EvidenceRecord } from "../../lib/research/evidence-registry";
import { scriptureSourcesFromTopic } from "../../lib/research/scripture-ref";
import { sourceCollector } from "../../lib/research/source-collector";
import { RESEARCH_MAX_UNIQUE_AUDIT_PASSAGES } from "../../lib/research/source-fetch-guard";
import type { EvidenceChunk } from "../../lib/research/evidence-chunker";

vi.mock("../../lib/research/search-adapter", () => ({
  searchAdapter: vi.fn(async () => []),
}));

const EXODUS_5_TEXT =
  "And afterward Moses and Aaron went in, and told Pharaoh, Thus saith the Lord God of Israel, Let my people go, that they may hold a feast unto me in the wilderness. And Pharaoh said, Who is the Lord, that I should obey his voice to let Israel go? Ye shall no more give the people straw to make brick. Let there be more work laid upon the men.";

const EXODUS_8_TEXT =
  "And Pharaoh called for Moses and for Aaron, and said, Go ye, sacrifice to your God in the land. And Moses said, It is not meet so to do. And Pharaoh said, I will let you go, that ye may sacrifice to the Lord your God in the wilderness; only ye shall not go very far away.";

const EXODUS_10_TEXT =
  "And Moses and Aaron were brought again unto Pharaoh: and he said unto them, Go, serve the Lord your God: but who are they that shall go? And Moses said, We will go with our young and with our old, with our sons and with our daughters. And he said unto them, Go now ye that are men, and serve the Lord. And Pharaoh called unto Moses, and said, Go ye, serve the Lord; only let your flocks and your herds be stayed: let your little ones also go with you.";

const JOHN_10_TEXT =
  "The thief cometh not, but for to steal, and to kill, and to destroy: I am come that they might have life, and that they might have it more abundantly.";

const COR_2_TEXT =
  "Lest Satan should get an advantage of us: for we are not ignorant of his devices.";

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

function chunks(prefix: string, count: number, body: string): EvidenceChunk[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `chunk-${index + 1}`,
    text: `${prefix} passage ${index + 1}. ${body}`,
  }));
}

const MULTI_PASSAGE_EVIDENCE: EvidenceRecord[] = [
  evidence(
    "ex5",
    "BibleGateway Exodus 5 (KJV)",
    "https://www.biblegateway.com/passage/?search=Exodus%205&version=KJV",
    EXODUS_5_TEXT,
  ),
  evidence(
    "ex8",
    "BibleGateway Exodus 8 (KJV)",
    "https://www.biblegateway.com/passage/?search=Exodus%208&version=KJV",
    EXODUS_8_TEXT,
  ),
  evidence(
    "ex10",
    "BibleGateway Exodus 10 (KJV)",
    "https://www.biblegateway.com/passage/?search=Exodus%2010&version=KJV",
    EXODUS_10_TEXT,
  ),
  evidence(
    "jn10",
    "BibleGateway John 10 (KJV)",
    "https://www.biblegateway.com/passage/?search=John%2010&version=KJV",
    JOHN_10_TEXT,
  ),
  evidence(
    "2cor2",
    "BibleGateway 2 Corinthians 2 (KJV)",
    "https://www.biblegateway.com/passage/?search=2%20Corinthians%202&version=KJV",
    COR_2_TEXT,
  ),
];

const COMPLETE_ARTICLE = `
## Movement 1 — Increased suffering (Exodus 5:1-9)
Pharaoh refused and laid more work on Israel with straw and brick bondage after "Let my people go".

## Movement 2 — Worship in the land (Exodus 8:25-27)
Pharaoh said sacrifice to your God in the land of Egypt.

## Movement 3 — Not very far (Exodus 8:28)
Pharaoh permitted departure but said ye shall not go very far away.

## Movement 4 — Children behind (Exodus 10:8-11)
Pharaoh tried to keep the little ones / children in Egypt.

## Movement 5 — Livestock behind (Exodus 10:24-26)
Pharaoh said leave the flocks and herds / livestock behind.

## Supporting watchfulness
John 10:10 names the thief. 2 Corinthians 2:11 warns we are not ignorant of his devices.
Mark 8:34 calls for discipleship. Joshua 24:15 chooses whom we will serve.
Romans 12:1-2 urges living sacrifice. Colossians 3:1-4 sets affection on things above.
Ephesians 6:11 says put on the whole armour. 1 Peter 5:8 warns to be sober.
James 4:7 says resist the devil.
`;

describe("Mission 006R3 multi-passage editorial completeness", () => {
  it("1. All five Exodus movements appear in a complete generated article fixture", () => {
    const plan = buildScriptureTeachingPlan(
      MISSION_006_TEACHING_BRIEF,
      "bible-stories",
    );
    expect(plan).not.toBeNull();
    expect(plan!.movements).toHaveLength(5);
    const coverage = assessArticleTeachingCoverage(COMPLETE_ARTICLE, plan!);
    expect(coverage.ok).toBe(true);
    expect(coverage.missingMovements).toEqual([]);
  });

  it("2. Exodus 5, 8 and 10 contribute relevant evidence under balanced selection", () => {
    const documents = [
      {
        url: "https://www.biblegateway.com/passage/?search=Exodus%205&version=KJV",
        title: "BibleGateway Exodus 5 (KJV)",
        sourceType: "scripture-reference",
        relevanceScore: 95,
        extractedText: EXODUS_5_TEXT,
        chunks: chunks("Exodus 5", 30, EXODUS_5_TEXT),
      },
      {
        url: "https://biblehub.com/exodus/5.htm",
        title: "Bible Hub Exodus 5",
        sourceType: "scripture-reference",
        relevanceScore: 90,
        extractedText: EXODUS_5_TEXT,
        chunks: chunks("Hub Exodus 5", 30, EXODUS_5_TEXT),
      },
      {
        url: "https://www.biblegateway.com/passage/?search=Exodus%208&version=KJV",
        title: "BibleGateway Exodus 8 (KJV)",
        sourceType: "scripture-reference",
        relevanceScore: 95,
        extractedText: EXODUS_8_TEXT,
        chunks: chunks("Exodus 8", 4, EXODUS_8_TEXT),
      },
      {
        url: "https://www.biblegateway.com/passage/?search=Exodus%2010&version=KJV",
        title: "BibleGateway Exodus 10 (KJV)",
        sourceType: "scripture-reference",
        relevanceScore: 95,
        extractedText: EXODUS_10_TEXT,
        chunks: chunks("Exodus 10", 4, EXODUS_10_TEXT),
      },
    ];

    const naive = documents
      .flatMap((document) =>
        document.chunks.map((chunk) => ({
          sourceUrl: document.url,
          text: chunk.text,
        })),
      )
      .slice(0, RESEARCH_MAX_UNIQUE_AUDIT_PASSAGES);
    expect(
      naive.every((row) => /Exodus%205|exodus\/5/i.test(row.sourceUrl)),
    ).toBe(true);

    const balanced = selectSourceBalancedEvidence(documents);
    expect(balanced.evidence.length).toBeGreaterThan(0);
    expect(balanced.evidence.length).toBeLessThanOrEqual(
      RESEARCH_MAX_UNIQUE_AUDIT_PASSAGES,
    );
    const keys = evidenceChapterKeys(balanced.evidence);
    expect(keys.has("exodus-5")).toBe(true);
    expect(keys.has("exodus-8")).toBe(true);
    expect(keys.has("exodus-10")).toBe(true);

    const extracted = factExtractor(
      MISSION_006_TEACHING_BRIEF,
      MULTI_PASSAGE_EVIDENCE,
      "bible-stories",
    );
    expect(
      extracted.facts.some((fact) =>
        /exodus 5|more work|straw|brick/i.test(fact.claim),
      ),
    ).toBe(true);
    expect(
      extracted.facts.some((fact) =>
        /exodus 8|in the land|not very far/i.test(fact.claim),
      ),
    ).toBe(true);
    expect(
      extracted.facts.some((fact) =>
        /exodus 10|children|little ones|flock|herd/i.test(fact.claim),
      ),
    ).toBe(true);
    expect(
      extracted.facts.some((fact) => /john 10:10|thief/i.test(fact.claim)),
    ).toBe(true);
    expect(
      extracted.facts.some((fact) =>
        /2 corinthians 2:11|devices/i.test(fact.claim),
      ),
    ).toBe(true);
  });

  it("3. Supporting New Testament references are retained in source collection", async () => {
    const sources = scriptureSourcesFromTopic(MISSION_006_TEACHING_BRIEF);
    const urls = sources.map((source) => source.url).join(" ");
    expect(urls).toMatch(/Exodus%205|Exodus 5/i);
    expect(urls).toMatch(/Exodus%208|Exodus 8/i);
    expect(urls).toMatch(/Exodus%2010|Exodus 10/i);
    expect(urls).toMatch(/John%2010|John 10/i);
    expect(urls).toMatch(/Corinthians%202|2 Corinthians 2/i);
    expect(urls).toMatch(/Mark%208|Mark 8/i);
    expect(urls).toMatch(/Joshua%2024|Joshua 24/i);
    expect(urls).toMatch(/Romans%2012|Romans 12/i);

    const collected = await sourceCollector(
      MISSION_006_TEACHING_BRIEF,
      [],
      "bible-stories",
    );
    expect(collected.sourceCount).toBeGreaterThan(8);
    expect(collected.sourceCount).toBeLessThanOrEqual(16);
    expect(
      collected.collectedSources.some((source) =>
        /john/i.test(source.url + source.title),
      ),
    ).toBe(true);
    expect(
      collected.collectedSources.some((source) =>
        /corinthians/i.test(source.url + source.title),
      ),
    ).toBe(true);
  });

  it("4. No unrelated David and Goliath material appears", async () => {
    const collected = await sourceCollector(
      MISSION_006_TEACHING_BRIEF,
      [],
      "bible-stories",
    );
    expect(
      collected.collectedSources.some((source) =>
        /1.?samuel|goliath|david/i.test(source.url + source.title),
      ),
    ).toBe(false);

    const extracted = factExtractor(
      MISSION_006_TEACHING_BRIEF,
      MULTI_PASSAGE_EVIDENCE,
      "bible-stories",
    );
    expect(
      extracted.facts.every(
        (fact) =>
          !/david and goliath|\bgoliath\b|1 samuel 17/i.test(fact.claim),
      ),
    ).toBe(true);
    expect(/goliath|1 samuel 17/i.test(COMPLETE_ARTICLE)).toBe(false);
  });

  it("5. Claims bind to the correct passages", () => {
    const exodusClaim =
      "According to Exodus 8:28, Pharaoh said Israel shall not go very far away.";
    const exodusSource = {
      url: "https://www.biblegateway.com/passage/?search=Exodus%208&version=KJV",
      title: "BibleGateway Exodus 8 (KJV)",
    };
    const samuelSource = {
      url: "https://www.biblegateway.com/passage/?search=1%20Samuel%2017&version=KJV",
      title: "BibleGateway 1 Samuel 17 (KJV)",
    };
    expect(
      claimAllowsEvidence(exodusClaim, exodusSource, [
        exodusSource,
        samuelSource,
      ]),
    ).toBe(true);
    expect(biblicalNarrativeAllowsEvidence(exodusClaim, samuelSource)).toBe(
      false,
    );
  });

  it("6. Unsupported statements remain unsupported", () => {
    const extracted = factExtractor(
      MISSION_006_TEACHING_BRIEF,
      MULTI_PASSAGE_EVIDENCE,
      "bible-stories",
    );
    const verified = factVerificationEngine([
      ...extracted.facts,
      {
        claim:
          "Exodus explicitly identifies Pharaoh's five negotiations as satanic tactics invented in Alexandria.",
        evidenceId: "fabricated",
        sourceTitle: "None",
        sourceUrl: "https://example.com/not-scripture",
        sourceType: "web",
        evidenceText: "unrelated",
        confidence: "low" as const,
      },
    ]);
    const fabricated = verified.verifiedFacts.find((fact) =>
      /satanic tactics invented in Alexandria/i.test(fact.claim),
    );
    expect(fabricated?.verificationStatus).toBe("unverified");
  });

  it("7. Missing required passages cause an explicit completeness failure", () => {
    const plan = buildScriptureTeachingPlan(
      MISSION_006_TEACHING_BRIEF,
      "bible-stories",
    )!;
    const onlyExodus5 = MULTI_PASSAGE_EVIDENCE.filter((record) =>
      /Exodus%205/i.test(record.sourceUrl),
    );
    const evidenceCoverage = assessEvidenceTeachingCoverage(onlyExodus5, plan);
    expect(evidenceCoverage.ok).toBe(false);
    expect(evidenceCoverage.missingChapterKeys).toEqual(
      expect.arrayContaining(["exodus-8", "exodus-10", "john-10"]),
    );
    expect(evidenceCoverage.reason).toMatch(/Research incomplete/i);

    const partialArticle =
      "## Only Exodus 5\nPharaoh refused Let my people go and increased straw and brick work.";
    const articleCoverage = assessArticleTeachingCoverage(
      partialArticle,
      plan,
    );
    expect(articleCoverage.ok).toBe(false);
    expect(articleCoverage.reason).toMatch(/Article incomplete/i);
  });

  it("8. A single-passage Bible article still works correctly", async () => {
    const topic = "David and Goliath courage from 1 Samuel 17";
    const plan = buildScriptureTeachingPlan(topic, "bible-stories");
    expect(plan).not.toBeNull();
    expect(plan!.requiredChapterKeys).toEqual(["1-samuel-17"]);
    expect(plan!.requiredChapterKeys.length).toBe(1);

    const collected = await sourceCollector(topic, [], "bible-stories");
    expect(
      collected.collectedSources.some((source) =>
        /1.?samuel|samuel%2017/i.test(source.url),
      ),
    ).toBe(true);
    expect(
      collected.collectedSources.every(
        (source) => !/exodus/i.test(source.url + source.title),
      ),
    ).toBe(true);
  });

  it("9. Non-Bible editorial generation remains unaffected", async () => {
    expect(
      buildScriptureTeachingPlan(
        "How AI agents help small businesses save time",
        "ai-automation",
      ),
    ).toBeNull();

    const collected = await sourceCollector(
      "How AI agents help small businesses save time",
      [
        {
          title: "Manual AI source",
          url: "https://example.com/ai-ops",
          sourceType: "web",
        },
      ],
      "ai-automation",
    );
    expect(collected.sourceCount).toBeLessThanOrEqual(8);
    expect(
      collected.collectedSources.every(
        (source) => !/biblegateway|biblehub/i.test(source.url),
      ),
    ).toBe(true);
  });

  it("11. Oversized briefs fail with an explicit chapter-cap diagnostic", () => {
    const topic =
      "Genesis 1, Exodus 5, Leviticus 1, Numbers 1, Deuteronomy 1, Joshua 1, " +
      "Judges 1, Ruth 1, 1 Samuel 17, 2 Samuel 1, 1 Kings 1, 2 Kings 1, " +
      "Psalms 1, Proverbs 1, Isaiah 1";
    const plan = buildScriptureTeachingPlan(topic, "bible-stories");
    expect(plan).not.toBeNull();
    expect(plan!.oversizedBrief).toBe(true);
    expect(plan!.requiredChapterKeys).toHaveLength(12);
    expect(plan!.truncatedChapterKeys.length).toBeGreaterThan(0);
    expect(plan!.oversizedReason).toMatch(/at most 12/i);
  });

  it("12. Non-Exodus coverage requires verse-qualified citations from the brief", () => {
    const plan = buildScriptureTeachingPlan(
      "John 10:10 and 2 Corinthians 2:11 on spiritual vigilance",
      "bible-stories",
    )!;
    expect(plan.movements).toHaveLength(0);
    expect(
      assessArticleTeachingCoverage(
        "## Watchfulness\nJohn 10 and 2 Corinthians 2 warn believers.",
        plan,
      ).ok,
    ).toBe(false);
    expect(
      assessArticleTeachingCoverage(
        "## Watchfulness\nJohn 10:10 names the thief. 2 Corinthians 2:11 warns about devices.",
        plan,
      ).ok,
    ).toBe(true);
  });

  it("13. Exodus movements must be covered in dedicated sections, not cross-section tokens", () => {
    const plan = buildScriptureTeachingPlan(
      MISSION_006_TEACHING_BRIEF,
      "bible-stories",
    )!;
    const smuggled = `
## Movement 1 — Increased suffering (Exodus 5:1-9)
Pharaoh refused and laid more work with straw and brick. Also not very far and little ones and flocks and herds and in the land.
John 10:10. 2 Corinthians 2:11. Mark 8:34. Joshua 24:15. Romans 12:1-2.
Colossians 3:1-4. Ephesians 6:11. 1 Peter 5:8. James 4:7.

## Movement 2 — label only
Exodus 8:25-27 is named but the land compromise is not explained here.

## Empty later headings
## Movement 3
## Movement 4
## Movement 5
`;
    const coverage = assessArticleTeachingCoverage(smuggled, plan);
    expect(coverage.ok).toBe(false);
    expect(coverage.missingMovements.length).toBeGreaterThan(0);
  });

  it("10. EV-REG-SPEC-1.1.0 security and approval boundaries remain intact", async () => {
    const { canShowPrepareForReviewAction } = await import(
      "../../lib/publishing/article-action-visibility"
    );
    // Prepare remains status-gated; published/approved articles stay out of Prepare.
    expect(typeof canShowPrepareForReviewAction).toBe("function");

    const plan = buildScriptureTeachingPlan(
      MISSION_006_TEACHING_BRIEF,
      "bible-stories",
    )!;
    const coverage = assessEvidenceTeachingCoverage(
      MULTI_PASSAGE_EVIDENCE,
      plan,
    );
    expect(coverage.ok).toBe(false);
    expect(Object.keys(coverage)).not.toContain("publicationRecommendation");
    expect(Object.keys(coverage)).not.toContain("approved");
  });
});
