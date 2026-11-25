import { NextResponse } from "next/server"
import { buildKnowledgeGraphIntelligence } from "@/lib/executive/knowledge-graph-intelligence"
import { requireEditorAuth } from "../../../../../lib/publishing/require-editor-auth"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  try {
    const intelligence = await buildKnowledgeGraphIntelligence()

    return NextResponse.json({
      ok: true,
      intelligence,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to build knowledge graph intelligence",
      },
      { status: 500 }
    )
  }
}
