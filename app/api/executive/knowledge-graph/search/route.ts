import { NextResponse } from "next/server"
import { searchExecutiveKnowledgeGraph } from "@/lib/executive/knowledge-graph"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")?.trim() ?? ""

    if (!query) {
      return NextResponse.json({
        ok: true,
        query,
        results: [],
      })
    }

    const results = await searchExecutiveKnowledgeGraph(query)

    return NextResponse.json({
      ok: true,
      query,
      results,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to search executive knowledge graph",
      },
      { status: 500 }
    )
  }
}
