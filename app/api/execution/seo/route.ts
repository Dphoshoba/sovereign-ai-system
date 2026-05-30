import { NextRequest, NextResponse } from "next/server"

import { seoAgent } from "../../../../lib/agents/seo-agent"

export async function POST(req: NextRequest) {
  const body = await req.json()

  const result = seoAgent({
    title: body.title || "The Future of AI and Faith",
    niche: body.niche || "AI + Faith",
    contentType: body.contentType || "Blog Article",
  })

  return NextResponse.json({
    ok: true,
    result,
  })
}
