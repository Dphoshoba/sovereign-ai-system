import {
  accountMatchesAuthorisedPublisher,
  canonicalArticleUrl,
  checkArticleLink,
  checkXLength,
} from "./x-publish-policy";

export type TwitterPostRecord = {
  id: string;
  platform: string;
  content: string;
  status: string;
  externalId: string | null;
  articleId: string | null;
  article: { id: string; status: string; slug: string } | null;
};

type PublishBody = Record<string, unknown>;

export type PublishTwitterResult = {
  status: number;
  body: PublishBody;
};

type TwitterTx = {
  $queryRaw: (query: TemplateStringsArray, ...values: unknown[]) => Promise<unknown>;
  socialPost: {
    findUnique: (args: {
      where: { id: string };
      include: { article: true };
    }) => Promise<TwitterPostRecord | null>;
    update: (args: {
      where: { id: string };
      data: Record<string, unknown>;
    }) => Promise<TwitterPostRecord>;
  };
  operationalEvent: {
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
  };
};

export type TwitterPublishStore = {
  $transaction: <T>(fn: (tx: TwitterTx) => Promise<T>) => Promise<T>;
  socialPost: {
    update: (args: {
      where: { id: string };
      data: Record<string, unknown>;
    }) => Promise<TwitterPostRecord>;
    updateMany: (args: {
      where: { id: string; status: string };
      data: Record<string, unknown>;
    }) => Promise<{ count: number }>;
  };
  operationalEvent: {
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
  };
};

type XClient = {
  v2: {
    me: () => Promise<{ data?: { id?: string } }>;
    tweet: (content: string) => Promise<{ data?: { id?: string } }>;
  };
};

const PUBLISHING_STATUS = "publishing";

function failure(status: number, body: PublishBody): PublishTwitterResult {
  return { status, body };
}

function evaluate(post: TwitterPostRecord | null):
  | { ok: false; result: PublishTwitterResult }
  | { ok: true; post: TwitterPostRecord } {
  if (!post) {
    return {
      ok: false,
      result: failure(404, { ok: false, error: "Post not found" }),
    };
  }

  if (post.platform !== "twitter") {
    return {
      ok: false,
      result: failure(400, { ok: false, error: "Not a Twitter post" }),
    };
  }

  if (post.status === "published" || post.externalId) {
    return {
      ok: false,
      result: failure(400, {
        ok: false,
        alreadyPublished: true,
        error: "This Twitter post has already been published.",
        externalId: post.externalId ?? undefined,
      }),
    };
  }

  if (post.status === PUBLISHING_STATUS) {
    return {
      ok: false,
      result: failure(409, {
        ok: false,
        code: "publish_in_progress",
        error:
          "This Twitter post is already being published. It was not sent again.",
      }),
    };
  }

  if (post.article && post.article.status !== "published") {
    return {
      ok: false,
      result: failure(403, {
        ok: false,
        error: "Linked article must be published before posting to Twitter/X.",
      }),
    };
  }

  if (post.status !== "approved") {
    return {
      ok: false,
      result: failure(403, {
        ok: false,
        error: "Social post must be approved before publishing.",
      }),
    };
  }

  if (post.article) {
    const link = checkArticleLink(post.content, post.article.slug);
    if (!link.ok) {
      const canonical = canonicalArticleUrl(post.article.slug);
      return {
        ok: false,
        result: failure(422, {
          ok: false,
          code: link.code,
          error:
            link.code === "missing_canonical_url"
              ? `The approved post must include the canonical article URL ${canonical}.`
              : "The approved post contains an article link that is not the canonical URL.",
        }),
      };
    }
  }

  const length = checkXLength(post.content);
  if (!length.ok) {
    return {
      ok: false,
      result: failure(422, {
        ok: false,
        code: length.code,
        error: "Twitter/X post must be between 1 and 280 characters.",
      }),
    };
  }

  return { ok: true, post };
}

async function readPost(
  store: TwitterPublishStore,
  postId: string,
): Promise<
  | { ok: false; result: PublishTwitterResult }
  | { ok: true; post: TwitterPostRecord }
