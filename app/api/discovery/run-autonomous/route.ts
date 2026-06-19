import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { topicDiscovery } from "../../../../lib/discovery/topic-discovery"
import { topicScorer } from "../../../../lib/discovery/topic-scorer"
import { topicOpportunityGenerator } from "../../../../lib/discovery/topic-opportunity-generator"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))

    const saveLimit = Number(body.saveLimit || 10)
    const generateLimit = Number(body.generateLimit || 3)

    const discovered = await topicDiscovery()
    const scored = topicScorer(discovered)
    const opportunities = topicOpportunityGenerator(scored).slice(0, saveLimit)

    const savedTopics = []

    for (const opportunity of opportunities) {
      const existing = await prisma.discoveredTopic.findFirst({
        where: { title: opportunity.title },
      })

      if (existing) continue

      const saved = await prisma.discoveredTopic.create({
        data: {
          title: opportunity.title,
          sourceTitle: opportunity.sourceTitle,
          source: opportunity.sourceTitle,
          audience: opportunity.audience,
          angle: opportunity.angle,
          opportunityScore: opportunity.opportunityScore,
          status: "discovered",
        },
      })

      savedTopics.push(saved)
    }

    const queueTopics = await prisma.discoveredTopic.findMany({
      where: { status: "discovered" },
      orderBy: { opportunityScore: "desc" },
      take: generateLimit,
    })

    const generated = []

    for (const topic of queueTopics) {
      await prisma.discoveredTopic.update({
        where: { id: topic.id },
        data: { status: "researching" },
      })

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/ai/generate-article`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: topic.title,
            category: topic.category,
          }),
        }
      )

      const articleResult = await response.json()

      if (!response.ok || !articleResult?.ok) {
        await prisma.discoveredTopic.update({
          where: { id: topic.id },
          data: { status: "discovered" },
        })

        generated.push({
          topicId: topic.id,
          title: topic.title,
          ok: false,
          error: "Article generation failed",
        })

        continue
      }

      await prisma.discoveredTopic.update({
        where: { id: topic.id },
        data: { status: "generated" },
      })

      generated.push({
        topicId: topic.id,
        title: topic.title,
        ok: true,
        articleId: articleResult.article?.id,
        articleStatus: articleResult.article?.status,
      })
    }

    return NextResponse.json({
      ok: true,
      discoveredCount: discovered.length,
      opportunityCount: opportunities.length,
      savedCount: savedTopics.length,
      generatedCount: generated.filter((item) => item.ok).length,
      savedTopics,
      generated,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Autonomous discovery cycle failed",
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return POST(new Request("http://localhost"))
}