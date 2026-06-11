import { NextResponse } from "next/server"
import { buildBoardroomConsensus } from "@/lib/executive/boardroom-consensus"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  const consensus =
    await buildBoardroomConsensus()

  return NextResponse.json({
    ok: true,
    consensus,
  })
}