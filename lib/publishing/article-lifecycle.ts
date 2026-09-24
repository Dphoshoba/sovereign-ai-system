import { publicationGuard } from "./publication-guard";
import { resolveArticleAuditState } from "../research/current-article-audit";
import { computeArticleAuditFingerprint } from "../research/article-audit-fingerprint";
import {
  collectEffectiveAuditedChanges,
  serializeCorrectionGovernanceNote,
  CORRECTED_AND_UNPUBLISHED_ACTION,
  type CorrectableAuditedChanges,
  type CorrectAndWithdrawResult,
} from "./correct-and-withdraw";

export type ArticleLifecycleTransition =
  | "approve"
  | "schedule"
  | "publish"
  | "reject"
  | "archive";

const REJECTABLE_STATUSES = new Set([
  "review",
  "review-required",
  "approved",
  "scheduled",
]);
const ARCHIVABLE_STATUSES = new Set([
  "draft",
  "review",
  "review-required",
  "approved",
  "scheduled",
  "published",
  "rejected",
]);

export type LifecycleArticle = {
  id: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  category: string;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  featuredImage: string | null;
  status: string;
  scheduledFor: Date | null;
  publishedAt: Date | null;
  approvedAt: Date | null;
  approvedBy: string | null;
  researchSources: Array<{
    title: string | null;
    url: string | null;
    sourceType: string | null;
    authorityScore: number;
    trustScore: number;
  }>;
  researchAudits: Array<{
    id: string;
    articleId: string;
    createdAt: Date | string;
  }>;
  reviewNotes: Array<{ action: string; note: string | null }>;
};

type LifecycleTransaction = {
  $queryRaw: (
    query: TemplateStringsArray,
    ...values: unknown[]
  ) => Promise<unknown>;
  article: {
    findUnique: (args: {
      where: { id: string };
      include: {
        researchSources: true;
        researchAudits: true;
        reviewNotes: true;
      };
    }) => Promise<LifecycleArticle | null>;
    update: (args: {
      where: { id: string };
      data: Record<string, unknown>;
    }) => Promise<LifecycleArticle>;
  };
  articleReviewNote: {
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
  };
  publishingQueue: {
    update: (args: {
      where: { id: string };
      data: { status: "published"; publishedAt: Date };
    }) => Promise<unknown>;
  };
};

export type ArticleLifecycleStore = {
  $transaction: <T>(fn: (tx: LifecycleTransaction) => Promise<T>) => Promise<T>;
};

export type ArticleLifecycleInput = {
  articleId: string;
  transition: ArticleLifecycleTransition;
  actor?: string;
  reviewNote?: string;
  scheduledFor?: Date;
  now?: Date;
  requireDueAt?: Date;
  queueId?: string;
};

export type ArticleLifecycleFailure = {
  ok: false;
  code:
    | "not_found"
    | "invalid_status"
    | "missing_audit"
    | "stale_audit"
    | "not_due"
    | "published_immutable";
  error: string;
  articleUnchanged: true;
};

export type ArticleLifecycleSuccess = {
  ok: true;
  article: LifecycleArticle;
  alreadyApplied: boolean;
  articleUnchanged: boolean;
};

export type ArticleLifecycleResult =
  | ArticleLifecycleSuccess
  | ArticleLifecycleFailure;

export async function lockArticleForGovernance(
  tx: Pick<LifecycleTransaction, "$queryRaw">,
  articleId: string,
): Promise<void> {
  await tx.$queryRaw`
    SELECT "id" FROM "Article" WHERE "id" = ${articleId} FOR UPDATE
  `;
}

function failure(
  code: ArticleLifecycleFailure["code"],
  error: string,
): ArticleLifecycleFailure {
  return { ok: false, code, error, articleUnchanged: true };
}

