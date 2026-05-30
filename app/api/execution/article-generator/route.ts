import { NextRequest, NextResponse } from "next/server"

import { articleGeneratorAgent } from "../../../../lib/agents/article-generator-agent"

export async function POST(req: NextRequest) {
  const body = await req.json()

  const result = articleGeneratorAgent({
    title:
      body.title ||
      "The Future of AI and Faith: Opportunities, Risks and Wisdom",
    niche: body.niche || "AI + Faith",
  })

  return NextResponse.json({
    ok: true,
    result,
  })
}
