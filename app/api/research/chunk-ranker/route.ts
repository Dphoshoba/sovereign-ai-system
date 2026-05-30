import { NextRequest, NextResponse } from "next/server"

import { contentFetcher } from "../../../../lib/research/content-fetcher"
import { evidenceChunker } from "../../../../lib/research/evidence-chunker"
import { chunkRanker } from "../../../../lib/research/chunk-ranker"

export async function POST(req: NextRequest) {
  const body = await req.json()

  const topic =
    body.topic ||
    "The Future of AI and Faith: Opportunities, Risks and Wisdom"

  const fetched = await contentFetcher(
    body.url,
    body.title
  )

  const chunks = evidenceChunker(
    fetched.extractedText,
    body.chunkSize || 120
  )

  const rankedChunks = chunkRanker(topic, chunks)

  return NextResponse.json({
    ok: true,
    topic,
    fetched,
    chunkCount: chunks.length,
    rankedChunkCount: rankedChunks.length,
    topChunks: rankedChunks.slice(0, body.limit || 3),
  })
}
