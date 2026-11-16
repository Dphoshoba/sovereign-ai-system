/**
 * Mission 006R4 — multi-section biblical composition reliability.
 *
 * Behaviour under test: same-chapter verse-range retention; teaching-aware
 * evidence selection for late-chapter movements; evidence text (not URL-only)
 * completeness; incompleteness gate still rejects incomplete drafts; single-
 * passage and non-bible paths unchanged; thresholds untouched.
 *
 * Modules: scripture-ref (mergeRefsToUniqueChapters), claim-evidence-selector
 * (selectTeachingBalancedEvidence), biblical-teaching-completeness.
 *
 * Existing related: mission-006r3-multi-passage-completeness.test.ts (none cover
 * same-chapter range collapse or teaching-aware late-verse selection).
 *
 * Director: "demonstrate locally that the actual generation pipeline produces
 * a complete Mission 006 article" / "Do not weaken the Mission 006R3
 * completeness gate." / "Correct the article composition pipeline"
 */
import { describe, expect, it, vi } from "vitest";
import {
  MISSION_006_TEACHING_BRIEF,
  assessArticleTeachingCoverage,
  assessEvidenceTeachingCoverage,
  buildScriptureTeachingPlan,
  formatMissingCoverageRevisionBrief,
  teachingEvidenceRelevancePatterns,
} from "../../lib/research/biblical-teaching-completeness";
import {
  selectSourceBalancedEvidence,
  selectTeachingBalancedEvidence,
} from "../../lib/research/claim-evidence-selector";
import type { EvidenceChunk } from "../../lib/research/evidence-chunker";
import type { EvidenceRecord } from "../../lib/research/evidence-registry";
import {
  mergeRefsToUniqueChapters,
  parseScriptureRefs,
  scriptureSourcesFromTopic,
} from "../../lib/research/scripture-ref";
import { RESEARCH_MAX_UNIQUE_AUDIT_PASSAGES } from "../../lib/research/source-fetch-guard";

vi.mock("../../lib/research/search-adapter", () => ({
  searchAdapter: vi.fn(async () => []),
}));

function chunks(prefix: string, bodies: string[]): EvidenceChunk[] {
  return bodies.map((body, index) => ({
    id: `chunk-${index + 1}`,
    text: `${prefix} passage ${index + 1}. ${body}`,
  }));
}

const EARLY_EXODUS_8 =
  "And the Lord spake unto Moses, Go unto Pharaoh, and say unto him, Thus saith the Lord, Let my people go, that they may serve me. And if thou refuse to let them go, behold, I will smite all thy borders with frogs.";
const LATE_EXODUS_8_IN_LAND =
  "And Pharaoh called for Moses and for Aaron, and said, Go ye, sacrifice to your God in the land. And Moses said, It is not meet so to do.";
const LATE_EXODUS_8_NOT_FAR =
  "And Pharaoh said, I will let you go, that ye may sacrifice to the Lord your God in the wilderness; only ye shall not go very far away: intreat for me.";
const EARLY_EXODUS_10 =
  "And the Lord said unto Moses, Stretch out thine hand over the land of Egypt for the locusts, that they may come up upon the land of Egypt.";
const LATE_EXODUS_10_CHILDREN =
  "And Moses said, We will go with our young and with our old, with our sons and with our daughters. And he said unto them, Go now ye that are men, and serve the Lord; but the little ones stay.";
const LATE_EXODUS_10_LIVESTOCK =
  "And Pharaoh called unto Moses, and said, Go ye, serve the Lord; only let your flocks and your herds be stayed: let your little ones also go with you.";

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

