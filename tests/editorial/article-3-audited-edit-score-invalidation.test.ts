import { describe, expect, it, vi } from "vitest";
import { computeArticleAuditFingerprint } from "../../lib/research/article-audit-fingerprint";
import { serializeArticleAuditAssociation } from "../../lib/research/article-audit-association";
import { CURRENT_RESEARCH_AUDIT_ENGINE_REVISION } from "../../lib/research/research-audit-engine-revision";
import { resolveArticleAuditState } from "../../lib/research/current-article-audit";
import { extractArticleClaims } from "../../lib/research/article-claim-extractor";
import { updateArticleUnderGovernanceLock } from "../../lib/publishing/article-lifecycle";
import {
  ARTICLE_3_BODY,
  ARTICLE_3_EXCERPT,
  ARTICLE_3_SOURCES,
  ARTICLE_3_TITLE,
  SCRIPTURE_VOLUNTEERS_CLAIM,
} from "../fixtures/research-audit/article-3";
import { ARTICLE_3_SAMUEL_17_32_ALIGNED } from "./fixtures/article-3-17-32-correction";

const auditCreatedAt = new Date("2026-09-15T00:00:00.000Z");
const sourceUrls = ARTICLE_3_SOURCES.map((source) => source.url);

function createStore(article: Record<string, unknown>) {
  const tx = {
    $queryRaw: vi.fn(async () => [{ id: article.id }]),
    article: {
      findUnique: vi.fn(async () => article),
      update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        Object.assign(article, data);
        return article;
      }),
    },
  };
  return {
    store: {
      $transaction: async (fn: (client: typeof tx) => unknown) => fn(tx),
    },
    tx,
    article,
  };
}

describe("Article 3 audited 17:32 save score invalidation", () => {
  it("invalidates scores and keeps the 12-claim extraction after the aligned 17:32 save", async () => {
    const beforeContent = ARTICLE_3_BODY;
    const afterContent = ARTICLE_3_BODY.replace(
      SCRIPTURE_VOLUNTEERS_CLAIM,
      ARTICLE_3_SAMUEL_17_32_ALIGNED,
    );
    expect(afterContent).not.toBe(beforeContent);

    const beforeFingerprint = computeArticleAuditFingerprint(
      {
        title: ARTICLE_3_TITLE,
        excerpt: ARTICLE_3_EXCERPT,
        content: beforeContent,
        category: "faith",
        seoTitle: ARTICLE_3_TITLE,
        seoDescription: ARTICLE_3_EXCERPT,
        seoKeywords: "1 Samuel 17",
      },
      sourceUrls,
    );

    const article = {
      id: "article-3-fixture",
      title: ARTICLE_3_TITLE,
      excerpt: ARTICLE_3_EXCERPT,
      content: beforeContent,
      category: "faith",
      seoTitle: ARTICLE_3_TITLE,
      seoDescription: ARTICLE_3_EXCERPT,
      seoKeywords: "1 Samuel 17",
      featuredImage: null,
      status: "review-required",
      scheduledFor: null,
      publishedAt: null,
      approvedAt: null,
      approvedBy: null,
      editorialScore: 95,
      editorialGrade: "approval-candidate",
      editorialWarnings: [],
      qualityScore: 80,
      qualityGrade: "good",
      seoScore: 90,
      seoGrade: "excellent",
      researchSources: ARTICLE_3_SOURCES.map((source) => ({
        title: source.title,
        url: source.url,
        sourceType: "web",
        authorityScore: 90,
        trustScore: 90,
      })),
      researchAudits: [
        {
          id: "audit-article-3-v6",
          articleId: "article-3-fixture",
          createdAt: auditCreatedAt,
        },
      ],
      reviewNotes: [
        {
          action: "research-audit-fingerprint",
          note: serializeArticleAuditAssociation({
            auditId: "audit-article-3-v6",
            contentFingerprint: beforeFingerprint,
            createdAt: auditCreatedAt,
            engineRevision: CURRENT_RESEARCH_AUDIT_ENGINE_REVISION,
          }),
        },
      ],
    };

    expect(resolveArticleAuditState(article).currentAudit?.id).toBe(
      "audit-article-3-v6",
    );

    const { store } = createStore(article);
    const result = await updateArticleUnderGovernanceLock(
      {
        articleId: article.id,
        changes: { content: afterContent },
      },
      { prisma: store },
    );

    expect(result).toMatchObject({ ok: true, articleUnchanged: false });
    const afterFingerprint = computeArticleAuditFingerprint(article, sourceUrls);
    expect(afterFingerprint).not.toBe(beforeFingerprint);
    expect(article.editorialScore).toBeNull();
    expect(article.editorialGrade).toBeNull();
    expect(article.editorialWarnings).toBeNull();
    expect(article.qualityScore).toBeNull();
    expect(article.qualityGrade).toBeNull();
    expect(article.seoScore).toBeNull();
    expect(article.seoGrade).toBeNull();

    const resolved = resolveArticleAuditState(article);
    expect(resolved.currentAudit).toBeNull();
    expect(resolved.historicalAudits.map((audit) => audit.id)).toContain(
      "audit-article-3-v6",
    );

    const extracted = extractArticleClaims({
      title: ARTICLE_3_TITLE,
      excerpt: ARTICLE_3_EXCERPT,
      content: afterContent,
    });
    expect(extracted.claimCount).toBe(12);
    expect(
      extracted.claims.some((claim) =>
        claim.claim.includes("Thy servant will go and fight with this Philistine"),
      ),
    ).toBe(true);
  });
});
