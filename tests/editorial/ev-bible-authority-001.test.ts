import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  EV_BIBLE_AUTHORITY_CONTRACT_ID,
  EV_BIBLE_AUTHORITY_CONTRACT_VERSION,
  EV_BIBLE_AUTHORITY_REQUIREMENTS,
  allVerifiedBibleAuthorityRulesPassed,
  evaluateVerifiedBibleAuthorityRules,
} from "../../lib/research/ev-bible-authority-001";
import {
  EV_BIBLE_AUTHORITY_CONTRACT_ID as EXPORTED_ID,
  claimAllowsEvidence,
  isPrimaryScriptureClaim,
  resolveClaimSourceBinding,
} from "../../lib/research/claim-source-attribution";
import { bibleExtractor } from "../../lib/research/bible-extractor";
import {
  ARTICLE_3_SOURCES,
  BIBLEGATEWAY_URL,
  BIBLEPROJECT_KING_DAVID_URL,
  BIBLEPROJECT_SAMUEL_GUIDE_URL,
  KING_DAVID_ARMOUR_CLAIM,
  SCRIPTURE_ARMIES_CLAIM,
} from "../fixtures/research-audit/article-3";

const LISTED_SOURCES = ARTICLE_3_SOURCES.map((source) => ({
  url: source.url,
  title: source.title,
  publisher: source.publisher,
}));

