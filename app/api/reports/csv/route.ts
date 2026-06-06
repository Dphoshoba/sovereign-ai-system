import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const [
    articles,
    socialPosts,
    newsletters,
    subscribers,
  ] = await Promise.all([
    prisma.article.findMany(),
    prisma.socialPost.findMany(),
    prisma.newsletter.findMany(),
    prisma.subscriber.findMany(),
  ])

  const csv = [
    ["Metric", "Value"],
    [
      "Articles Published",
      articles.filter((a) => a.status === "published").length,
    ],
    [
      "Social Posts Published",
      socialPosts.filter((s) => s.status === "published").length,
    ],
    [
      "Newsletters Sent",
      newsletters.filter((n) => n.status === "sent").length,
    ],
    [
      "Active Subscribers",
      subscribers.filter((s) => s.status === "active").length,
    ],
  ]
    .map((row) => row.join(","))
    .join("\n")

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition":
        'attachment; filename="monthly-report.csv"',
    },
  })
}