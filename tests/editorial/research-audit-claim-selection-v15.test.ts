import { describe, expect, it } from "vitest";
import {
  partitionAssociatedArticleAudits,
  RESEARCH_AUDIT_FINGERPRINT_ACTION,
  serializeArticleAuditAssociation,
} from "../../lib/research/article-audit-association";
import { computeArticleAuditFingerprint } from "../../lib/research/article-audit-fingerprint";
import {
  CLAIM_BATCH_LIMIT,
  extractArticleClaims,
  FACTUAL_CLAIM_CEILING,
  FACTUAL_CLAIM_LIMIT,
  recommendationWithUnscoredClaims,
} from "../../lib/research/article-claim-extractor";
import { publishersNamedInClaim } from "../../lib/research/claim-source-attribution";
import { recommendationWithEvidenceCompleteness } from "../../lib/research/evidence-completeness";
import { namedProductFeatures } from "../../lib/research/product-identity";
import {
  CURRENT_RESEARCH_AUDIT_ENGINE_REVISION,
  isCurrentResearchAuditEngineRevision,
  isResearchAuditEngineRevision,
} from "../../lib/research/research-audit-engine-revision";
import {
  publicationGuard,
  researchPublicationBlockReason,
} from "../../lib/publishing/publication-guard";
import {
  AI_INBOX_ANTECEDENT,
  balancedSelectionArticle,
  COUNTRY_RESTRICTION,
  countryRestrictionArticle,
  documentOrderArticle,
  EMAIL_HEADING,
  HELP_ME_WRITE_ANTECEDENT,
  INVOICE_HEADING,
  ordinaryClaim,
  OUTLOOK_ANTECEDENT,
  PRIORITY_EXCERPTS,
  QUICKBOOKS_ANTECEDENT,
} from "../fixtures/research-audit/claim-selection-v15";

function extracted(content: string) {
  return extractArticleClaims({
    content,
    factualClaimLimit: FACTUAL_CLAIM_CEILING,
  });
}

function countryClaims() {
  return extracted(countryRestrictionArticle()).claims.filter(
    (claim) => claim.articleExcerpt === COUNTRY_RESTRICTION,
  );
}

describe("antecedent-scoped deduplication", () => {
  it("keeps the same country restriction for Help me write and Gmail AI Inbox", () => {
    const claims = countryClaims();
    const helpMeWrite = claims.find((claim) => claim.claim.includes("Help me write"));
    const aiInbox = claims.find((claim) => claim.claim.includes("AI Inbox"));

    expect(helpMeWrite?.articleExcerpt).toBe(COUNTRY_RESTRICTION);
    expect(helpMeWrite?.claim).toContain(HELP_ME_WRITE_ANTECEDENT);
    expect(namedProductFeatures(helpMeWrite?.claim ?? "")).toEqual(["Help me write"]);
    expect(publishersNamedInClaim(helpMeWrite?.claim ?? "")).toContain("google");

    expect(aiInbox?.articleExcerpt).toBe(COUNTRY_RESTRICTION);
    expect(aiInbox?.claim).toContain(AI_INBOX_ANTECEDENT);
    expect(namedProductFeatures(aiInbox?.claim ?? "")).toEqual(["AI Inbox"]);
    expect(publishersNamedInClaim(aiInbox?.claim ?? "")).toContain("google");
    expect(aiInbox?.claim).not.toContain("Help me write");
  });

  it("keeps the same country restriction for QuickBooks", () => {
    const quickbooks = countryClaims().find((claim) => claim.claim.includes("QuickBooks"));

    expect(quickbooks?.articleExcerpt).toBe(COUNTRY_RESTRICTION);
    expect(quickbooks?.claim).toContain(QUICKBOOKS_ANTECEDENT);
    expect(publishersNamedInClaim(quickbooks?.claim ?? "")).toContain("intuit");
    expect(namedProductFeatures(quickbooks?.claim ?? "")).not.toContain("Help me write");
    expect(quickbooks?.heading).toBe(INVOICE_HEADING);
  });

  it("still deduplicates an exact repeat inside one product context", () => {
    const helpMeWrite = countryClaims().filter((claim) =>
      claim.claim.includes("Help me write"),
    );

    expect(helpMeWrite).toHaveLength(1);
    expect(helpMeWrite[0]?.claim).toContain(HELP_ME_WRITE_ANTECEDENT);
  });

  it("does not merge a publisher-only restriction with a named-feature restriction", () => {
    const claims = countryClaims();
    const outlook = claims.find((claim) => claim.claim.includes(OUTLOOK_ANTECEDENT));
    const helpMeWrite = claims.find((claim) => claim.claim.includes("Help me write"));

    expect(outlook?.articleExcerpt).toBe(COUNTRY_RESTRICTION);
    expect(namedProductFeatures(outlook?.claim ?? "")).toEqual([]);
    expect(publishersNamedInClaim(outlook?.claim ?? "")).toContain("microsoft");
    expect(outlook?.claim).not.toContain("Help me write");
    expect(helpMeWrite?.claim).not.toContain(OUTLOOK_ANTECEDENT);
  });

  it("keeps each retained continuation attached to its own antecedent", () => {
    const claims = countryClaims();
    const antecedents = [
      HELP_ME_WRITE_ANTECEDENT,
      AI_INBOX_ANTECEDENT,
      QUICKBOOKS_ANTECEDENT,
      OUTLOOK_ANTECEDENT,
    ];

    expect(claims).toHaveLength(antecedents.length);
    for (const antecedent of antecedents) {
      const claim = claims.find((item) => item.claim.includes(antecedent));
      expect(claim?.articleExcerpt).toBe(COUNTRY_RESTRICTION);
      expect(claim?.claim.startsWith(antecedent)).toBe(true);
      expect(claim?.claim).not.toBe(claim?.articleExcerpt);
    }
  });
});

