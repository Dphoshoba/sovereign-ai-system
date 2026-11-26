import { randomUUID } from "node:crypto";
import { autoGenerateSocialPosts } from "../social/auto-generate-social";
import { generateNewsletterForArticle } from "../newsletter/generate-newsletter";
import { publishAuthorisedXAfterScheduledPublish } from "../social/after-scheduled-publish-x";
import {
  ArticleLifecycleStore,
  transitionArticleLifecycle,
} from "./article-lifecycle";
import type { TwitterPublishStore } from "../social/publish-twitter-post";

export type DueArticle = {
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
  slug?: string;
  researchSources: Array<{
    title: string | null;
    url: string | null;
    sourceType: string | null;
    authorityScore: number;
    trustScore: number;
  }>;
  researchAudits: Array<{
    id: string;
    createdAt: Date | string;
  }>;
  reviewNotes: Array<{ action: string; note: string | null }>;
};

export type PublishDueArticlesStore = ArticleLifecycleStore & {
  article: {
    findMany: (args: {
      where: {
        status: { in: string[] };
        scheduledFor: { lte: Date };
      };
      include: {
        researchSources: true;
        researchAudits: true;
        reviewNotes: true;
      };
    }) => Promise<DueArticle[]>;
    findUnique: (args: {
      where: { id: string };
      include?: { reviewNotes: true };
    }) => Promise<{
      id: string;
      slug: string;
      status: string;
      featuredImage: string | null;
      reviewNotes: Array<{ action: string; note: string | null }>;
    } | null>;
  };
  socialPost: {
    findMany: (args: {
      where: { articleId: string };
    }) => Promise<
      Array<{
        id: string;
        platform: string;
        content: string;
        status: string;
        externalId: string | null;
      }>
    >;
  };
} & TwitterPublishStore;

export type PublishDueArticlesResult = {
  ok: true;
  invocationId: string;
  source: string;
  startedAt: string;
  finishedAt: string;
  eligible: number;
  published: number;
  skipped: number;
  failed: number;
  publishedIds: string[];
  skippedItems: { id: string; category: string }[];
  failedItems: { id: string; category: string }[];
  xOutcomes?: { id: string; outcome: string; detail?: string }[];
};

async function defaultAfterPublish(
  articleId: string,
  store: PublishDueArticlesStore,
): Promise<{ xOutcome: string; detail?: string }> {
  const article = await store.article.findUnique({
    where: { id: articleId },
    include: { reviewNotes: true },
  });
  if (!article) {
    return { xOutcome: "article_missing" };
  }

  const { resolveAuthorisedChannels, channelAuthorised } = await import(
    "./distribution-scope"
  );
  const authorised = resolveAuthorisedChannels({
    articleId: article.id,
    reviewNotes: article.reviewNotes,
  });

  // When X is authorised, never invent/regenerate announcement copy.
  if (!channelAuthorised(authorised.scope, "x")) {
    await autoGenerateSocialPosts(articleId);
  }

  // Newsletter draft generation only — never auto-send from the scheduler.
  await generateNewsletterForArticle(articleId);

  const socialPosts = await store.socialPost.findMany({
    where: { articleId },
  });

  // Preview / non-prod safety: never live-post to X from Preview.
  if (process.env.VERCEL_ENV === "preview") {
    return {
      xOutcome: "skipped_preview",
      detail: "Preview environment does not publish live social posts.",
    };
  }

  try {
    const { getTwitterClient } = await import("@/lib/twitter");
    const xResult = await publishAuthorisedXAfterScheduledPublish({
      article,
      socialPosts,
      store,
      createClient: () => getTwitterClient(),
      actor: "scheduler:publish-due-articles",
    });

    if (xResult.ok && xResult.skipped) {
      return { xOutcome: "skipped", detail: xResult.reason };
    }
    if (xResult.ok) {
      return {
        xOutcome: "published",
        detail: xResult.externalId
          ? `externalId=${xResult.externalId}`
          : undefined,
      };
    }
    return { xOutcome: xResult.code, detail: xResult.reason };
  } catch (error) {
    return {
      xOutcome: "x_side_effect_error",
      detail: error instanceof Error ? error.message : "unknown",
    };
  }
}

export async function publishDueArticles(
  input: {
    now?: Date;
    source?: string;
    invocationId?: string;
    prisma?: PublishDueArticlesStore;
    afterPublish?: (
      articleId: string,
      store: PublishDueArticlesStore,
    ) => Promise<void | { xOutcome: string; detail?: string }>;
  } = {},
): Promise<PublishDueArticlesResult> {
  const now = input.now ?? new Date();
  const source = input.source ?? "internal";
  const invocationId = input.invocationId ?? randomUUID();
  const startedAt = new Date();
  const store =
    input.prisma ??
    ((await import("@/lib/prisma"))
      .prisma as unknown as PublishDueArticlesStore);
  const afterPublish = input.afterPublish ?? defaultAfterPublish;

  const eligibleArticles = await store.article.findMany({
    where: {
      status: { in: ["approved", "scheduled"] },
      scheduledFor: { lte: now },
    },
    include: {
      researchSources: true,
      researchAudits: true,
      reviewNotes: true,
    },
  });

  const publishedIds: string[] = [];
  const skippedItems: { id: string; category: string }[] = [];
  const failedItems: { id: string; category: string }[] = [];
  const xOutcomes: { id: string; outcome: string; detail?: string }[] = [];

  for (const article of eligibleArticles) {
    let transition;
    try {
      transition = await transitionArticleLifecycle(
        {
          articleId: article.id,
          transition: "publish",
          requireDueAt: now,
          now,
        },
        { prisma: store },
      );
    } catch {
      failedItems.push({ id: article.id, category: "claim-failed" });
      continue;
    }

    if (!transition.ok) {
      skippedItems.push({ id: article.id, category: transition.code });
      continue;
    }
    if (transition.alreadyApplied) {
      skippedItems.push({ id: article.id, category: "already-claimed" });
      continue;
    }

    try {
      const side = await afterPublish(article.id, store);
      publishedIds.push(article.id);
      if (side && typeof side === "object" && "xOutcome" in side) {
        xOutcomes.push({
          id: article.id,
          outcome: side.xOutcome,
          detail: side.detail,
        });
      }
    } catch {
      publishedIds.push(article.id);
      failedItems.push({ id: article.id, category: "side-effect" });
    }
  }

  const finishedAt = new Date();
  const result: PublishDueArticlesResult = {
    ok: true,
    invocationId,
    source,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    eligible: eligibleArticles.length,
    published: publishedIds.length,
    skipped: skippedItems.length,
    failed: failedItems.length,
    publishedIds,
    skippedItems,
    failedItems,
    xOutcomes,
  };

  console.info(
    JSON.stringify({
      event: "scheduled-publish",
      invocationId,
      source,
      startedAt: result.startedAt,
      finishedAt: result.finishedAt,
      eligible: result.eligible,
      published: result.published,
      skipped: result.skipped,
      failed: result.failed,
      publishedIds,
      skippedItems,
      failedItems,
      xOutcomes,
    }),
  );

  return result;
}
