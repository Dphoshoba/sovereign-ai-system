import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST() {
  const result = await prisma.socialPost.updateMany({
    where: {
      status: "draft",
    },
    data: {
      status: "review-required",
    },
  })

  return NextResponse.json({
    ok: true,
    updated: result.count,
  })
}
