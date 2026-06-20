import { NextResponse } from "next/server"
import { topicDiscovery } from "../../../../lib/discovery/topic-discovery"
import { topicScorer } from "../../../../lib/discovery/topic-scorer"
import { topicOpportunityGenerator } from "../../../../lib/discovery/topic-opportunity-generator"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const requestedCategory = body?.category as string | undefined

    const discovered = await topicDiscovery()
    const scored = topicScorer(discovered)
    const opportunities = topicOpportunityGenerator(scored)

    const filteredOpportunities = requestedCategory
      ? opportunities.filter((topic) => topic.category === requestedCategory)
      : opportunities

    if (filteredOpportunities.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: requestedCategory
            ? `No topic opportunities found for category: ${requestedCategory}`
            : "No topic opportunities found",
        },
        { status: 404 }
      )
    }

    const candidateTopics = filteredOpportunities.slice(0, 5)
    let lastError: string | null = null

    for (const bestTopic of candidateTopics) {
      console.log("[DISCOVERY] Creating article:", bestTopic.title)

      if (requestedCategory === "motivation") {
        candidateTopics.push({
          title: "How to Build Discipline One Small Decision at a Time",
          sourceTitle: "Motivation fallback topic",
          audience: "Personal Growth Readers",
          angle: "Self Improvement",
          opportunityScore: 50,
          category: "motivation",
        })
      }

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/api/ai/generate-article`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topic: bestTopic.title,
            category: bestTopic.category,
            status: "review-required",
            publishedAt: null,
            metadata: {
              source: "discovery-engine",
              audience: bestTopic.audience,
              angle: bestTopic.angle,
              opportunityScore: bestTopic.opportunityScore,
            },
          }),
        }
      )

      if (!response.ok) {
        lastError = await response.text()

        console.warn(
          "[DISCOVERY] Candidate failed:",
          bestTopic.title,
          lastError
        )

        continue
      }

      const articleResult = await response.json()

      console.log(
        "[DISCOVERY] Article created:",
        articleResult?.article?.id || articleResult?.id || "unknown"
      )

      return NextResponse.json({
        ok: true,
        requestedCategory: requestedCategory || null,
        selectedTopic: bestTopic,
        article: {
          id: articleResult?.article?.id || articleResult?.id || null,
          title: articleResult?.article?.title || bestTopic.title,
          category: bestTopic.category,
          status: articleResult?.article?.status || "review-required",
        },
        articleResult,
      })
    }

    return NextResponse.json(
      {
        ok: false,
        error: "All candidate topics failed article generation",
        requestedCategory: requestedCategory || null,
        attemptedCount: candidateTopics.length,
        lastError,
      },
      { status: 422 }
    )
  } catch (error) {
    console.error("[DISCOVERY] Failed to create article:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create article from discovery",
      },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  return POST(request)
}