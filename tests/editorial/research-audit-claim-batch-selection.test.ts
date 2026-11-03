import { describe, expect, it } from "vitest";
import {
  CLAIM_BATCH_LIMIT,
  extractArticleClaims,
  FACTUAL_CLAIM_CEILING,
  FACTUAL_CLAIM_LIMIT,
  planClaimBatches,
} from "../../lib/research/article-claim-extractor";
import { groundedFactVerification } from "../../lib/research/claim-evidence-matcher";
import {
  selectClaimAwareEvidence,
  selectClaimEvidenceInBatches,
  type SelectableDocument,
} from "../../lib/research/claim-evidence-selector";
import { CURRENT_RESEARCH_AUDIT_ENGINE_REVISION } from "../../lib/research/research-audit-engine-revision";
import {
  RESEARCH_MAX_PASSAGES_PER_CLAIM,
  RESEARCH_MAX_UNIQUE_AUDIT_PASSAGES,
} from "../../lib/research/source-fetch-guard";

const VENDOR_URL = "https://example.com/vendor-report";
const GOOGLE_URL = "https://support.google.com/mail/answer/scheduling";
const MICROSOFT_URL = "https://support.microsoft.com/office/outlook-draft";
const NIST_PDF = "https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf";

const COMPOUND =
  "NIST says this is a natural result of models that predict likely next words, and that people may act on false content because it sounds confident.";
const NEXT_WORDS =
  "NIST says this is a natural result of models that predict likely next words in generated text.";
const ACT_ON_FALSE =
  "NIST says that people may act on false content because it sounds confident to a reader.";

function longClaim(index: number): string {
  return `The vendor report says markerwordalpha${index} confirms markerwordbeta${index} retrieved markerwordgamma${index} from the isolated ledger entry.`;
}

function claims(count: number): string[] {
  return Array.from({ length: count }, (_, index) => longClaim(index));
}

function documentFor(claimTexts: readonly string[]): SelectableDocument {
  const chunks = claimTexts.flatMap((claim, index) => [
    {
      id: `chunk-${index}-a`,
      text: `${claim} First isolated window remains specific to this ledger entry.`,
      wordCount: 24,
    },
    {
      id: `chunk-${index}-b`,
      text: `${claim} Second isolated window remains specific to this ledger entry.`,
      wordCount: 24,
    },
  ]);
  return {
    url: VENDOR_URL,
    title: "Vendor report",
    sourceType: "industry-research",
    extractedText: chunks.map((chunk) => chunk.text).join(" "),
    chunks,
  };
}

function select(claimTexts: readonly string[], documents: SelectableDocument[]) {
  return selectClaimEvidenceInBatches({
    claims: claimTexts,
    documents,
    listedSources: documents.map((document) => ({
      url: document.url,
      title: document.title,
    })),
  });
}

describe("claim batch plan", () => {
  it("keeps the live cap at 12 and the new ceiling at three batches", () => {
    expect(FACTUAL_CLAIM_LIMIT).toBe(12);
    expect(CLAIM_BATCH_LIMIT).toBe(3);
    expect(FACTUAL_CLAIM_CEILING).toBe(36);
    expect(RESEARCH_MAX_PASSAGES_PER_CLAIM).toBe(2);
    expect(RESEARCH_MAX_UNIQUE_AUDIT_PASSAGES).toBe(24);
    expect(CURRENT_RESEARCH_AUDIT_ENGINE_REVISION).toBe("article-grounded-v11");
  });

  it.each([
    [12, [12], 0],
    [13, [12, 1], 0],
    [25, [12, 12, 1], 0],
    [36, [12, 12, 12], 0],
    [37, [12, 12, 12], 1],
  ])("plans %i claims into batches %j with %i overflow", (count, sizes, overflow) => {
    const planned = planClaimBatches(claims(count));
    expect(planned.batches.map((batch) => batch.claims.length)).toEqual(sizes);
    expect(planned.batches.map((batch) => batch.index)).toEqual(
      sizes.map((_, index) => index),
    );
    expect(planned.eligibleClaims).toHaveLength(count - overflow);
    expect(planned.overflowClaims).toHaveLength(overflow);
    expect(planned.batches.length).toBeLessThanOrEqual(CLAIM_BATCH_LIMIT);
    for (const batch of planned.batches) {
      expect(batch.claims.length).toBeLessThanOrEqual(FACTUAL_CLAIM_LIMIT);
    }
  });

  it("preserves input order instead of sorting claim text", () => {
    const ordered = [longClaim(9), longClaim(2), longClaim(5)];
    const planned = planClaimBatches(ordered);
    expect(planned.batches[0]?.claims).toEqual(ordered);
    expect(planClaimBatches(ordered)).toEqual(planned);
    expect(planned.overflowClaims).toEqual([]);
  });

  it("reports the 37th claim as overflow and leaves it unscored", () => {
    const planned = planClaimBatches(claims(37));
    expect(planned.overflowClaims).toEqual([longClaim(36)]);
    expect(planned.eligibleClaims).not.toContain(longClaim(36));
  });
});