describe("balanced safety-first selection", () => {
  it("selects safety, eligibility, and privacy claims from every later task", () => {
    const result = extracted(balancedSelectionArticle());
    const excerpts = result.claims.map((claim) => claim.articleExcerpt);

    expect(excerpts).toEqual(expect.arrayContaining([...PRIORITY_EXCERPTS]));
    expect(result.notScoredClaims.map((claim) => claim.text)).not.toEqual(
      expect.arrayContaining(PRIORITY_EXCERPTS.map((excerpt) => expect.stringContaining(excerpt))),
    );
  });

  it("does not let the first task consume the remaining slots before later priority claims", () => {
    const result = extracted(balancedSelectionArticle());
    const emailClaims = result.claims.filter((claim) => claim.heading === EMAIL_HEADING);
    const laterPriority = result.claims.filter((claim) =>
      PRIORITY_EXCERPTS.some((excerpt) => claim.articleExcerpt === excerpt && claim.heading !== EMAIL_HEADING),
    );

    expect(emailClaims.length).toBeLessThan(30);
    expect(laterPriority.map((claim) => claim.articleExcerpt)).toEqual(
      expect.arrayContaining(PRIORITY_EXCERPTS.filter((excerpt) => excerpt !== "Prompt retention on that hub is admin-controlled.")),
    );
  });

  it("fills leftover slots in document order after the priority claims", () => {
    const result = extracted(balancedSelectionArticle());
    const numbers = result.claims
      .map((claim) => claim.articleExcerpt)
      .filter((excerpt) => excerpt.startsWith("The draft can mention ledger alpha"))
      .map((excerpt) => Number(excerpt.match(/alpha(\d+)/)?.[1]));

    expect(result.claims.map((claim) => claim.articleExcerpt)).toEqual(
      expect.arrayContaining([...PRIORITY_EXCERPTS]),
    );
    expect(numbers).toEqual([...numbers].sort((left, right) => left - right));
    expect(numbers[0]).toBe(1);
  });

  it("selects the same claims on a repeated run", () => {
    const article = balancedSelectionArticle();
    expect(extracted(article)).toEqual(extracted(article));
  });

  it("never selects more than 36 claims and records the remainder", () => {
    const result = extracted(balancedSelectionArticle());

    expect(FACTUAL_CLAIM_CEILING).toBe(36);
    expect(result.claims.length).toBeLessThanOrEqual(36);
    expect(result.claims.length).toBe(36);
    expect(result.notScoredClaims.length).toBeGreaterThan(0);
    expect(result.claims.length + result.notScoredClaims.length).toBe(43);
  });

  it("keeps ordinary claims eligible when room remains", () => {
    const result = extracted(documentOrderArticle());

    expect(result.claims.map((claim) => claim.articleExcerpt)).toEqual([
      OUTLOOK_ANTECEDENT,
      ordinaryClaim(1),
      ordinaryClaim(2),
    ]);
    expect(result.notScoredClaims).toEqual([]);
  });

  it("keeps a short article in stable document order", () => {
    const first = extracted(documentOrderArticle());
    const second = extracted(documentOrderArticle());

    expect(second.claims.map((claim) => claim.claim)).toEqual(
      first.claims.map((claim) => claim.claim),
    );
    expect(first.claims[1]?.articleExcerpt).toBe(ordinaryClaim(1));
    expect(first.claims[2]?.articleExcerpt).toBe(ordinaryClaim(2));
  });
});

