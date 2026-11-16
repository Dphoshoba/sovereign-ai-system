import { describe, expect, it, vi } from "vitest";
import {
  extractArticleClaims,
  isScriptureTextualClaim,
} from "../../lib/research/article-claim-extractor";
import {
  isPrimaryScriptureClaim,
  isPrimaryScriptureSource,
  isPrimaryScriptureSourceForClaim,
  resolveClaimSourceBinding,
} from "../../lib/research/claim-source-attribution";
import { fallbackSources } from "../../lib/research/fallback-source-provider";
import { parseScriptureVerseRanges } from "../../lib/research/scripture-verse-locator";
import { sourceCollector } from "../../lib/research/source-collector";

vi.mock("../../lib/research/search-adapter", () => ({
  searchAdapter: vi.fn(async () => []),
}));

describe("Mission 006R scripture editorial reliability", () => {
  it("never substitutes David and Goliath sources for an Exodus topic", async () => {
    const fallback = fallbackSources(
      "The Devil's Tactics: Pharaoh's counterplans in Exodus against Israel's deliverance",
      "bible-stories",
    );
    expect(fallback.length).toBeGreaterThan(0);
    expect(fallback.every((source) => /exodus/i.test(source.url + source.title))).toBe(
      true,
    );
    expect(fallback.some((source) => /1.?samuel|goliath|david/i.test(source.url))).toBe(
      false,
    );

    const collected = await sourceCollector(
      "Pharaoh Exodus 5:1-9 bondage tactics for Christians",
      [],
      "bible-stories",
    );
    expect(collected.sourceCount).toBeGreaterThan(0);
    expect(
      collected.collectedSources.some((source) => /1.?samuel|goliath/i.test(source.url)),
    ).toBe(false);
    expect(
      collected.collectedSources.some((source) => /exodus/i.test(source.url)),
    ).toBe(true);
  });

  it("fails safe with no sources when a bible topic has no recoverable subject", () => {
    expect(fallbackSources("a vague spiritual feeling", "bible-stories")).toEqual([]);
  });

  it("still recovers 1 Samuel 17 only when the topic asks for David and Goliath", () => {
    const sources = fallbackSources("David and Goliath courage", "bible-stories");
    expect(sources.some((source) => /1.?samuel.*17|samuel%2017/i.test(source.url))).toBe(
      true,
    );
  });

  it("identifies scripture quotations and passage descriptions as auditable claims", () => {
    const content = `
## Tactic 1 — Increase suffering (Exodus 5:1-9)

Moses and Aaron deliver the Lord's command: "Let my people go, that they may hold a feast unto me in the wilderness" (Exodus 5:1).
According to Exodus 8:28, Pharaoh said Israel shall not go very far away.
Christians today should start with prayer and refuse compromise.
The devil secretly invented a sixth tactic in Alexandria in 200 BC.
`;
    const extraction = extractArticleClaims({
      title: "The Devil's Tactics to Hold Us in Bondage",
      excerpt: "Pharaoh's counterplans teach vigilance.",
      content,
    });

    expect(extraction.claimCount).toBeGreaterThanOrEqual(2);
    expect(
      extraction.claims.some((claim) => /Let my people go/i.test(claim.claim)),
    ).toBe(true);
    expect(
      extraction.claims.some((claim) => /Exodus 8:28/i.test(claim.claim)),
    ).toBe(true);
    expect(
      extraction.claims.some((claim) => /start with prayer/i.test(claim.claim)),
    ).toBe(false);
    expect(
      extraction.authorialAssertions.some((claim) =>
        /start with prayer/i.test(claim.claim),
      ),
    ).toBe(true);
    expect(
      isScriptureTextualClaim(
        'Moses said "Let my people go" (Exodus 5:1).',
      ),
    ).toBe(true);
    expect(
      isScriptureTextualClaim(
        "Christians today should start with prayer when pressure rises.",
      ),
    ).toBe(false);
  });

  it("keeps unsupported biblical assertions from becoming independently verified facts", () => {
    expect(
      isScriptureTextualClaim(
        "Every Christian historian agrees Pharaoh was Satan incarnate in 1446 BC.",
      ),
    ).toBe(false);
    expect(
      isPrimaryScriptureClaim(
        "Every Christian historian agrees Pharaoh was Satan incarnate in 1446 BC.",
      ),
    ).toBe(false);
  });

  it("binds Exodus claims to Exodus scripture hosts and parses verse ranges", () => {
    const claim =
      "According to Exodus 5:1-9, Pharaoh intensified Israel's workload after Moses demanded their release.";
    expect(isPrimaryScriptureClaim(claim)).toBe(true);
    expect(parseScriptureVerseRanges(claim)).toEqual([{ start: 1, end: 9 }]);

    const exodusSource = {
      url: "https://www.biblegateway.com/passage/?search=Exodus%205&version=KJV",
      title: "BibleGateway Exodus 5 (KJV)",
    };
    const samuelSource = {
      url: "https://www.biblegateway.com/passage/?search=1%20Samuel%2017&version=KJV",
      title: "BibleGateway 1 Samuel 17",
    };
    expect(isPrimaryScriptureSource(exodusSource)).toBe(true);
    expect(isPrimaryScriptureSourceForClaim(exodusSource, claim)).toBe(true);
    expect(isPrimaryScriptureSourceForClaim(samuelSource, claim)).toBe(false);

    const binding = resolveClaimSourceBinding(claim, [exodusSource, samuelSource]);
    expect(binding.role).toBe("primary-scripture");
    expect(binding.exclusiveDocumentKey).toBe("exodus-5");
    expect(binding.exclusiveUrl).toContain("Exodus");
  });

  it("still recognizes legacy According to 1 Samuel 17 claims", () => {
    const claim =
      "According to 1 Samuel 17, Jesse's youngest son remains with the sheep at Bethlehem.";
    expect(isPrimaryScriptureClaim(claim)).toBe(true);
    expect(parseScriptureVerseRanges(claim).length).toBeGreaterThanOrEqual(0);
  });
});
