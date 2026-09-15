import { articleQualityScorer } from "../editorial/article-quality-scorer";
import { calculateEditorialQualityScore } from "../editorial/quality-score";
import { seoScorer } from "../editorial/seo-scorer";
import {
  RESEARCH_AUDIT_FINGERPRINT_ACTION,
  serializeArticleAuditAssociation,
} from "./article-audit-association";
import { computeArticleAuditFingerprint } from "./article-audit-fingerprint";
import { extractArticleSourceLinks } from "./article-source-links";
import { resolveArticleAuditState } from "./current-article-audit";
import { consensusEngine } from "./consensus-engine";
import { evidenceRegistry } from "./evidence-registry";
import { factExtractor } from "./fact-extractor";
import { factVerificationEngine } from "./fact-verification-engine";
import { publicationGate } from "./publication-gate";
import type { SourceRecord } from "./source-collector";

const PREPARABLE_STATUSES = new Set(["draft", "review", "review-required"]);

const CONTENT_FIELDS = [
  "title",
  "slug",
  "excerpt",
  "content",
  "featuredImage",
  "seoTitle",
  "seoDescription",
  "seoKeywords",
  "category",
] as const;

export type PrepareForReviewErrorCode =
  | "not_found"
  | "missing_evidence"
  | "audit_failure"
  | "duplicate_audit"
  | "invalid_status";

export type PrepareForReviewSuccess = {
  ok: true;
  articleUnchanged: false;
  article: {
    id: string;
    status: string;
    editorialScore: number;
    editorialGrade: string;
    qualityScore: number;
    qualityGrade: string;
    seoScore: number;
    seoGrade: string;
  };
  audit: {
    id: string;
    createdAt: string;
    contentFingerprint: string;
    sourceCount: number;
    evidenceCount: number;
    factCount: number;
    verifiedCount: number;
    partiallyVerifiedCount: number;
    unverifiedCount: number;
    consensusScore: number;
    publicationRecommendation: string | null;
  };
  preservedFields: typeof CONTENT_FIELDS;
};

export type PrepareForReviewFailure = {
  ok: false;
  code: PrepareForReviewErrorCode;
  error: string;
  articleUnchanged: true;
};

export type PrepareForReviewResult =
  | PrepareForReviewSuccess
  | PrepareForReviewFailure;

export type PrepareForReviewArticle = {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: string;
  excerpt: string | null;
  content: string | null;
  featuredImage: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  researchSources: {
    title: string | null;
    url: string | null;
    sourceType: string | null;
    authorityScore: number;
    trustScore: number;
  }[];
  researchAudits: {
    id: string;
    articleId: string;
    createdAt: Date | string;
  }[];
  reviewNotes: {
    action: string;
    note: string | null;
  }[];
};

export type PrepareForReviewStore = {
  article: {
    findUnique: (args: {
      where: { id: string };
      include?: Record<string, unknown>;
    }) => Promise<PrepareForReviewArticle | null>;
    update: (args: {
      where: { id: string };
      data: Record<string, unknown>;
    }) => Promise<unknown>;
  };
  articleResearchAudit: {
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
  };
  articleReviewNote: {
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
  };
  $queryRaw: (
    query: TemplateStringsArray,
    ...values: unknown[]
  ) => Promise<unknown>;
  $transaction: <T>(
    fn: (tx: Omit<PrepareForReviewStore, "$transaction">) => Promise<T>,
  ) => Promise<T>;
};

export type PrepareArticleForReviewDeps = {
  prisma: PrepareForReviewStore;
  collectEvidence?: typeof evidenceRegistry;
  reviewer?: string;
};

function missingEvidence(error: string): PrepareForReviewFailure {
  return {
    ok: false,
    code: "missing_evidence",
    error,
    articleUnchanged: true,
  };
}

function wordCount(value: string | null): number {
  if (!value) return 0;
  return value.split(/\s+/).filter(Boolean).length;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(
    values.reduce((sum, value) => sum + value, 0) / values.length,
  );
}

function sourceSummary(sources: SourceRecord[]) {
  const sourceCount = sources.length;
  const averageAuthorityScore = average(
    sources.map((source) => source.authorityScore ?? 0),
  );
  const averageTrustScore = average(
    sources.map((source) => source.trustScore ?? 0),
  );
  const averageRelevanceScore = average(
    sources.map((source) => source.relevanceScore ?? 0),
  );

  return {
    sourceCount,
    averageAuthorityScore,
    averageTrustScore,
    researchConfidence:
      sourceCount === 0
        ? 0
        : average([
            averageAuthorityScore,
            averageTrustScore,
            averageRelevanceScore,
          ]),
  };
}