> {
  return store.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT "id" FROM "SocialPost" WHERE "id" = ${postId} FOR UPDATE
    `;
    const post = await tx.socialPost.findUnique({
      where: { id: postId },
      include: { article: true },
    });
    return evaluate(post);
  });
}

function safeFailureMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (!message || /token|secret|authorization|bearer|api[_-]?key/i.test(message)) {
    return "X request failed.";
  }
  return message.slice(0, 300);
}

function failureKind(error: unknown): "certain" | "uncertain" {
  const code =
    error && typeof error === "object" && "code" in error
      ? Number((error as { code?: unknown }).code)
      : Number.NaN;
  if (!Number.isFinite(code)) return "uncertain";
  if (code === 408 || code === 409 || code === 425 || code === 429) {
    return "uncertain";
  }
  if (code >= 400 && code < 500) return "certain";
  return "uncertain";
}

async function recordEvent(
  store: TwitterPublishStore,
  data: Record<string, unknown>,
) {
  try {
    await store.operationalEvent.create({ data });
  } catch {
    // The claim or published row remains the recovery record.
  }
}

export async function publishApprovedTwitterPost(input: {
  postId: string;
  actor: string;
  store: TwitterPublishStore;
  createClient: () => XClient;
}): Promise<PublishTwitterResult> {
  const inspected = await readPost(input.store, input.postId);
  if (!inspected.ok) return inspected.result;

  let client: XClient;
  try {
    client = input.createClient();
  } catch {
    return failure(503, {
      ok: false,
      code: "x_account_unverified",
      error: "The X publishing account could not be verified.",
    });
  }

  let accountId: unknown;
  try {
    const me = await client.v2.me();
    accountId = me?.data?.id;
  } catch {
    return failure(503, {
      ok: false,
      code: "x_account_unverified",
      error: "The X publishing account could not be verified.",
    });
  }

  if (!accountMatchesAuthorisedPublisher(accountId)) {
    return failure(403, {
      ok: false,
      code: "x_account_mismatch",
      error: "The connected X account is not the authorised publishing account.",
    });
  }

  const claimed = await input.store.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT "id" FROM "SocialPost" WHERE "id" = ${input.postId} FOR UPDATE
    `;
    const post = await tx.socialPost.findUnique({
      where: { id: input.postId },
      include: { article: true },
    });
    const decision = evaluate(post);
    if (!decision.ok) return decision;
    await tx.socialPost.update({
      where: { id: decision.post.id },
      data: { status: PUBLISHING_STATUS },
    });
    await tx.operationalEvent.create({
      data: {
        type: "social_publish_claimed",
        source: "twitter",
        title: "Twitter publish claimed",
        message: "A single publish attempt was claimed.",
        severity: "info",
        status: "new",
        entityType: "SocialPost",
        entityId: decision.post.id,
        payload: { articleId: decision.post.articleId, actor: input.actor },
      },
    });
    return {
      ok: true as const,
      post: { ...decision.post, status: PUBLISHING_STATUS },
    };
  });

  if (!claimed.ok) return claimed.result;

  const content = claimed.post.content;
  let tweetId: string | undefined;
  try {
    const tweet = await client.v2.tweet(content);
    tweetId = tweet?.data?.id;
    if (!tweetId) {
      throw new Error("X did not return a post id.");
    }
  } catch (error) {
    const uncertain = failureKind(error) === "uncertain";
    if (!uncertain) {
      let released = false;
      try {
        const releasedRows = await input.store.socialPost.updateMany({
          where: { id: claimed.post.id, status: PUBLISHING_STATUS },
          data: { status: "approved" },
        });
        released = releasedRows.count > 0;
      } catch {
        released = false;
      }
      if (!released) {
        await recordEvent(input.store, {
          type: "social_publish_uncertain",
          source: "twitter",
          title: "Twitter publish outcome uncertain",
          message: safeFailureMessage(error),
          severity: "high",
          status: "new",
          entityType: "SocialPost",
          entityId: claimed.post.id,
          payload: { articleId: claimed.post.articleId, outcome: "uncertain" },
        });
        return failure(502, {
          ok: false,
          code: "publish_outcome_uncertain",
          error:
            "The X publish result is uncertain. The post was not retried. Review the operational event before any further attempt.",
        });
      }
      await recordEvent(input.store, {
        type: "social_publish_failed",
        source: "twitter",
        title: "Twitter publish rejected",
        message: safeFailureMessage(error),
        severity: "high",
        status: "new",
        entityType: "SocialPost",
        entityId: claimed.post.id,
        payload: { articleId: claimed.post.articleId, outcome: "rejected" },
      });
      return failure(502, {
        ok: false,
        code: "x_rejected",
        error: "X rejected the post. The publish claim was released.",
      });
    }

    await recordEvent(input.store, {
      type: "social_publish_uncertain",
      source: "twitter",
      title: "Twitter publish outcome uncertain",
      message: safeFailureMessage(error),
      severity: "high",
      status: "new",
      entityType: "SocialPost",
      entityId: claimed.post.id,
      payload: {
        articleId: claimed.post.articleId,
        outcome: "uncertain",
        ...(tweetId ? { tweetId } : {}),
      },
    });
    return failure(502, {
      ok: false,
      code: "publish_outcome_uncertain",
      error:
        "The X publish result is uncertain. The post was not retried. Review the operational event before any further attempt.",
    });
  }

  try {
    const updated = await input.store.socialPost.update({
      where: { id: claimed.post.id },
      data: {
        status: "published",
        externalId: tweetId,
        publishedAt: new Date(),
      },
    });
    await recordEvent(input.store, {
      type: "social_publish",
      source: "twitter",
      title: "Tweet published for article",
      message: `Tweet ID ${tweetId} published`,
      severity: "info",
      status: "new",
      entityType: "SocialPost",
      entityId: claimed.post.id,
      payload: { tweetId, articleId: claimed.post.articleId },
    });
    return { status: 200, body: { ok: true, post: updated } };
  } catch {
    await recordEvent(input.store, {
      type: "social_publish_uncertain",
      source: "twitter",
      title: "Twitter publish outcome uncertain",
      message: "X returned a post id that could not be stored.",
      severity: "high",
      status: "new",
      entityType: "SocialPost",
      entityId: claimed.post.id,
      payload: {
        articleId: claimed.post.articleId,
        outcome: "uncertain",
        tweetId,
      },
    });
    return failure(502, {
      ok: false,
      code: "publish_outcome_uncertain",
      error:
        "The X publish result is uncertain. The post was not retried. Review the operational event before any further attempt.",
    });
  }
}
