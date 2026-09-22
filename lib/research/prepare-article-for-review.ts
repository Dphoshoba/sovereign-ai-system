import { articleQualityScorer } from "../editorial/article-quality-scorer";
import { calculateEditorialQualityScore } from "../editorial/quality-score";
import { seoScorer } from "../editorial/seo-scorer";
import {
  RESEARCH_AUDIT_FINGERPRINT_ACTION,
  serializeArticleAuditAssociation,
} from "./article-audit-association";
import { computeArticleAuditFingerprint } from "./article-audit-fingerprint";
import { extractArticleClaims } from "./article-claim-extractor";
import { extractArticleSourceLinks } from "./article-source-links";
import { groundedFactVerification } from "./claim-evidence-matcher";
import { consensusEngine } from "./consensus-engine";
import { resolveArticleAuditState } from "./current-article-audit";
import {
  evidenceRegistry,
  type EvidenceRegistryOptions,
  type EvidenceRegistryResult,
} from "./evidence-registry";
import { publicationGate } from "./publication-gate";
import { CURRENT_RESEARCH_AUDIT_ENGINE_REVISION } from "./research-audit-engine-revision";
import { researchAuditCoverage } from "./research-audit-coverage";
import {
  isUnavailableAcquisitionCategory,
  logSourceAcquisition,
  toPublicSourceDiagnostics,
  type SourceAcquisitionDiagnostic,
} from "./source-acquisition";
import {
  scoreAuthority,
  scoreTrust,
  type SourceRecord,
} from "./source-collector";

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
  | "insufficient_article_evidence"
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
    engineRevision: string;
    sourceCount: number;
    evidenceCount: number;
    factCount: number;
    verifiedCount: number;
    partiallyVerifiedCount: number;
    unverifiedCount: number;
    consensusScore: number;
    publicationRecommendation: string | null;
    sourceCoverage: number;
    listedSourceAvailability: number;
    acceptedEvidenceCoverage: number;
    unavailableSourceCount: number;
  };
  sourceDiagnostics: SourceAcquisitionDiagnostic[];
  preservedFields: typeof CONTENT_FIELDS;
};

export type PrepareForReviewFailure = {
  ok: false;
  code: PrepareForReviewErrorCode;
  error: string;
  articleUnchanged: true;
  sourceDiagnostics?: SourceAcquisitionDiagnostic[];
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
  collectEvidence?: (
    topic: string,
    sources: SourceRecord[],
    options?: EvidenceRegistryOptions,
  ) => Promise<EvidenceRegistryResult>;
  reviewer?: string;
};