export async function prepareArticleForReview(
  articleId: string,
  deps: PrepareArticleForReviewDeps,
): Promise<PrepareForReviewResult> {
  const { prisma, reviewer = "admin" } = deps;
  const collectEvidence = deps.collectEvidence ?? evidenceRegistry;

  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      researchSources: true,
      researchAudits: {
        select: { id: true, articleId: true, createdAt: true },
      },
      reviewNotes: {
        where: { action: RESEARCH_AUDIT_FINGERPRINT_ACTION },
        select: { action: true, note: true },
      },
    },
  });

  if (!article) {
    return {
      ok: false,
      code: "not_found",
      error: "Article not found.",
      articleUnchanged: true,
    };
  }

  if (!PREPARABLE_STATUSES.has(article.status)) {
    return {
      ok: false,
      code: "invalid_status",
      error:
        "Only draft or review articles can be prepared. Approved, scheduled, and published articles are left unchanged.",
      articleUnchanged: true,
    };
  }

  const sources = extractArticleSourceLinks({
    content: article.content,
    excerpt: article.excerpt,
    featuredImage: article.featuredImage,
    researchSources: article.researchSources,
  });
  const contentFingerprint = computeArticleAuditFingerprint(
    article,
    sources.map((source) => source.url),
  );

  if (resolveArticleAuditState(article).currentAudit) {
    return {
      ok: false,
      code: "duplicate_audit",
      error:
        "A research audit already exists for this content revision. Duplicate audit records are not created.",
      articleUnchanged: true,
    };
  }

  if (sources.length === 0) {
    return missingEvidence(
      "This article has no source links or stored research sources to audit. Add source URLs in the article body, then try Prepare for Review again.",
    );
  }

  try {
    const evidence = await collectEvidence(article.title, sources);

    if (evidence.evidenceCount === 0) {
      return missingEvidence(
        "Required evidence could not be collected from the article's source links. Check that the linked sources are reachable and contain usable research text, then try again.",
      );
    }

    const factExtraction = factExtractor(
      article.title,
      evidence.evidence,
      article.category,
    );

    if (factExtraction.factCount === 0) {
      return missingEvidence(
        "The existing source links did not yield extractable facts. Add clearer source URLs or supporting research sources, then try again.",
      );
    }

    const verification = factVerificationEngine(factExtraction.facts);
    const consensus = consensusEngine(verification.verifiedFacts);
    publicationGate(consensus);

    const editorialQuality = calculateEditorialQualityScore({
      wordCount: wordCount(article.content),
      hasTitle: Boolean(article.title),
      hasExcerpt: Boolean(article.excerpt),
      hasSeoTitle: Boolean(article.seoTitle),
      hasSeoDescription: Boolean(article.seoDescription),
      hasFeaturedImage: Boolean(article.featuredImage),
      consensusScore: consensus.consensusScore,
      verifiedCount: verification.verifiedCount,
      partiallyVerifiedCount: verification.partiallyVerifiedCount,
      unverifiedCount: verification.unverifiedCount,
      publicationRecommendation: consensus.publicationRecommendation,
    });

    const qualityResult = articleQualityScorer({
      title: article.title,
      content: article.content || "",
    });

    const seoResult = seoScorer({
      seoTitle: article.seoTitle || undefined,
      seoDescription: article.seoDescription || undefined,
      seoKeywords: article.seoKeywords || undefined,
    });

    const sourceStats = sourceSummary(sources);

    const auditData = {
      articleId: article.id,
      sourceCount: sourceStats.sourceCount,
      averageAuthorityScore: sourceStats.averageAuthorityScore,
      averageTrustScore: sourceStats.averageTrustScore,
      researchConfidence: sourceStats.researchConfidence,
      evidenceCount: evidence.evidenceCount,
      factCount: factExtraction.factCount,
      verifiedCount: verification.verifiedCount,
      partiallyVerifiedCount: verification.partiallyVerifiedCount,
      unverifiedCount: verification.unverifiedCount,
      averageVerificationScore: verification.averageVerificationScore,
      consensusScore: consensus.consensusScore,
      sourceQualityScore: consensus.sourceQualityScore,
      publicationRecommendation: consensus.publicationRecommendation,
      sources,
      evidence: evidence.evidence,
      facts: verification.verifiedFacts,
      consensus: consensus.consensusGroups,
    };

    const articleUpdate = {
      status: "review-required",
      editorialScore: editorialQuality.score,
      editorialGrade: editorialQuality.grade,
      editorialWarnings: editorialQuality.warnings,
      qualityScore: qualityResult.score,
      qualityGrade: qualityResult.grade,
      seoScore: seoResult.score,
      seoGrade: seoResult.grade,
    };

    const createdAudit = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT "id" FROM "Article" WHERE "id" = ${article.id} FOR UPDATE
      `;

      const lockedArticle = await tx.article.findUnique({
        where: { id: article.id },
        include: {
          researchSources: true,
          researchAudits: {
            select: { id: true, articleId: true, createdAt: true },
          },
          reviewNotes: {
            where: { action: RESEARCH_AUDIT_FINGERPRINT_ACTION },
            select: { action: true, note: true },
          },
        },
      });

      if (!lockedArticle) {
        throw new Error("Article no longer exists.");
      }

      if (!PREPARABLE_STATUSES.has(lockedArticle.status)) {
        throw new InvalidStatusError();
      }

      const lockedSources = extractArticleSourceLinks({
        content: lockedArticle.content,
        excerpt: lockedArticle.excerpt,
        featuredImage: lockedArticle.featuredImage,
        researchSources: lockedArticle.researchSources,
      });
      const lockedFingerprint = computeArticleAuditFingerprint(
        lockedArticle,
        lockedSources.map((source) => source.url),
      );

      if (lockedFingerprint !== contentFingerprint) {
        throw new ArticleChangedDuringAuditError();
      }

      if (resolveArticleAuditState(lockedArticle).currentAudit) {
        throw new DuplicateAuditError();
      }

      const audit = (await tx.articleResearchAudit.create({
        data: auditData,
      })) as { id: string; createdAt: Date };

      await tx.articleReviewNote.create({
        data: {
          articleId: article.id,
          action: RESEARCH_AUDIT_FINGERPRINT_ACTION,
          reviewer: "system",
          note: serializeArticleAuditAssociation({
            auditId: audit.id,
            contentFingerprint: lockedFingerprint,
            createdAt: audit.createdAt,
          }),
        },
      });

      await tx.article.update({
        where: { id: article.id },
        data: articleUpdate,
      });

      await tx.articleReviewNote.create({
        data: {
          articleId: article.id,
          action: "prepared-for-review",
          reviewer,
          note: "Research audit and scores recorded from existing article evidence.",
        },
      });

      return audit;
    });

    return {
      ok: true,
      articleUnchanged: false,
      article: {
        id: article.id,
        status: "review-required",
        editorialScore: editorialQuality.score,
        editorialGrade: editorialQuality.grade,
        qualityScore: qualityResult.score,
        qualityGrade: qualityResult.grade,
        seoScore: seoResult.score,
        seoGrade: seoResult.grade,
      },
      audit: {
        id: createdAudit.id,
        createdAt: createdAudit.createdAt.toISOString(),
        contentFingerprint,
        sourceCount: sourceStats.sourceCount,
        evidenceCount: evidence.evidenceCount,
        factCount: factExtraction.factCount,
        verifiedCount: verification.verifiedCount,
        partiallyVerifiedCount: verification.partiallyVerifiedCount,
        unverifiedCount: verification.unverifiedCount,
        consensusScore: consensus.consensusScore,
        publicationRecommendation: consensus.publicationRecommendation,
      },
      preservedFields: CONTENT_FIELDS,
    };
  } catch (error) {
    if (error instanceof DuplicateAuditError) {
      return {
        ok: false,
        code: "duplicate_audit",
        error:
          "A research audit already exists for this content revision. Duplicate audit records are not created.",
        articleUnchanged: true,
      };
    }

    if (error instanceof InvalidStatusError) {
      return {
        ok: false,
        code: "invalid_status",
        error:
          "Only draft or review articles can be prepared. Approved, scheduled, and published articles are left unchanged.",
        articleUnchanged: true,
      };
    }

    if (error instanceof ArticleChangedDuringAuditError) {
      return {
        ok: false,
        code: "audit_failure",
        error:
          "Article audit failed. The article changed while evidence was being collected and was left unchanged. Try again.",
        articleUnchanged: true,
      };
    }

    return {
      ok: false,
      code: "audit_failure",
      error:
        error instanceof Error
          ? `Article audit failed. The article was left unchanged. ${error.message}`
          : "Article audit failed. The article was left unchanged.",
      articleUnchanged: true,
    };
  }
}

class DuplicateAuditError extends Error {
  constructor() {
    super("duplicate_audit");
    this.name = "DuplicateAuditError";
  }
}

class InvalidStatusError extends Error {
  constructor() {
    super("invalid_status");
    this.name = "InvalidStatusError";
  }
}

class ArticleChangedDuringAuditError extends Error {
  constructor() {
    super("article_changed_during_audit");
    this.name = "ArticleChangedDuringAuditError";
  }
}