describe("selection publication governance", () => {
  it("turns publish-ready into review-required when any claim is unscored", () => {
    const unscored = [{ text: "Unstructured data is not supported.", section: "7. Business reporting" }];
    const verified = [
      {
        verificationStatus: "verified" as const,
        supportingSources: [{ sourceUrl: "https://example.com/source" }],
      },
    ];

    expect(recommendationWithUnscoredClaims("publish-ready", unscored)).toBe("review-required");
    expect(recommendationWithEvidenceCompleteness("publish-ready", verified, unscored)).toBe(
      "review-required",
    );
    expect(recommendationWithUnscoredClaims("publish-ready", [])).toBe("publish-ready");
  });

  it("keeps an older engine revision historical when the fingerprint still matches", () => {
    const article = {
      id: "article-2",
      title: "Tasks",
      category: "ai-automation",
      content: "Body",
    };
    const sourceUrls = ["https://example.com/source"];
    const fingerprint = computeArticleAuditFingerprint(article, sourceUrls);
    const createdAt = new Date("2026-11-03T22:59:28.907Z");
    const audits = [
      { id: "historical-v13", articleId: article.id, createdAt },
      { id: "current-v14", articleId: article.id, createdAt },
    ];
    const note = (auditId: string, engineRevision: string) => ({
      action: RESEARCH_AUDIT_FINGERPRINT_ACTION,
      note: serializeArticleAuditAssociation({
        auditId,
        contentFingerprint: fingerprint,
        createdAt,
        engineRevision,
      }),
    });

    const partitioned = partitionAssociatedArticleAudits(article, sourceUrls, audits, [
      note("historical-v13", "article-grounded-v13"),
      note("current-v14", "article-grounded-v14"),
    ]);
    const staleOnly = partitionAssociatedArticleAudits(article, sourceUrls, [audits[0]], [
      note("historical-v13", "article-grounded-v13"),
    ]);
    const staleContent = partitionAssociatedArticleAudits(
      { ...article, content: "Changed body" },
      sourceUrls,
      [audits[1]],
      [note("current-v14", "article-grounded-v14")],
    );

    expect(CURRENT_RESEARCH_AUDIT_ENGINE_REVISION).toBe("article-grounded-v14");
    expect(isResearchAuditEngineRevision("article-grounded-v13")).toBe(true);
    expect(isCurrentResearchAuditEngineRevision("article-grounded-v13")).toBe(false);
    expect(partitioned.current?.id).toBe("current-v14");
    expect(partitioned.historical.map((audit) => audit.id)).toEqual(["historical-v13"]);
    expect(staleOnly.current).toBeNull();
    expect(staleOnly.historical.map((audit) => audit.id)).toEqual(["historical-v13"]);
    expect(staleContent.current).toBeNull();
    expect(staleContent.historical.map((audit) => audit.id)).toEqual(["current-v14"]);
  });

  it("blocks approval, scheduling, and publication without a current publish-ready audit", () => {
    expect(publicationGuard("approved", { hasCurrentAudit: false }).allowed).toBe(false);
    expect(publicationGuard("scheduled", { hasCurrentAudit: false }).allowed).toBe(false);
    expect(publicationGuard("review-required", { hasCurrentAudit: true }).allowed).toBe(false);
    expect(researchPublicationBlockReason(null)).toContain("publish-ready");
    expect(
      researchPublicationBlockReason({
        consensusScore: 100,
        sourceQualityScore: 90,
        publicationRecommendation: "review-required",
      }),
    ).toBe("Current research audit is not publish-ready.");
    expect(
      researchPublicationBlockReason({
        consensusScore: 79,
        sourceQualityScore: 90,
        publicationRecommendation: "publish-ready",
      }),
    ).toBe("Current research audit is not publish-ready.");
  });

  it("leaves the 36-claim ceiling unchanged", () => {
    expect(FACTUAL_CLAIM_LIMIT).toBe(12);
    expect(CLAIM_BATCH_LIMIT).toBe(3);
    expect(FACTUAL_CLAIM_CEILING).toBe(36);
    expect(CURRENT_RESEARCH_AUDIT_ENGINE_REVISION).toBe("article-grounded-v14");
  });
});