export async function transitionArticleLifecycle(
  input: ArticleLifecycleInput,
  deps?: { prisma?: unknown },
): Promise<ArticleLifecycleResult> {
  const store = (deps?.prisma ??
    (await import("@/lib/prisma")).prisma) as ArticleLifecycleStore;
  const now = input.now ?? new Date();
  const actor = input.actor || "system";

  return store.$transaction(async (tx) => {
    await lockArticleForGovernance(tx, input.articleId);
    const article = await tx.article.findUnique({
      where: { id: input.articleId },
      include: {
        researchSources: true,
        researchAudits: true,
        reviewNotes: true,
      },
    });

    if (!article) return failure("not_found", "Article not found.");

    if (
      (input.transition === "reject" && article.status === "rejected") ||
      (input.transition === "archive" && article.status === "archived")
    ) {
      return {
        ok: true,
        article,
        alreadyApplied: true,
        articleUnchanged: true,
      };
    }

    if (input.transition === "reject") {
      if (!REJECTABLE_STATUSES.has(article.status)) {
        return failure(
          "invalid_status",
          "Only an article in review, approved, or scheduled can be rejected.",
        );
      }
      const updated = await tx.article.update({
        where: { id: article.id },
        data: {
          status: "rejected",
          approvedAt: null,
          approvedBy: null,
          scheduledFor: null,
          publishedAt: null,
        },
      });
      await tx.articleReviewNote.create({
        data: {
          articleId: article.id,
          action: "rejected",
          reviewer: actor,
          note: input.reviewNote || "Rejected during editorial review.",
        },
      });
      return {
        ok: true,
        article: updated,
        alreadyApplied: false,
        articleUnchanged: false,
      };
    }

    if (input.transition === "archive") {
      if (!ARCHIVABLE_STATUSES.has(article.status)) {
        return failure(
          "invalid_status",
          "The article cannot be archived from its current status.",
        );
      }
      const updated = await tx.article.update({
        where: { id: article.id },
        data: { status: "archived" },
      });
      await tx.articleReviewNote.create({
        data: {
          articleId: article.id,
          action: "archived",
          reviewer: actor,
          note: input.reviewNote || "Article archived.",
        },
      });
      return {
        ok: true,
        article: updated,
        alreadyApplied: false,
        articleUnchanged: false,
      };
    }

    const repeatedApproval =
      input.transition === "approve" && article.status === "approved";
    const repeatedPublication =
      input.transition === "publish" && article.status === "published";
    const repeatedSchedule =
      input.transition === "schedule" &&
      article.status === "scheduled" &&
      Boolean(input.scheduledFor) &&
      article.scheduledFor?.valueOf() === input.scheduledFor?.valueOf();
    if (repeatedApproval || repeatedPublication || repeatedSchedule) {
      return {
        ok: true,
        article,
        alreadyApplied: true,
        articleUnchanged: true,
      };
    }

    if (article.researchAudits.length === 0) {
      return failure(
        "missing_audit",
        "A research audit is required before this lifecycle transition.",
      );
    }

    const { currentAudit } = resolveArticleAuditState(article);
    if (!currentAudit) {
      return failure(
        "stale_audit",
        "A current research audit matching this content revision is required.",
      );
    }

    if (input.transition === "approve") {
      if (article.status !== "review-required") {
        return failure(
          "invalid_status",
          "Only an article awaiting review can be approved.",
        );
      }

      const updated = await tx.article.update({
        where: { id: article.id },
        data: {
          status: "approved",
          approvedAt: now,
          approvedBy: actor,
        },
      });
      await tx.articleReviewNote.create({
        data: {
          articleId: article.id,
          action: "approved",
          reviewer: actor,
          note: input.reviewNote || "Article approved for publishing workflow.",
        },
      });
      return {
        ok: true,
        article: updated,
        alreadyApplied: false,
        articleUnchanged: false,
      };
    }

    const guard = publicationGuard(article.status, {
      hasCurrentAudit: true,
    });
    if (!guard.allowed) {
      return failure("invalid_status", guard.reason);
    }

    if (input.transition === "schedule") {
      if (!input.scheduledFor) {
        return failure("invalid_status", "A schedule time is required.");
      }
      const updated = await tx.article.update({
        where: { id: article.id },
        data: {
          status: "scheduled",
          scheduledFor: input.scheduledFor,
          publishedAt: null,
        },
      });
      return {
        ok: true,
        article: updated,
        alreadyApplied: false,
        articleUnchanged: false,
      };
    }

    if (
      input.requireDueAt &&
      (!article.scheduledFor || article.scheduledFor > input.requireDueAt)
    ) {
      return failure("not_due", "Article is not due for publication.");
    }

    const updated = await tx.article.update({
      where: { id: article.id },
      data: {
        status: "published",
        approvedAt: article.approvedAt || now,
        approvedBy: input.actor || article.approvedBy || "system",
        publishedAt: now,
        scheduledFor: null,
      },
    });
    if (input.queueId) {
      await tx.publishingQueue.update({
        where: { id: input.queueId },
        data: { status: "published", publishedAt: now },
      });
    }
    return {
      ok: true,
      article: updated,
      alreadyApplied: false,
      articleUnchanged: false,
    };
  });
}

const AUDITED_ARTICLE_FIELDS = [
  "title",
  "excerpt",
  "content",
  "category",
  "seoTitle",
  "seoDescription",
  "seoKeywords",
  "ctaType",
  "ctaContent",
  "ctaDestination",
] as const;

export const INVALIDATED_ARTICLE_SCORES = {
  editorialScore: null,
  editorialGrade: null,
  editorialWarnings: null,
  qualityScore: null,
  qualityGrade: null,
  seoScore: null,
  seoGrade: null,
} as const;

function collectEffectiveFieldChanges(
  article: LifecycleArticle,
  changes: Record<string, unknown>,
): Record<string, unknown> {
  const current = article as unknown as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  for (const [field, value] of Object.entries(changes)) {
    if (current[field] !== value) {
      data[field] = value;
    }
  }
  return data;
}

