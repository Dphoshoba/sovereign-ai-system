import { NextResponse } from "next/server"
import { buildExecutiveAgents } from "@/lib/executive/agents"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  const agents = await buildExecutiveAgents()

  return NextResponse.json({
    ok: true,
    agents,
  })
}