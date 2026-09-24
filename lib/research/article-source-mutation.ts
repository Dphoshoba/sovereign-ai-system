import { canonicalizeSourceUrl } from "./article-audit-fingerprint";
import {
  INVALIDATED_ARTICLE_SCORES,
  lockArticleForGovernance,
} from "../publishing/article-lifecycle";

export type ArticleSourceRecord = {
  title?: string | null;
  url?: string | null;
  publisher?: string | null;
  authorityScore?: number;
  trustScore?: number;
  sourceType?: string | null;
  category?: string | null;
};

export type SourceMutationArticle = {
  id: string;
  status: string;
  approvedAt: Date | null;
  approvedBy: string | null;
  scheduledFor: Date | null;
  publishedAt: Date | null;
};

type SourceMutationTransaction = {
  $queryRaw: (
    query: TemplateStringsArray,
    ...values: unknown[]
  ) => Promise<unknown>;
  article: {
    findUnique: (args: {
      where: { id: string };
    }) => Promise<SourceMutationArticle | null>;
    update: (args: {
      where: { id: string };
      data: Record<string, unknown>;
    }) => Promise<SourceMutationArticle>;
  };
  researchSource: {
    findMany: (args: { where: { articleId: string } }) => Promise<unknown[]>;
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
    update: (args: {
      where: { id: string };
      data: Record<string, unknown>;
    }) => Promise<unknown>;
    delete: (args: { where: { id: string } }) => Promise<unknown>;
    deleteMany: (args: { where: { articleId: string } }) => Promise<unknown>;
  };
};

export type SourceMutationStore = {
  $transaction: <T>(
    fn: (tx: SourceMutationTransaction) => Promise<T>,
  ) => Promise<T>;
};

export type SourceMutationFailure = {
  ok: false;
  code: "not_found" | "published_immutable" | "invalid_source";
  error: string;
  articleUnchanged: true;
};

export type SourceMutationSuccess = {
  ok: true;
  article: SourceMutationArticle;
  articleUnchanged: boolean;
  sources: unknown[];
};

export type SourceMutationResult = SourceMutationSuccess | SourceMutationFailure;

export type SourceMutationInput =
  | { articleId: string; operation: "replace"; sources: ArticleSourceRecord[] }
  | { articleId: string; operation: "create"; source: ArticleSourceRecord }
  | {
      articleId: string;
      operation: "update";
      sourceId: string;
      changes: ArticleSourceRecord;
    }
  | { articleId: string; operation: "delete"; sourceId: string };

function failure(
  code: SourceMutationFailure["code"],
  error: string,
): SourceMutationFailure {
  return { ok: false, code, error, articleUnchanged: true };
}

function sourceCreateData(
  articleId: string,
  source: ArticleSourceRecord,
): Record<string, unknown> {
  return {
    articleId,
    title: source.title || null,
    url: source.url || null,
    publisher: source.publisher || null,
    authorityScore: source.authorityScore || 0,
    trustScore: source.trustScore || 0,
    sourceType: source.sourceType || null,
    category: source.category || null,
  };
}

function shouldInvalidateLifecycle(status: string): boolean {
  return status === "approved" || status === "scheduled";
}

function canonicalUrlSet(sources: Array<{ url?: string | null }>): string {
  return Array.from(
    new Set(
      sources
        .map((source) => source.url)
        .filter((url): url is string => Boolean(url && url.trim()))
        .map((url) => {
          try {
            return canonicalizeSourceUrl(url);
          } catch {
            return url.trim();
          }
        }),
    ),
  )
    .sort()
    .join("\n");
}

async function applySourceMutationArticleEffects(
  tx: SourceMutationTransaction,
  article: SourceMutationArticle,
  urlsChanged: boolean,
): Promise<SourceMutationArticle> {
  const data: Record<string, unknown> = {};
  if (shouldInvalidateLifecycle(article.status)) {
    Object.assign(data, {
      status: "review-required",
      approvedAt: null,
      approvedBy: null,
      scheduledFor: null,
      publishedAt: null,
    });
  }
  if (urlsChanged) {
    Object.assign(data, INVALIDATED_ARTICLE_SCORES);
  }
  if (Object.keys(data).length === 0) return article;
  return tx.article.update({
    where: { id: article.id },
    data,
  });
}

export async function applyArticleSourceMutationInTransaction(
  tx: SourceMutationTransaction,
  input: SourceMutationInput,
): Promise<SourceMutationResult> {
  await lockArticleForGovernance(tx, input.articleId);

  const article = await tx.article.findUnique({
    where: { id: input.articleId },
  });
  if (!article) return failure("not_found", "Article not found.");
  if (article.status === "published") {
    return failure(
      "published_immutable",
      "Research sources for a published article cannot be changed.",
    );
  }

  const existingSources = (await tx.researchSource.findMany({
    where: { articleId: article.id },
  })) as Array<{ url?: string | null }>;
  const previousUrls = canonicalUrlSet(existingSources);

  if (input.operation === "replace") {
    await tx.researchSource.deleteMany({ where: { articleId: article.id } });
    for (const source of input.sources) {
      await tx.researchSource.create({
        data: sourceCreateData(article.id, source),
      });
    }
  } else if (input.operation === "create") {
    if (!input.source.url && !input.source.title) {
      return failure("invalid_source", "A source title or URL is required.");
    }
    await tx.researchSource.create({
      data: sourceCreateData(article.id, input.source),
    });
  } else if (input.operation === "update") {
    await tx.researchSource.update({
      where: { id: input.sourceId },
      data: {
        ...(input.changes.title !== undefined
          ? { title: input.changes.title || null }
          : {}),
        ...(input.changes.url !== undefined
          ? { url: input.changes.url || null }
          : {}),
        ...(input.changes.publisher !== undefined
          ? { publisher: input.changes.publisher || null }
          : {}),
        ...(input.changes.authorityScore !== undefined
          ? { authorityScore: input.changes.authorityScore }
          : {}),
        ...(input.changes.trustScore !== undefined
          ? { trustScore: input.changes.trustScore }
          : {}),
        ...(input.changes.sourceType !== undefined
          ? { sourceType: input.changes.sourceType || null }
          : {}),
        ...(input.changes.category !== undefined
          ? { category: input.changes.category || null }
          : {}),
      },
    });
  } else {
    await tx.researchSource.delete({ where: { id: input.sourceId } });
  }

  const sources = (await tx.researchSource.findMany({
    where: { articleId: article.id },
  })) as Array<{ url?: string | null }>;
  const urlsChanged = canonicalUrlSet(sources) !== previousUrls;
  const updatedArticle = await applySourceMutationArticleEffects(
    tx,
    article,
    urlsChanged,
  );

  return {
    ok: true,
    article: updatedArticle,
    articleUnchanged: !urlsChanged && updatedArticle === article,
    sources,
  };
}

export async function mutateArticleSources(
  input: SourceMutationInput,
  deps?: { prisma?: unknown },
): Promise<SourceMutationResult> {
  const store = (deps?.prisma ??
    (await import("@/lib/prisma")).prisma) as SourceMutationStore;

  try {
    return await store.$transaction((tx) =>
      applyArticleSourceMutationInTransaction(tx, input),
    );
  } catch (error) {
    if (
      error instanceof Error &&
      /Record to (update|delete) does not exist/i.test(error.message)
    ) {
      return failure("invalid_source", "Research source not found.");
    }
    throw error;
  }
}
