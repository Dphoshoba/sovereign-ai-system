import { NextResponse } from "next/server"
import { topicDiscovery } from "../../../../lib/discovery/topic-discovery"
import { topicScorer } from "../../../../lib/discovery/topic-scorer"

export async function POST() {
  try {
    const topics = await topicDiscovery()
    const scored = topicScorer(topics)

    return NextResponse.json({
      ok: true,
      topicCount: scored.length,
      topics: scored,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Topic discovery failed",
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return POST()
}