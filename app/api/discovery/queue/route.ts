import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
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