describe("Mission 006R4 composition reliability", () => {
  it("1. Same-chapter verse ranges are retained via chapter-level fetch", () => {
    const refs = parseScriptureRefs(MISSION_006_TEACHING_BRIEF);
    const merged = mergeRefsToUniqueChapters(refs);
    const exodus8 = merged.find(
      (ref) => ref.book === "exodus" && ref.chapter === 8,
    );
    const exodus10 = merged.find(
      (ref) => ref.book === "exodus" && ref.chapter === 10,
    );
    expect(exodus8?.verseStart).toBeUndefined();
    expect(exodus10?.verseStart).toBeUndefined();

    const sources = scriptureSourcesFromTopic(MISSION_006_TEACHING_BRIEF);
    const gateway8 = sources.find((source) =>
      /BibleGateway Exodus 8/i.test(source.title),
    );
    expect(gateway8?.url).toMatch(/search=Exodus(%20|\+)8(&|$)/i);
    expect(gateway8?.url).not.toMatch(/25-27/);
  });

  it("2. Early-chapter round-robin starves late movements; teaching-aware recovers them", () => {
    const documents = [
      {
        url: "https://www.biblegateway.com/passage/?search=Exodus%208&version=KJV",
        title: "BibleGateway Exodus 8 (KJV)",
        sourceType: "scripture-reference",
        relevanceScore: 95,
        extractedText: [
          EARLY_EXODUS_8,
          LATE_EXODUS_8_IN_LAND,
          LATE_EXODUS_8_NOT_FAR,
        ].join(" "),
        chunks: chunks("Exodus 8", [
          EARLY_EXODUS_8,
          EARLY_EXODUS_8,
          LATE_EXODUS_8_IN_LAND,
          LATE_EXODUS_8_NOT_FAR,
        ]),
      },
      {
        url: "https://www.biblegateway.com/passage/?search=Exodus%2010&version=KJV",
        title: "BibleGateway Exodus 10 (KJV)",
        sourceType: "scripture-reference",
        relevanceScore: 95,
        extractedText: [
          EARLY_EXODUS_10,
          LATE_EXODUS_10_CHILDREN,
          LATE_EXODUS_10_LIVESTOCK,
        ].join(" "),
        chunks: chunks("Exodus 10", [
          EARLY_EXODUS_10,
          EARLY_EXODUS_10,
          LATE_EXODUS_10_CHILDREN,
          LATE_EXODUS_10_LIVESTOCK,
        ]),
      },
      {
        url: "https://www.biblegateway.com/passage/?search=Exodus%205&version=KJV",
        title: "BibleGateway Exodus 5 (KJV)",
        sourceType: "scripture-reference",
        relevanceScore: 95,
        extractedText:
          "Let my people go. Ye shall no more give the people straw to make brick.",
        chunks: chunks("Exodus 5", [
          "Let my people go. Ye shall no more give the people straw to make brick.",
          "Pharaoh said, Who is the Lord, that I should obey his voice to let Israel go?",
        ]),
      },
    ];

    const naive = selectSourceBalancedEvidence(documents, 3);
    expect(
      naive.evidence.some((row) =>
        /not (?:go )?very far/i.test(row.extractedText),
      ),
    ).toBe(false);
    expect(
      naive.evidence.some((row) =>
        /flocks and your herds|herds be stayed/i.test(row.extractedText),
      ),
    ).toBe(false);

    const plan = buildScriptureTeachingPlan(
      MISSION_006_TEACHING_BRIEF,
      "bible-stories",
    );
    expect(plan).not.toBeNull();
    const teaching = selectTeachingBalancedEvidence(
      documents,
      teachingEvidenceRelevancePatterns(plan!),
      RESEARCH_MAX_UNIQUE_AUDIT_PASSAGES,
      plan!.requiredRefs,
    );
    expect(
      teaching.evidence.some((row) =>
        /not (?:go )?very far/i.test(row.extractedText),
      ),
    ).toBe(true);
    expect(
      teaching.evidence.some((row) =>
        /flocks and your herds|herds be stayed/i.test(row.extractedText),
      ),
    ).toBe(true);
    expect(
      teaching.evidence.some((row) => /in the land/i.test(row.extractedText)),
    ).toBe(true);
    expect(
      teaching.evidence.some((row) => /little ones/i.test(row.extractedText)),
    ).toBe(true);

    const coverage = assessEvidenceTeachingCoverage(teaching.evidence, plan!);
    expect(coverage.missingMovements).toEqual([]);
    // Supporting NT chapters are out of scope for this Exodus-only fixture;
    // chapter keys for Exodus 5/8/10 must still be present.
    expect(coverage.coveredChapterKeys).toEqual(
      expect.arrayContaining(["exodus-5", "exodus-8", "exodus-10"]),
    );
  });

  it("3. Evidence gate rejects URL-only chapter hits without movement text", () => {
    const plan = buildScriptureTeachingPlan(
      MISSION_006_TEACHING_BRIEF,
      "bible-stories",
    );
    const frogOnly = [
      evidence(
        "ex8-early",
        "BibleGateway Exodus 8 (KJV)",
        "https://www.biblegateway.com/passage/?search=Exodus%208&version=KJV",
        EARLY_EXODUS_8,
      ),
      evidence(
        "ex5",
        "BibleGateway Exodus 5 (KJV)",
        "https://www.biblegateway.com/passage/?search=Exodus%205&version=KJV",
        "Ye shall no more give the people straw to make brick.",
      ),
      evidence(
        "ex10-early",
        "BibleGateway Exodus 10 (KJV)",
        "https://www.biblegateway.com/passage/?search=Exodus%2010&version=KJV",
        EARLY_EXODUS_10,
      ),
    ];
    const coverage = assessEvidenceTeachingCoverage(frogOnly, plan!);
    expect(coverage.ok).toBe(false);
    expect(coverage.missingMovements).toEqual(
      expect.arrayContaining([
        "exodus-8-in-land",
        "exodus-8-not-far",
        "exodus-10-children",
        "exodus-10-livestock",
      ]),
    );
  });

  it("4. Completeness gate still rejects deliberately incomplete drafts", () => {
    const plan = buildScriptureTeachingPlan(
      MISSION_006_TEACHING_BRIEF,
      "bible-stories",
    );
    const incomplete = `
## Increased bondage (Exodus 5:1-9)
Pharaoh laid more work with straw and brick.

## Supporting
Romans 12:1-2 and Colossians 3:1-4.
`;
    const coverage = assessArticleTeachingCoverage(incomplete, plan!);
    expect(coverage.ok).toBe(false);
    expect(coverage.missingMovements.length).toBeGreaterThan(0);
    const brief = formatMissingCoverageRevisionBrief(plan!, coverage);
    expect(brief).toMatch(/not very far|Exodus 8:28/i);
    expect(brief).toMatch(/livestock|Exodus 10:24/i);
  });

  it("5. Complete five-movement article still passes the gate", () => {
    const plan = buildScriptureTeachingPlan(
      MISSION_006_TEACHING_BRIEF,
      "bible-stories",
    );
    const complete = `
## Movement 1 — Increased suffering (Exodus 5:1-9)
Pharaoh refused and laid more work on Israel with straw and brick bondage after Let my people go.

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
    expect(assessArticleTeachingCoverage(complete, plan!).ok).toBe(true);
  });

  it("6. Single-passage bible briefs do not force Exodus movements", () => {
    const plan = buildScriptureTeachingPlan(
      "1 Samuel 17 David and Goliath",
      "bible-stories",
    );
    expect(plan?.movements).toEqual([]);
    expect(plan?.requiredChapterKeys).toEqual(["1-samuel-17"]);
  });

  it("7. Non-bible topics still skip teaching plans", () => {
    expect(
      buildScriptureTeachingPlan("AI automation workflows", "ai-automation"),
    ).toBeNull();
  });
});
