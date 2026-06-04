import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const statuses = await prisma.socialPost.groupBy({
    by: ["status"],
    _count: {
      _all: true,
    },
  })

  return NextResponse.json(statuses)
}