describe("batch evidence union", () => {
  it("selects evidence for 12, 25, and 36 claims without a second 24-passage cut", () => {
    for (const count of [12, 25, 36]) {
      const claimTexts = claims(count);
      const selection = select(claimTexts, [documentFor(claimTexts)]);
      expect(selection.mappings).toHaveLength(count);
      expect(selection.unsupportedClaims).toEqual([]);
      expect(selection.overflowClaims).toEqual([]);
      expect(selection.uniquePassageCount).toBe(count * 2);
      expect(selection.batches.every((batch) => batch.uniquePassageCount <= 24)).toBe(
        true,
      );
      expect(selection.mappings.every((mapping) => mapping.evidenceIds.length === 2)).toBe(
        true,
      );
    }
  });

  it("keeps the 13th claim after the global top-24 slice would drop its passage", () => {
    const leading = claims(12);
    const trailing =
      "Tinyclaimalpha tinyclaimbeta tinyclaimgamma remains recorded in the annex.";
    const claimTexts = [...leading, trailing];
    const documents = [
      documentFor(leading),
      {
        url: VENDOR_URL,
        title: "Vendor report",
        sourceType: "industry-research",
        extractedText: trailing,
        chunks: [{ id: "chunk-tiny", text: trailing, wordCount: 8 }],
      },
    ];
    const listedSources = [{ url: VENDOR_URL, title: "Vendor report" }];
    const globalSelection = selectClaimAwareEvidence({
      claims: claimTexts,
      documents,
      listedSources,
    });
    const batched = selectClaimEvidenceInBatches({
      claims: claimTexts,
      documents,
      listedSources,
    });

    expect(globalSelection.bounded).toBe(true);
    expect(globalSelection.uniquePassageCount).toBe(24);
    expect(globalSelection.mappings[12]?.evidenceIds).toEqual([]);
    expect(batched.batches.map((batch) => batch.claimCount)).toEqual([12, 1]);
    expect(batched.uniquePassageCount).toBe(25);
    expect(batched.mappings[12]?.evidenceIds.length).toBe(1);
    expect(batched.unsupportedClaims).toEqual([]);
    expect(batched.overflowClaims).toEqual([]);
  });

  it("keeps one record when two claims in different batches share a passage", () => {
    const first = longClaim(0);
    const later = longClaim(12);
    const fillers = claims(12).slice(1);
    const claimTexts = [first, ...fillers, later];
    const shared = `${first} ${later}`;
    const chunks = [
      { id: "shared-passage", text: shared, wordCount: 40 },
      ...fillers.map((claim, index) => ({
        id: `filler-${index}`,
        text: `${claim} Isolated filler window remains specific.`,
        wordCount: 16,
      })),
    ];
    const selection = select(claimTexts, [
      {
        url: VENDOR_URL,
        title: "Vendor report",
        sourceType: "industry-research",
        extractedText: chunks.map((chunk) => chunk.text).join(" "),
        chunks,
      },
    ]);
    const sharedId = "vendor-report-shared-passage";
    expect(selection.mappings[0]?.evidenceIds).toContain(sharedId);
    expect(selection.mappings[12]?.evidenceIds).toContain(sharedId);
    expect(selection.evidence.filter((record) => record.id === sharedId)).toHaveLength(1);
    expect(
      selection.evidence.filter((record) => record.extractedText === shared),
    ).toHaveLength(1);
  });

  it("does not attach another publisher's passage to a claim", () => {
    const claim =
      "Google says the scheduling page lets a recipient book a slot from the message.";
    const passage = `${claim} The page describes that booking step for the recipient.`;
    const selection = selectClaimEvidenceInBatches({
      claims: [claim],
      documents: [
        {
          url: GOOGLE_URL,
          title: "Google scheduling",
          sourceType: "authority",
          extractedText: passage,
          chunks: [{ id: "google", text: passage, wordCount: 20 }],
        },
        {
          url: MICROSOFT_URL,
          title: "Microsoft Outlook",
          sourceType: "authority",
          extractedText: passage,
          chunks: [{ id: "microsoft", text: passage, wordCount: 20 }],
        },
      ],
      listedSources: [
        { url: GOOGLE_URL, title: "Google scheduling" },
        { url: MICROSOFT_URL, title: "Microsoft Outlook" },
      ],
    });
    expect(selection.unsupportedClaims).toEqual([]);
    expect(selection.evidence.map((record) => record.sourceUrl)).toEqual([GOOGLE_URL]);
    expect(selection.mappings[0]?.evidenceIds).toEqual(["google-scheduling-google"]);
  });

  it("records an eligible claim with no passage as unsupported, not overflow", () => {
    const supported =
      "Google says the scheduling page lets a recipient book a slot from the message.";
    const unsupported =
      "Google says the aurora ledger never exports the midnight archive.";
    const passage = `${supported} The page describes that booking step for the recipient.`;
    const selection = selectClaimEvidenceInBatches({
      claims: [supported, unsupported],
      documents: [
        {
          url: GOOGLE_URL,
          title: "Google scheduling",
          sourceType: "authority",
          extractedText: passage,
          chunks: [{ id: "google", text: passage, wordCount: 20 }],
        },
      ],
      listedSources: [{ url: GOOGLE_URL, title: "Google scheduling" }],
    });
    expect(selection.overflowClaims).toEqual([]);
    expect(selection.unsupportedClaims).toEqual([unsupported]);
    expect(selection.mappings[0]?.evidenceIds.length).toBeGreaterThan(0);
    expect(selection.mappings[1]?.evidenceIds).toEqual([]);
  });

  it("leaves claims above the ceiling out of evidence selection", () => {
    const claimTexts = claims(37);
    const selection = select(claimTexts, [documentFor(claimTexts)]);
    expect(selection.mappings).toHaveLength(36);
    expect(selection.overflowClaims).toEqual([longClaim(36)]);
    expect(selection.mappings.some((mapping) => mapping.claim === longClaim(36))).toBe(
      false,
    );
    expect(selection.batches).toHaveLength(3);
  });

  it("preserves compound-claim evidence selected by the current passage rules", () => {
    const documents: SelectableDocument[] = [
      {
        url: NIST_PDF,
        title: "NIST AI 600-1",
        sourceType: "government",
        extractedText: `${NEXT_WORDS} ${ACT_ON_FALSE}`,
        chunks: [
          { id: "next-words", text: NEXT_WORDS, wordCount: 20 },
          { id: "act-on-false", text: ACT_ON_FALSE, wordCount: 20 },
        ],
      },
    ];
    const listedSources = [{ url: NIST_PDF, title: "NIST AI 600-1" }];
    const direct = selectClaimAwareEvidence({
      claims: [COMPOUND],
      documents,
      listedSources,
    });
    const batched = selectClaimEvidenceInBatches({
      claims: [COMPOUND],
      documents,
      listedSources,
    });
    expect(batched.mappings).toEqual(direct.mappings);
    expect(batched.evidence.map((record) => record.id)).toEqual(
      direct.evidence.map((record) => record.id),
    );
    const articleClaim = {
      claim: COMPOUND,
      articleExcerpt: COMPOUND,
      section: "body" as const,
      blockType: "paragraph" as const,
      kind: "factual" as const,
    };
    const fromBatch = groundedFactVerification(
      [articleClaim],
      batched.evidence,
      COMPOUND,
      listedSources,
    );
    const fromDirect = groundedFactVerification(
      [articleClaim],
      direct.evidence,
      COMPOUND,
      listedSources,
    );
    expect(fromBatch.facts[0]?.verificationStatus).toBe(
      fromDirect.facts[0]?.verificationStatus,
    );
    expect(fromBatch.facts[0]?.supportingSources.map((source) => source.sourceUrl)).toEqual(
      fromDirect.facts[0]?.supportingSources.map((source) => source.sourceUrl),
    );
  });
});

describe("live article extraction", () => {
  it("still scores only 12 claims while the batch plan is unwired", () => {
    const sentences = Array.from({ length: 13 }, (_, index) => {
      return `Google says markerwordalpha${index} confirms markerwordbeta${index} for this isolated section.`;
    });
    const content = sentences
      .map((sentence, index) => `## Section ${index}\n\n${sentence}`)
      .join("\n\n");
    const extracted = extractArticleClaims({ content });
    expect(extracted.claimCount).toBe(FACTUAL_CLAIM_LIMIT);
    expect(extracted.notScoredClaims).toHaveLength(1);
    const planned = planClaimBatches(extracted.claims.map((claim) => claim.claim));
    expect(planned.batches).toHaveLength(1);
    expect(planned.overflowClaims).toEqual([]);
  });
});
