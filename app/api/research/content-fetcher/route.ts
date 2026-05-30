import { NextRequest, NextResponse } from "next/server"

import { contentFetcher } from "../../../../lib/research/content-fetcher"

export async function POST(req: NextRequest) {
  const body = await req.json()

  const result = await contentFetcher(
    body.url,
    body.title
  )

  return NextResponse.json(result)
}
