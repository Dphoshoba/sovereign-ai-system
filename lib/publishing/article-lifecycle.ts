import { publicationGuard } from "./publication-guard";
import { resolveArticleAuditState } from "../research/current-article-audit";

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
] as const;

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

    const auditedContentChanged = AUDITED_ARTICLE_FIELDS.some(
      (field) =>
        Object.prototype.hasOwnProperty.call(input.changes, field) &&
        input.changes[field] !== article[field],
    );
    if (auditedContentChanged && article.status === "published") {
      return failure(
        "published_immutable",
        "Published article content cannot be edited in place.",
      );
    }

    const data = { ...input.changes };
    if (
      auditedContentChanged &&
      (article.status === "approved" || article.status === "scheduled")
    ) {
      Object.assign(data, {
        status: "review-required",
        approvedAt: null,
        approvedBy: null,
        scheduledFor: null,
        publishedAt: null,
      });
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
