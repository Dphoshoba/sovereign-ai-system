import { NextRequest, NextResponse } from "next/server"

import {
  sourceCollector,
  type SourceRecord,
} from "../../../../lib/research/source-collector"

import { factExtractor } from "../../../../lib/research/fact-extractor"

export async function POST(req: NextRequest) {
  const body = await req.json()

  const topic =
    body.topic || "The Future of AI and Faith"

  const manualSources: SourceRecord[] =
    Array.isArray(body.manualSources)
      ? body.manualSources
      : []

  const sourceCollection = await sourceCollector(
    topic,
    manualSources
  )

  const result = factExtractor(
    topic,
    sourceCollection.collectedSources
  )

  return NextResponse.json({
    ok: true,
    sourceCollection,
    result,
  })
}
