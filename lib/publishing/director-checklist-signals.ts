import { prisma } from "@/lib/prisma"
import type { DirectorOperationalSignal } from "./director-checklist-monitoring"

/**
 * Load existing OperationalEvent rows related to an article's social posts.
 * Read-only. Does not invent events when none exist.
 */
export async function loadDirectorOperationalSignals(input: {
  articleId: string
  socialPostIds: string[]
}): Promise<DirectorOperationalSignal[]> {
  const socialPostIds = input.socialPostIds.filter(Boolean)
  if (socialPostIds.length === 0) return []

  const events = await prisma.operationalEvent.findMany({
    where: {
      entityType: "SocialPost",
      entityId: { in: socialPostIds },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      type: true,
      source: true,
      entityType: true,
      entityId: true,
      severity: true,
      message: true,
      createdAt: true,
      payload: true,
    },
  })

  return events.map((event) => ({
    type: event.type,
    source: event.source,
    entityType: event.entityType,
    entityId: event.entityId,
    severity: event.severity,
    message: event.message,
    createdAt: event.createdAt,
    payload: event.payload,
  }))
}