export async function updateArticleUnderGovernanceLock(
  input: {
    articleId: string;
    changes: Record<string, unknown>;
    assert?: (article: LifecycleArticle) => ArticleLifecycleFailure | null;
  },
  deps?: { prisma?: unknown },
): Promise<ArticleLifecycleResult> {
  const store = (deps?.prisma ??
    (await import("@/lib/prisma")).prisma) as ArticleLifecycleStore;

  return store.$transaction(async (tx) => {
    await lockArticleForGovernance(tx, input.articleId);
    const article = await tx.article.findUnique({
      where: { id: input.articleId },
      include: {
        researchSources: true,
        researchAudits: true,
        reviewNotes: true,
      },
    });
    if (!article) return failure("not_found", "Article not found.");

    const blocked = input.assert?.(article) ?? null;
    if (blocked) return blocked;

    const data = collectEffectiveFieldChanges(article, input.changes);
    const auditedContentChanged = AUDITED_ARTICLE_FIELDS.some((field) =>
      Object.prototype.hasOwnProperty.call(data, field),
    );
    if (auditedContentChanged && article.status === "published") {
      return failure(
        "published_immutable",
        "Published article content cannot be edited in place.",
      );
    }

    if (Object.keys(data).length === 0) {
      return {
        ok: true,
        article,
        alreadyApplied: true,
        articleUnchanged: true,
      };
    }

    if (auditedContentChanged) {
      Object.assign(data, INVALIDATED_ARTICLE_SCORES);
      if (article.status === "approved" || article.status === "scheduled") {
        Object.assign(data, {
          status: "review-required",
          approvedAt: null,
          approvedBy: null,
          scheduledFor: null,
          publishedAt: null,
        });
      }
    }

    const updated = await tx.article.update({
      where: { id: article.id },
      data,
    });
    return {
      ok: true,
      article: updated,
      alreadyApplied: false,
      articleUnchanged: false,
    };
  });
}

export async function correctAndWithdrawPublishedArticle(
  input: {
    articleId: string;
    reason: string;
    changes: CorrectableAuditedChanges;
    actor: string;
    now?: Date;
  },
  deps?: { prisma?: unknown },
): Promise<CorrectAndWithdrawResult<LifecycleArticle>> {
  const store = (deps?.prisma ??
    (await import("@/lib/prisma")).prisma) as ArticleLifecycleStore;
  const now = input.now ?? new Date();
  const actor = input.actor;
  const reason = input.reason.trim();
  if (!reason) {
    return {
      ok: false,
      code: "invalid_request",
      error: "reason is required.",
      articleUnchanged: true,
    };
  }

  return store.$transaction(async (tx) => {
    await lockArticleForGovernance(tx, input.articleId);
    const article = await tx.article.findUnique({
      where: { id: input.articleId },
      include: {
        researchSources: true,
        researchAudits: true,
        reviewNotes: true,
      },
    });
    if (!article) {
      return {
        ok: false,
        code: "article_not_found",
        error: "Article not found.",
        articleUnchanged: true,
      };
    }
    if (article.status === "review-required") {
      return {
        ok: false,
        code: "correction_conflict",
        error:
          "This article is already withdrawn for correction and cannot be corrected again until it is republished.",
        articleUnchanged: true,
      };
    }
    if (article.status !== "published") {
      return {
        ok: false,
        code: "invalid_article_status",
        error: "Only a published article can be withdrawn for correction.",
        articleUnchanged: true,
      };
    }

    const { changedFields, data: contentData } = collectEffectiveAuditedChanges(
      article,
      input.changes,
    );
    if (changedFields.length === 0) {
      return {
        ok: false,
        code: "no_effective_change",
        error: "The submitted correction does not change any audited field.",
        articleUnchanged: true,
      };
    }

    const { sourceUrls } = resolveArticleAuditState(article);
    const previousFingerprint = computeArticleAuditFingerprint(
      article,
      sourceUrls,
    );
    const nextArticleState = { ...article, ...contentData };
    const newFingerprint = computeArticleAuditFingerprint(
      nextArticleState,
      sourceUrls,
    );

    const note = serializeCorrectionGovernanceNote({
      version: 1,
      articleId: article.id,
      reason,
      changedFields,
      previousStatus: "published",
      newStatus: "review-required",
      previousFingerprint,
      newFingerprint,
      correctedAt: now.toISOString(),
      correctedBy: actor,
    });

    const updated = await tx.article.update({
      where: { id: article.id },
      data: {
        ...contentData,
        status: "review-required",
        publishedAt: null,
        scheduledFor: null,
        approvedAt: null,
        approvedBy: null,
        editorialScore: null,
        editorialGrade: null,
        editorialWarnings: null,
        qualityScore: null,
        qualityGrade: null,
        seoScore: null,
        seoGrade: null,
      },
    });
    await tx.articleReviewNote.create({
      data: {
        articleId: article.id,
        action: CORRECTED_AND_UNPUBLISHED_ACTION,
        reviewer: actor,
        note,
      },
    });

    return {
      ok: true,
      article: updated,
      articleUnchanged: false,
      changedFields,
      previousFingerprint,
      newFingerprint,
      note,
    };
  });
}
