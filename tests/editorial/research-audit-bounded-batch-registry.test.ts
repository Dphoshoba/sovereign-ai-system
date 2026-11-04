import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { selectClaimAwareEvidence } from "../../lib/research/claim-evidence-selector";
import {
  collectBoundedBatchEvidence,
  evidenceRegistry,
} from "../../lib/research/evidence-registry";
import { CURRENT_RESEARCH_AUDIT_ENGINE_REVISION } from "../../lib/research/research-audit-engine-revision";
import {
  emptyDiagnostic,
  sourceIdFromTitle,
} from "../../lib/research/source-acquisition";
import type { SourceRecord } from "../../lib/research/source-collector";

const VENDOR_URL = "https://example.com/vendor-report";
const GOOGLE_URL = "https://support.google.com/mail/answer/scheduling";
const MICROSOFT_URL = "https://support.microsoft.com/office/outlook-draft";

function claimText(index: number): string {
  return `The vendor report says markerwordalpha${index} confirms markerwordbeta${index} retrieved markerwordgamma${index} from the isolated ledger entry numbered ${index}.`;
}

function claimSentence(index: number, window: number): string {
  return `${claimText(index)} Window ${window} keeps this ledger statement intact for evidence selection.`;
}

function claims(count: number): string[] {
  return Array.from({ length: count }, (_, index) => claimText(index));
}

function articleText(count: number): string {
  const lines: string[] = [];
  for (let index = 0; index < count; index += 1) {
    lines.push(claimSentence(index, 1), claimSentence(index, 2));
  }
  return lines.join("\n");
}

function source(url: string, title: string): SourceRecord {
  return {
    title,
    url,
    sourceType: "industry-research",
    relevanceScore: 80,
  };
}

function countingFetch(pages: Record<string, string>) {
  const calls: Record<string, number> = {};
  const fetchContent = async (url: string, title: string) => {
    calls[url] = (calls[url] ?? 0) + 1;
    const extractedText = pages[url] ?? "";
    const category = extractedText ? "accepted" : "html_extraction_empty";
    return {
      title,
      url,
      extractedText,
      fetchStatus: extractedText ? "success" : "failed",
      contentKind: "html" as const,
      diagnostic: {
        ...emptyDiagnostic(
          sourceIdFromTitle(title, url),
          url,
          category,
          extractedText ? "" : "No article text could be read from this page.",
        ),
        extractedCharacterCount: extractedText.length,
      },
    };
  };
  return { fetchContent, calls };
}

