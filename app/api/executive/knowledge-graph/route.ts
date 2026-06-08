import { NextResponse } from "next/server"
import {
  buildExecutiveKnowledgeGraph,
  getExecutiveKnowledgeGraphSummary,
} from "@/lib/executive/knowledge-graph"

export async function GET() {
  try {
    const summary = await getExecutiveKnowledgeGraphSummary()

    return NextResponse.json({
      ok: true,
      summary,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load executive knowledge graph summary",
      },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const result = await buildExecutiveKnowledgeGraph()
    const summary = await getExecutiveKnowledgeGraphSummary()

    return NextResponse.json({
      ok: true,
      result,
      summary,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to build executive knowledge graph",
      },
      { status: 500 }
    )
  }
}
