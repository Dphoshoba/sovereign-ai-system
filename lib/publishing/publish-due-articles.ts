import { randomUUID } from "node:crypto"
import { autoGenerateSocialPosts } from "../social/auto-generate-social"
import { generateNewsletterForArticle } from "../newsletter/generate-newsletter"
import { publicationGuard } from "./publication-guard"

export type DueArticle = {
  id: string
  status: string
  scheduledFor: Date | null
}

export type PublishDueArticlesStore = {
  article: {
    findMany: (args: {
      where: {
        status: { in: string[] }
        scheduledFor: { lte: Date }
      }
      select: { id: true; status: true; scheduledFor: true }
    }) => Promise<DueArticle[]>
    updateMany: (args: {
      where: {
        id: string
        status: { in: string[] }
        scheduledFor: { lte: Date }
        publishedAt: null
      }
      data: {
        status: "published"
        publishedAt: Date
      }
    }) => Promise<{ count: number }>
  }
}

export type PublishDueArticlesResult = {
  ok: true
  invocationId: string
  source: string
  startedAt: string
  finishedAt: string
  eligible: number
  published: number
  skipped: number
  failed: number
  publishedIds: string[]
  skippedItems: { id: string; category: string }[]
  failedItems: { id: string; category: string }[]
}

async function defaultAfterPublish(articleId: string) {
  await autoGenerateSocialPosts(articleId)
  await generateNewsletterForArticle(articleId)
}

export async function publishDueArticles(input: {
  now?: Date
  source?: string
  invocationId?: string
  prisma?: PublishDueArticlesStore
  afterPublish?: (articleId: string) => Promise<void>
} = {}): Promise<PublishDueArticlesResult> {
  const now = input.now ?? new Date()
  const source = input.source ?? "internal"
  const invocationId = input.invocationId ?? randomUUID()
  const startedAt = new Date()
  const store =
    input.prisma ??
    ((await import("@/lib/prisma")).prisma as unknown as PublishDueArticlesStore)
  const afterPublish = input.afterPublish ?? defaultAfterPublish

  const eligibleArticles = await store.article.findMany({
    where: {
      status: { in: ["approved", "scheduled"] },
      scheduledFor: { lte: now },
    },
    select: { id: true, status: true, scheduledFor: true },
  })

  const publishedIds: string[] = []
  const skippedItems: { id: string; category: string }[] = []
  const failedItems: { id: string; category: string }[] = []

  for (const article of eligibleArticles) {
    const guard = publicationGuard(article.status)
    if (!guard.allowed) {
      skippedItems.push({ id: article.id, category: "publication-guard" })
      continue
    }

    let claimed = 0
    try {
      const claim = await store.article.updateMany({
        where: {
          id: article.id,
          status: { in: ["approved", "scheduled"] },
          scheduledFor: { lte: now },
          publishedAt: null,
        },
        data: {
          status: "published",
          publishedAt: now,
        },
      })
      claimed = claim.count
    } catch {
      failedItems.push({ id: article.id, category: "claim-failed" })
      continue
    }

    if (claimed !== 1) {
      skippedItems.push({ id: article.id, category: "already-claimed" })
      continue
    }

    try {
      await afterPublish(article.id)
      publishedIds.push(article.id)
    } catch {
      publishedIds.push(article.id)
      failedItems.push({ id: article.id, category: "side-effect" })
    }
  }

  const finishedAt = new Date()
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
  }

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
    })
  )

  return result
}
