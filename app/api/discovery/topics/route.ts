import { NextResponse } from "next/server"
import { topicDiscovery } from "../../../../lib/discovery/topic-discovery"
import { topicScorer } from "../../../../lib/discovery/topic-scorer"
import { topicOpportunityGenerator } from "@/lib/discovery/topic-opportunity-generator"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function POST() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  try {
    const topics = await topicDiscovery()
    const scored = topicScorer(topics)

    return NextResponse.json({
      ok: true,
      topicCount: scored.length,
      topics: topicOpportunityGenerator(scored),
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
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  return POST()
}