function missingEvidence(
  error: string,
  sourceDiagnostics: SourceAcquisitionDiagnostic[] = [],
): PrepareForReviewFailure {
  return {
    ok: false,
    code: "missing_evidence",
    error,
    articleUnchanged: true,
    sourceDiagnostics,
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

function rescoreSources(sources: SourceRecord[]): SourceRecord[] {
  return sources.map((source) => ({
    ...source,
    authorityScore:
      source.authorityScore && source.authorityScore > 0
        ? source.authorityScore
        : scoreAuthority(source.url),
    trustScore:
      source.trustScore && source.trustScore > 0
        ? source.trustScore
        : scoreTrust(source.url),
  }));
}

function sourceSummary(
  sources: SourceRecord[],
  acceptedUrls: string[],
  listedSourceCount = sources.length,
  diagnostics: SourceAcquisitionDiagnostic[] = [],
  registry?: {
    acceptedSourceCount?: number;
    availableSourceCount?: number;
    unavailableSourceCount?: number;
  },
  mapping?: {
    factualClaimCount: number;
    mappedClaimCount: number;
  },
) {
  const accepted = new Set(acceptedUrls);
  const scoredSources =
    accepted.size > 0
      ? sources.filter((source) => accepted.has(source.url))
      : [];
  const acceptedSourceCount =
    diagnostics.length > 0
      ? diagnostics.filter((diagnostic) => diagnostic.category === "accepted").length
      : registry?.acceptedSourceCount ?? scoredSources.length;
  const unavailableSourceCount =
    diagnostics.length > 0
      ? diagnostics.filter((diagnostic) =>
          isUnavailableAcquisitionCategory(diagnostic.category),
        ).length
      : registry?.unavailableSourceCount ??
        Math.max(0, listedSourceCount - acceptedSourceCount);
  const availableSourceCount =
    diagnostics.length > 0
      ? Math.max(0, listedSourceCount - unavailableSourceCount)
      : registry?.availableSourceCount ??
        Math.max(0, listedSourceCount - unavailableSourceCount);
  const sourceCount = scoredSources.length;
  const averageAuthorityScore = average(
    scoredSources.map((source) => source.authorityScore ?? 0),
  );
  const averageTrustScore = average(
    scoredSources.map((source) => source.trustScore ?? 0),
  );
  const averageRelevanceScore = average(
    scoredSources.map((source) => source.relevanceScore ?? 0),
  );
  const coverage = researchAuditCoverage({
    listedSourceCount,
    availableSourceCount,
    acceptedSourceCount,
    factualClaimCount: mapping?.factualClaimCount ?? 0,
    mappedClaimCount: mapping?.mappedClaimCount ?? 0,
  });
  const claimCoverageRatio =
    (mapping?.factualClaimCount ?? 0) <= 0
      ? 0
      : Math.min(1, (mapping?.mappedClaimCount ?? 0) / (mapping?.factualClaimCount ?? 1));
  const baseConfidence =
    sourceCount === 0
      ? 0
      : average([
          averageAuthorityScore,
          averageTrustScore,
          averageRelevanceScore,
        ]);

  return {
    sourceCount,
    averageAuthorityScore,
    averageTrustScore,
    sourceCoverage: coverage.sourceCoverage,
    listedSourceAvailability: coverage.listedSourceAvailability,
    acceptedEvidenceCoverage: coverage.acceptedEvidenceCoverage,
    unavailableSourceCount,
    researchConfidence: Math.round(baseConfidence * claimCoverageRatio),
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

  const sources = rescoreSources(
    extractArticleSourceLinks({
      content: article.content,
      excerpt: article.excerpt,
      featuredImage: article.featuredImage,
      researchSources: article.researchSources,
    }),
  );
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

  const claimExtraction = extractArticleClaims({
    title: article.title,
    excerpt: article.excerpt,
    content: article.content,
  });

  if (claimExtraction.claimCount === 0) {
    return {
      ok: false,
      code: "insufficient_article_evidence",
      error:
        "No auditable claims occur in the current article title, excerpt, or body. The article was left unchanged.",
      articleUnchanged: true,
      sourceDiagnostics: [],
    };
  }

  try {
    const evidence = await collectEvidence(article.title, sources, {
      claimTexts: claimExtraction.claims.map((claim) => claim.claim),
      listedSources: sources.map((source) => ({
        url: source.url,
        title: source.title,
      })),
    });
    const sourceDiagnostics = toPublicSourceDiagnostics(
      evidence.sourceDiagnostics ?? [],
    );
    if (sourceDiagnostics.length > 0) {
      logSourceAcquisition(sourceDiagnostics);
    }

    if (evidence.evidenceCount === 0) {
      return missingEvidence(
        "Required evidence could not be collected from the article's source links. Check that the linked sources are reachable and contain usable research text, then try again.",
        sourceDiagnostics,
      );
    }

    const verification = groundedFactVerification(
      claimExtraction.claims,
      evidence.evidence,
      claimExtraction.normalizedArticleText,
      sources.map((source) => ({ url: source.url, title: source.title })),
    );

    if (verification.facts.length === 0) {
      return {
        ok: false,
        code: "insufficient_article_evidence",
        error:
          "No auditable claims occur in the current article title, excerpt, or body. The article was left unchanged.",
        articleUnchanged: true,
        sourceDiagnostics,
      };
    }

    if (verification.acceptedEvidence.length === 0) {
      return missingEvidence(
        "Linked sources were reachable but did not yield claim-relevant evidence. The article was left unchanged.",
        sourceDiagnostics,
      );
    }

    const consensus = consensusEngine(verification.facts);
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

    const acceptedUrls = verification.acceptedEvidence.map(
      (record) => record.sourceUrl,
    );
    const mappedClaimCount = verification.facts.filter(
      (fact) => fact.supportingSources.length > 0,
    ).length;
    const listedSourceCount = evidence.listedSourceCount ?? sources.length;
    const sourceStats = sourceSummary(
      sources,
      acceptedUrls,
      listedSourceCount,
      sourceDiagnostics,
      evidence,
      {
        factualClaimCount: verification.facts.length,
        mappedClaimCount,
      },
    );

    const auditData = {
      articleId: article.id,
      sourceCount: sourceStats.sourceCount,
      averageAuthorityScore: sourceStats.averageAuthorityScore,
      averageTrustScore: sourceStats.averageTrustScore,
      researchConfidence: sourceStats.researchConfidence,
      evidenceCount: verification.acceptedEvidence.length,
      factCount: verification.facts.length,
      verifiedCount: verification.verifiedCount,
      partiallyVerifiedCount: verification.partiallyVerifiedCount,
      unverifiedCount: verification.unverifiedCount,
      averageVerificationScore: verification.averageVerificationScore,
      consensusScore: consensus.consensusScore,
      sourceQualityScore: consensus.sourceQualityScore,
      publicationRecommendation: consensus.publicationRecommendation,
      sources,
      evidence: verification.acceptedEvidence,
      facts: verification.facts,
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
            engineRevision: CURRENT_RESEARCH_AUDIT_ENGINE_REVISION,
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
        engineRevision: CURRENT_RESEARCH_AUDIT_ENGINE_REVISION,
        sourceCount: sourceStats.sourceCount,
        evidenceCount: verification.acceptedEvidence.length,
        factCount: verification.facts.length,
        verifiedCount: verification.verifiedCount,
        partiallyVerifiedCount: verification.partiallyVerifiedCount,
        unverifiedCount: verification.unverifiedCount,
        consensusScore: consensus.consensusScore,
        publicationRecommendation: consensus.publicationRecommendation,
        sourceCoverage: sourceStats.sourceCoverage,
        listedSourceAvailability: sourceStats.listedSourceAvailability,
        acceptedEvidenceCoverage: sourceStats.acceptedEvidenceCoverage,
        unavailableSourceCount: sourceStats.unavailableSourceCount,
      },
      sourceDiagnostics,
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
