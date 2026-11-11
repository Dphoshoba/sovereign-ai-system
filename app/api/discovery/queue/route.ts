import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  const topics = await prisma.discoveredTopic.findMany({
    orderBy: {
      opportunityScore: "desc",
    },
  })

  return NextResponse.json({
    ok: true,
    count: topics.length,
    topics,
  })
}