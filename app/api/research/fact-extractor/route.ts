import { NextRequest, NextResponse } from "next/server"

import {
  sourceCollector,
  type SourceRecord,
} from "../../../../lib/research/source-collector"

import { evidenceRegistry } from "../../../../lib/research/evidence-registry"
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

  const evidence = await evidenceRegistry(
    topic,
    sourceCollection.collectedSources
  )

  const result = factExtractor(
    topic,
    evidence.evidence
  )

  return NextResponse.json({
    ok: true,
    sourceCollection,
    evidence,
    result,
  })
}
