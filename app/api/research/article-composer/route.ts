import { NextRequest, NextResponse } from "next/server"

import {
  sourceCollector,
  type SourceRecord,
} from "../../../../lib/research/source-collector"

import { evidenceRegistry } from "../../../../lib/research/evidence-registry"
import { factExtractor } from "../../../../lib/research/fact-extractor"
import { factClusterer } from "../../../../lib/research/fact-clusterer"
import { sectionBuilder } from "../../../../lib/research/section-builder"
import { paragraphBuilder } from "../../../../lib/research/paragraph-builder"
import { articleComposer } from "../../../../lib/research/article-composer"

export async function POST(req: NextRequest) {
  const body = await req.json()

  const topic =
    body.topic || "The Future of AI and Faith"

  const title =
    body.title || topic

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

  const factExtraction = factExtractor(
    topic,
    evidence.evidence
  )

  const clusters = factClusterer(
    topic,
    factExtraction.facts
  )

  const sections = sectionBuilder(
    clusters.clusters
  )

  const paragraphs = paragraphBuilder(
    sections.sections
  )

  const result = articleComposer(
    topic,
    title,
    paragraphs.paragraphs
  )

  return NextResponse.json({
    ok: true,
    sourceCollection,
    evidence,
    factExtraction,
    clusters,
    sections,
    paragraphs,
    result,
  })
}