function read(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("EV-BIBLE-AUTHORITY-001 contract artifact", () => {
  it("is version-controlled under docs/editorial with matching machine IDs", () => {
    const doc = read("docs/editorial/EV-BIBLE-AUTHORITY-001.md");
    expect(doc).toContain(EV_BIBLE_AUTHORITY_CONTRACT_ID);
    expect(doc).toContain(`Version:** \`${EV_BIBLE_AUTHORITY_CONTRACT_VERSION}\``);
    for (const requirement of EV_BIBLE_AUTHORITY_REQUIREMENTS) {
      expect(doc).toContain(requirement);
    }
    expect(doc).toContain("Proposed Director decisions");
    expect(doc).toMatch(/does \*\*not\*\* invent new theology/i);
    expect(EXPORTED_ID).toBe(EV_BIBLE_AUTHORITY_CONTRACT_ID);
  });

  it("never claims automated theological certification", () => {
    const evaluation = evaluateVerifiedBibleAuthorityRules({
      claim: SCRIPTURE_ARMIES_CLAIM,
      listedSources: LISTED_SOURCES,
      candidateSources: LISTED_SOURCES,
    });
    expect(evaluation.certifiesTheology).toBe(false);
    expect(evaluation.contractId).toBe("EV-BIBLE-AUTHORITY-001");
  });
});

describe("EV-BIBLE-AUTHORITY-001 verified attribution safeguards", () => {
  it("BA-R1/R2/R3: primary-scripture binds exclusively to BibleGateway and rejects BibleProject", () => {
    const binding = resolveClaimSourceBinding(SCRIPTURE_ARMIES_CLAIM, LISTED_SOURCES);
    expect(isPrimaryScriptureClaim(SCRIPTURE_ARMIES_CLAIM)).toBe(true);
    expect(binding.role).toBe("primary-scripture");
    expect(binding.exclusiveDocumentKey).toBe("1-samuel-17");
    expect(claimAllowsEvidence(SCRIPTURE_ARMIES_CLAIM, LISTED_SOURCES[0], LISTED_SOURCES)).toBe(
      true,
    );
    expect(claimAllowsEvidence(SCRIPTURE_ARMIES_CLAIM, LISTED_SOURCES[1], LISTED_SOURCES)).toBe(
      false,
    );
    expect(claimAllowsEvidence(SCRIPTURE_ARMIES_CLAIM, LISTED_SOURCES[2], LISTED_SOURCES)).toBe(
      false,
    );

    const evaluation = evaluateVerifiedBibleAuthorityRules({
      claim: SCRIPTURE_ARMIES_CLAIM,
      listedSources: LISTED_SOURCES,
      candidateSources: LISTED_SOURCES,
    });
    expect(allVerifiedBibleAuthorityRulesPassed(evaluation)).toBe(true);
    expect(evaluation.results.find((result) => result.id === "BA-R3")?.ok).toBe(true);
  });

  it("BA-R2 fail-closed when listed sources omit BibleGateway", () => {
    const withoutGateway = LISTED_SOURCES.filter(
      (source) => source.url !== BIBLEGATEWAY_URL,
    );
    expect(
      claimAllowsEvidence(SCRIPTURE_ARMIES_CLAIM, withoutGateway[0], withoutGateway),
    ).toBe(false);
    const evaluation = evaluateVerifiedBibleAuthorityRules({
      claim: SCRIPTURE_ARMIES_CLAIM,
      listedSources: withoutGateway,
      candidateSources: withoutGateway,
    });
    expect(evaluation.results.find((result) => result.id === "BA-R2")?.ok).toBe(false);
    expect(allVerifiedBibleAuthorityRulesPassed(evaluation)).toBe(false);
  });

  it("BA-R4: named secondary documents do not substitute for each other", () => {
    expect(
      claimAllowsEvidence(KING_DAVID_ARMOUR_CLAIM, LISTED_SOURCES[2], LISTED_SOURCES),
    ).toBe(true);
    expect(
      claimAllowsEvidence(KING_DAVID_ARMOUR_CLAIM, LISTED_SOURCES[1], LISTED_SOURCES),
    ).toBe(false);

    const evaluation = evaluateVerifiedBibleAuthorityRules({
      claim: KING_DAVID_ARMOUR_CLAIM,
      listedSources: LISTED_SOURCES,
      candidateSources: [
        { url: BIBLEPROJECT_SAMUEL_GUIDE_URL, title: "Samuel guide" },
        { url: BIBLEPROJECT_KING_DAVID_URL, title: "King David article" },
      ],
    });
    expect(evaluation.results.find((result) => result.id === "BA-R4")?.ok).toBe(true);
  });

  it("BA-R5: ambiguous multi-document BibleProject publisher claims are flagged", () => {
    const claim =
      "According to BibleProject, the Samuel books warn against freezing David as a permanent hero.";
    const evaluation = evaluateVerifiedBibleAuthorityRules({
      claim,
      listedSources: LISTED_SOURCES,
      candidateSources: [
        { url: BIBLEPROJECT_SAMUEL_GUIDE_URL, title: "Samuel guide" },
        { url: BIBLEPROJECT_KING_DAVID_URL, title: "King David article" },
      ],
    });
    expect(evaluation.results.find((result) => result.id === "BA-R5")?.ok).toBe(false);
  });

  it("BA-R6: verse ranges parse for 1 Samuel 17 citations", () => {
    const claim = "According to 1 Samuel 17:32, David speaks to Saul.";
    const evaluation = evaluateVerifiedBibleAuthorityRules({
      claim,
      listedSources: LISTED_SOURCES,
      candidateSources: LISTED_SOURCES,
    });
    expect(evaluation.results.find((result) => result.id === "BA-R6")?.ok).toBe(true);
  });

  it("BA-R7: bibleExtractor remains a heuristic and does not emit primary-scripture claims", () => {
    const extracted = bibleExtractor(
      "David confronted Goliath with a sling while Saul watched the Philistine challenge.",
    );
    expect(extracted.claims.length).toBeGreaterThan(0);
    expect(extracted.claims.every((claim) => !isPrimaryScriptureClaim(claim))).toBe(true);
    const evaluation = evaluateVerifiedBibleAuthorityRules({
      claim: "David confronted Goliath with faith.",
      listedSources: [],
    });
    expect(evaluation.results.find((result) => result.id === "BA-R7")?.ok).toBe(true);
  });

  it("BA-R8: contract module and attribution path do not introduce a publish/approve bypass", () => {
    const contractSource = read("lib/research/ev-bible-authority-001.ts");
    const attributionSource = read("lib/research/claim-source-attribution.ts");
    expect(contractSource).not.toMatch(/transitionArticleLifecycle|status:\s*"approved"|status:\s*"published"/);
    expect(attributionSource).not.toMatch(/transitionArticleLifecycle|approveArticle|publishArticle/);
    expect(contractSource).toContain("certifiesTheology: false");
  });
});
