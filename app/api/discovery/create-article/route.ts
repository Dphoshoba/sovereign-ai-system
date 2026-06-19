import { NextResponse } from "next/server"
import { topicDiscovery } from "../../../../lib/discovery/topic-discovery"
import { topicScorer } from "../../../../lib/discovery/topic-scorer"
import { topicOpportunityGenerator } from "../../../../lib/discovery/topic-opportunity-generator"

export async function POST() {
  try {
    const discovered = await topicDiscovery()
    const scored = topicScorer(discovered)
    const opportunities = topicOpportunityGenerator(scored)

    const bestTopic = opportunities[0]

    if (!bestTopic) {
      return NextResponse.json(
        { ok: false, error: "No topic opportunities found" },
        { status: 404 }
      )
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/ai/generate-article`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: bestTopic.title,
          category: bestTopic.category,
        }),
      }
    )

    const data = await response.json()

    return NextResponse.json({
      ok: true,
      selectedTopic: bestTopic,
      articleResult: data,
    })
  } catch (error) {
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

export async function GET() {
  return POST()
}