import { randomUUID } from "node:crypto";
import { autoGenerateSocialPosts } from "../social/auto-generate-social";
import { generateNewsletterForArticle } from "../newsletter/generate-newsletter";
import { sendAuthorisedNewsletterAfterScheduledPublish } from "../newsletter/after-scheduled-publish-newsletter";
import type { NewsletterSendStore } from "../newsletter/send-newsletter";
import { publishAuthorisedXAfterScheduledPublish } from "../social/after-scheduled-publish-x";
import { publishAuthorisedLinkedInAfterScheduledPublish } from "../social/after-scheduled-publish-linkedin";
import { publishAuthorisedThreadsAfterScheduledPublish } from "../social/after-scheduled-publish-threads";
import { publishAuthorisedFacebookAfterScheduledPublish } from "../social/after-scheduled-publish-facebook";
import {
  ArticleLifecycleStore,
  transitionArticleLifecycle,
} from "./article-lifecycle";
import type { TwitterPublishStore } from "../social/publish-twitter-post";
import type { LinkedInPublishStore } from "../social/linkedin-publish";
import type { ThreadsPublishStore } from "../social/threads-publish";
import type { FacebookPublishStore } from "../social/facebook-publish";

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
  newsletter: {
    findMany: (args: {
      where: { articleId: string };
    }) => Promise<
      Array<{
        id: string;
        articleId: string;
        status: string;
        subject: string;
      }>
    >;
  };
} & TwitterPublishStore &
  LinkedInPublishStore &
  ThreadsPublishStore &
  FacebookPublishStore &
  NewsletterSendStore;

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
  linkedinOutcomes?: { id: string; outcome: string; detail?: string }[];
  newsletterOutcomes?: { id: string; outcome: string; detail?: string }[];
  threadsOutcomes?: { id: string; outcome: string; detail?: string }[];
  facebookOutcomes?: { id: string; outcome: string; detail?: string }[];
};

