import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST() {
  const [articles, socialPosts, newsletters, subscribers] =
    await Promise.all([
      prisma.article.findMany(),
      prisma.socialPost.findMany(),
      prisma.newsletter.findMany(),
      prisma.subscriber.findMany(),
    ])

  const month = new Date().toISOString().slice(0, 7)

  const snapshot =
    await prisma.monthlySnapshot.upsert({
      where: {
        month,
      },
      update: {
        articlesPublished: articles.filter(
          (a) => a.status === "published"
        ).length,

        socialPublished: socialPosts.filter(
          (s) => s.status === "published"
        ).length,

        newslettersSent: newsletters.filter(
          (n) => n.status === "sent"
        ).length,

        subscribers: subscribers.filter(
          (s) => s.status === "active"
        ).length,
      },

      create: {
        month,

        articlesPublished: articles.filter(
          (a) => a.status === "published"
        ).length,

        socialPublished: socialPosts.filter(
          (s) => s.status === "published"
        ).length,

        newslettersSent: newsletters.filter(
          (n) => n.status === "sent"
        ).length,

        subscribers: subscribers.filter(
          (s) => s.status === "active"
        ).length,
      },
    })

  return NextResponse.json({
    ok: true,
    snapshot,
  })
}