describe("bounded batch evidence registry", () => {
  it("fetches one configured URL once across three batches", async () => {
    const claimTexts = claims(36);
    const fetched = countingFetch({ [VENDOR_URL]: articleText(36) });
    const result = await collectBoundedBatchEvidence(
      "Vendor report",
      [source(VENDOR_URL, "Vendor report")],
      {
        claimTexts,
        fetchContent: fetched.fetchContent,
      },
    );

    expect(fetched.calls).toEqual({ [VENDOR_URL]: 1 });
    expect(result.batches.map((batch) => batch.claimCount)).toEqual([12, 12, 12]);
    expect(result.mappings).toHaveLength(36);
    expect(result.overflowClaims).toEqual([]);
    expect(result.unsupportedClaims).toEqual([]);
    expect(result.evidenceCount).toBe(72);
  });

  it("selects evidence for every claim in a 25-claim article", async () => {
    const claimTexts = claims(25);
    const fetched = countingFetch({ [VENDOR_URL]: articleText(25) });
    const result = await collectBoundedBatchEvidence(
      "Vendor report",
      [source(VENDOR_URL, "Vendor report")],
      { claimTexts, fetchContent: fetched.fetchContent },
    );

    expect(fetched.calls[VENDOR_URL]).toBe(1);
    expect(result.batches.map((batch) => batch.claimCount)).toEqual([12, 12, 1]);
    expect(result.mappings.map((mapping) => mapping.claim)).toEqual(claimTexts);
    expect(result.mappings.every((mapping) => mapping.evidenceIds.length === 2)).toBe(
      true,
    );
    expect(result.evidenceCount).toBe(50);
    expect(result.factualClaimCount).toBe(25);
    expect(result.mappedClaimCount).toBe(25);
  });

  it("leaves claim 37 as overflow and does not score it", async () => {
    const claimTexts = claims(37);
    const fetched = countingFetch({ [VENDOR_URL]: articleText(37) });
    const result = await collectBoundedBatchEvidence(
      "Vendor report",
      [source(VENDOR_URL, "Vendor report")],
      { claimTexts, fetchContent: fetched.fetchContent },
    );

    expect(result.batches).toHaveLength(3);
    expect(result.mappings).toHaveLength(36);
    expect(result.overflowClaims).toEqual([claimText(36)]);
    expect(result.mappings.some((mapping) => mapping.claim === claimText(36))).toBe(
      false,
    );
    expect(result.factualClaimCount).toBe(36);
  });

  it("keeps one record when claims in different batches share a passage", async () => {
    const claimTexts = claims(13);
    const shared = `${claimText(0)} ${claimText(12)} This shared passage records both ledger statements together.`;
    const lines = [shared];
    for (const index of claimTexts.keys()) {
      lines.push(claimSentence(index, 1));
    }
    const fetched = countingFetch({ [VENDOR_URL]: lines.join("\n") });
    const result = await collectBoundedBatchEvidence(
      "Vendor report",
      [source(VENDOR_URL, "Vendor report")],
      { claimTexts, fetchContent: fetched.fetchContent },
    );
    const sharedRecords = result.evidence.filter(
      (record) => record.extractedText === shared,
    );
    expect(sharedRecords).toHaveLength(1);
    const sharedId = sharedRecords[0]?.id;
    expect(result.mappings[0]?.evidenceIds).toContain(sharedId);
    expect(result.mappings[12]?.evidenceIds).toContain(sharedId);
  });

  it("preserves publisher binding and leaves an unmatched claim unsupported", async () => {
    const supported =
      "Google says the scheduling page lets a recipient book a slot from the message after the invitation is sent.";
    const unsupported =
      "Google says the aurora ledger never exports the midnight archive to another mailbox.";
    const passage = `${supported} The page describes that booking step for the recipient in full.`;
    const fetched = countingFetch({
      [GOOGLE_URL]: passage,
      [MICROSOFT_URL]: passage,
    });
    const result = await collectBoundedBatchEvidence(
      "Scheduling",
      [source(GOOGLE_URL, "Google scheduling"), source(MICROSOFT_URL, "Microsoft Outlook")],
      {
        claimTexts: [supported, unsupported],
        listedSources: [
          { url: GOOGLE_URL, title: "Google scheduling" },
          { url: MICROSOFT_URL, title: "Microsoft Outlook" },
        ],
        fetchContent: fetched.fetchContent,
      },
    );

    expect(fetched.calls).toEqual({ [GOOGLE_URL]: 1, [MICROSOFT_URL]: 1 });
    expect(result.evidence.map((record) => record.sourceUrl)).toEqual([GOOGLE_URL]);
    expect(result.unsupportedClaims).toEqual([unsupported]);
    expect(result.overflowClaims).toEqual([]);
    expect(result.mappings[1]?.evidenceIds).toEqual([]);
  });

  it("rejects the combined result when any batch throws", async () => {
    const fetched = countingFetch({ [VENDOR_URL]: articleText(13) });
    let selections = 0;
    await expect(
      collectBoundedBatchEvidence(
        "Vendor report",
        [source(VENDOR_URL, "Vendor report")],
        {
          claimTexts: claims(13),
          fetchContent: fetched.fetchContent,
          selectBatch: (input) => {
            selections += 1;
            if (selections === 2) throw new Error("batch failed");
            return selectClaimAwareEvidence(input);
          },
        },
      ),
    ).rejects.toThrow("batch failed");
    expect(fetched.calls[VENDOR_URL]).toBe(1);
    expect(selections).toBe(2);
  });

  it("leaves the live registry on one selection pass and the v11 prepare path unwired", async () => {
    const claimTexts = claims(25);
    const fetched = countingFetch({ [VENDOR_URL]: articleText(25) });
    const live = await evidenceRegistry(
      "Vendor report",
      [source(VENDOR_URL, "Vendor report")],
      {
        claimTexts,
        fetchContent: fetched.fetchContent,
      },
    );

    expect(fetched.calls[VENDOR_URL]).toBe(1);
    expect(live.evidenceCount).toBeLessThanOrEqual(24);
    expect(live.mappedClaimCount).toBeLessThan(25);
    expect(live).not.toHaveProperty("overflowClaims");

    const prepare = readFileSync("lib/research/prepare-article-for-review.ts", "utf8");
    expect(prepare).toContain("deps.collectEvidence ?? collectBoundedBatchEvidence");
    expect(prepare).not.toContain("deps.collectEvidence ?? evidenceRegistry");
    expect(CURRENT_RESEARCH_AUDIT_ENGINE_REVISION).toBe("article-grounded-v13");
  });
});