async function defaultAfterPublish(
  articleId: string,
  store: PublishDueArticlesStore,
): Promise<{
  xOutcome: string;
  detail?: string;
  linkedinOutcome?: string;
  linkedinDetail?: string;
  newsletterOutcome?: string;
  newsletterDetail?: string;
  threadsOutcome?: string;
  threadsDetail?: string;
  facebookOutcome?: string;
  facebookDetail?: string;
}> {
  const article = await store.article.findUnique({
    where: { id: articleId },
    include: { reviewNotes: true },
  });
  if (!article) {
    return {
      xOutcome: "article_missing",
      linkedinOutcome: "article_missing",
      newsletterOutcome: "article_missing",
      threadsOutcome: "article_missing",
      facebookOutcome: "article_missing",
    };
  }

  const { resolveAuthorisedChannels, channelAuthorised } = await import(
    "./distribution-scope"
  );
  const authorised = resolveAuthorisedChannels({
    articleId: article.id,
    reviewNotes: article.reviewNotes,
  });

  // When social channels are authorised, never invent/regenerate announcement copy.
  if (
    !channelAuthorised(authorised.scope, "x") &&
    !channelAuthorised(authorised.scope, "linkedin") &&
    !channelAuthorised(authorised.scope, "threads") &&
    !channelAuthorised(authorised.scope, "facebook")
  ) {
    await autoGenerateSocialPosts(articleId);
  }

  // Draft generation only when newsletter send is not authorised.
  // When authorised, reuse the exact I2-approved newsletter — never regenerate.
  if (!channelAuthorised(authorised.scope, "newsletter")) {
    await generateNewsletterForArticle(articleId);
  }

  const socialPosts = await store.socialPost.findMany({
    where: { articleId },
  });
  const newsletters = await store.newsletter.findMany({
    where: { articleId },
  });

  // Preview / non-prod safety: never live-post social or send lists from Preview.
  if (process.env.VERCEL_ENV === "preview") {
    return {
      xOutcome: "skipped_preview",
      detail: "Preview environment does not publish live social posts.",
      linkedinOutcome: "skipped_preview",
      linkedinDetail: "Preview environment does not publish live social posts.",
      newsletterOutcome: "skipped_preview",
      newsletterDetail: "Preview environment does not send live newsletter lists.",
      threadsOutcome: "skipped_preview",
      threadsDetail: "Preview environment does not publish live social posts.",
      facebookOutcome: "skipped_preview",
      facebookDetail: "Preview environment does not publish live social posts.",
    };
  }

  let xOutcome = "skipped";
  let detail: string | undefined;
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
      xOutcome = "skipped";
      detail = xResult.reason;
    } else if (xResult.ok) {
      xOutcome = "published";
      detail = xResult.externalId
        ? `externalId=${xResult.externalId}`
        : undefined;
    } else {
      xOutcome = xResult.code;
      detail = xResult.reason;
    }
  } catch (error) {
    xOutcome = "x_side_effect_error";
    detail = error instanceof Error ? error.message : "unknown";
  }

  let linkedinOutcome = "skipped";
  let linkedinDetail: string | undefined;
  try {
    const liResult = await publishAuthorisedLinkedInAfterScheduledPublish({
      article,
      socialPosts,
      store,
      actor: "scheduler:publish-due-articles",
    });

    if (liResult.ok && liResult.skipped) {
      linkedinOutcome = "skipped";
      linkedinDetail = liResult.reason;
    } else if (liResult.ok) {
      linkedinOutcome = "published";
      linkedinDetail = liResult.externalId
        ? `externalId=${liResult.externalId}`
        : undefined;
    } else {
      linkedinOutcome = liResult.code;
      linkedinDetail = liResult.reason;
    }
  } catch (error) {
    linkedinOutcome = "linkedin_side_effect_error";
    linkedinDetail = error instanceof Error ? error.message : "unknown";
  }

  let newsletterOutcome = "skipped";
  let newsletterDetail: string | undefined;
  try {
    const nlResult = await sendAuthorisedNewsletterAfterScheduledPublish({
      article,
      newsletters,
      store,
      actor: "scheduler:publish-due-articles",
    });

    if (nlResult.ok && nlResult.skipped) {
      newsletterOutcome = "skipped";
      newsletterDetail = nlResult.reason;
    } else if (nlResult.ok) {
      newsletterOutcome = "sent";
      newsletterDetail = `newsletterId=${nlResult.newsletterId}`;
    } else {
      newsletterOutcome = nlResult.code;
      newsletterDetail = nlResult.reason;
    }
  } catch (error) {
    newsletterOutcome = "newsletter_side_effect_error";
    newsletterDetail = error instanceof Error ? error.message : "unknown";
  }

  // Partial channel failure must not prevent reporting of other channels.
  let threadsOutcome = "skipped";
  let threadsDetail: string | undefined;
  try {
    const threadsResult = await publishAuthorisedThreadsAfterScheduledPublish({
      article,
      socialPosts,
      store,
      actor: "scheduler:publish-due-articles",
    });

    if (threadsResult.ok && threadsResult.skipped) {
      threadsOutcome = "skipped";
      threadsDetail = threadsResult.reason;
    } else if (threadsResult.ok) {
      threadsOutcome = "published";
      threadsDetail = threadsResult.externalId
        ? `externalId=${threadsResult.externalId}`
        : undefined;
    } else {
      threadsOutcome = threadsResult.code;
      threadsDetail = threadsResult.reason;
    }
  } catch (error) {
    threadsOutcome = "threads_side_effect_error";
    threadsDetail = error instanceof Error ? error.message : "unknown";
  }

  let facebookOutcome = "skipped";
  let facebookDetail: string | undefined;
  try {
    const fbResult = await publishAuthorisedFacebookAfterScheduledPublish({
      article,
      socialPosts,
      store,
      actor: "scheduler:publish-due-articles",
    });

    if (fbResult.ok && fbResult.skipped) {
      facebookOutcome = "skipped";
      facebookDetail = fbResult.reason;
    } else if (fbResult.ok) {
      facebookOutcome = "published";
      facebookDetail = fbResult.externalId
        ? `externalId=${fbResult.externalId}`
        : undefined;
    } else {
      facebookOutcome = fbResult.code;
      facebookDetail = fbResult.reason;
    }
  } catch (error) {
    facebookOutcome = "facebook_side_effect_error";
    facebookDetail = error instanceof Error ? error.message : "unknown";
  }

  return {
    xOutcome,
    detail,
    linkedinOutcome,
    linkedinDetail,
    newsletterOutcome,
    newsletterDetail,
    threadsOutcome,
    threadsDetail,
    facebookOutcome,
    facebookDetail,
  };
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
    ) => Promise<
      | void
      | {
          xOutcome: string;
          detail?: string;
          linkedinOutcome?: string;
          linkedinDetail?: string;
          newsletterOutcome?: string;
          newsletterDetail?: string;
          threadsOutcome?: string;
          threadsDetail?: string;
          facebookOutcome?: string;
          facebookDetail?: string;
        }
    >;
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
  const linkedinOutcomes: { id: string; outcome: string; detail?: string }[] =
    [];
  const newsletterOutcomes: { id: string; outcome: string; detail?: string }[] =
    [];
  const threadsOutcomes: { id: string; outcome: string; detail?: string }[] =
    [];
  const facebookOutcomes: { id: string; outcome: string; detail?: string }[] =
    [];

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
        if (typeof side.linkedinOutcome === "string") {
          linkedinOutcomes.push({
            id: article.id,
            outcome: side.linkedinOutcome,
            detail: side.linkedinDetail,
          });
        }
        if (typeof side.newsletterOutcome === "string") {
          newsletterOutcomes.push({
            id: article.id,
            outcome: side.newsletterOutcome,
            detail: side.newsletterDetail,
          });
        }
        if (typeof side.threadsOutcome === "string") {
          threadsOutcomes.push({
            id: article.id,
            outcome: side.threadsOutcome,
            detail: side.threadsDetail,
          });
        }
        if (typeof side.facebookOutcome === "string") {
          facebookOutcomes.push({
            id: article.id,
            outcome: side.facebookOutcome,
            detail: side.facebookDetail,
          });
        }
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
    linkedinOutcomes,
    newsletterOutcomes,
    threadsOutcomes,
    facebookOutcomes,
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
      linkedinOutcomes,
      newsletterOutcomes,
      threadsOutcomes,
      facebookOutcomes,
    }),
  );

  return result;
}
