import { NextRequest, NextResponse } from "next/server"

import { contentFetcher } from "../../../../lib/research/content-fetcher"
import { evidenceChunker } from "../../../../lib/research/evidence-chunker"

export async function POST(req: NextRequest) {
  const body = await req.json()

  const fetched = await contentFetcher(
    body.url,
    body.title
  )

  const chunks = evidenceChunker(
    fetched.extractedText,
    body.chunkSize || 120
  )

  return NextResponse.json({
    ok: true,
    fetched,
    chunkCount: chunks.length,
    chunks,
  })
}
