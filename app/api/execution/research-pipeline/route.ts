import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

import { researchAgent } from "../../../../lib/agents/research-agent"
import { titleOptimizerAgent } from "../../../../lib/agents/title-optimizer-agent"
import { articleGeneratorAgent } from "../../../../lib/agents/article-generator-agent"
import { seoAgent } from "../../../../lib/agents/seo-agent"
import { publisherAgent } from "../../../../lib/agents/publisher-agent"
import {
  sourceCollector,
  type SourceRecord,
} from "../../../../lib/research/source-collector"
import { evidenceRegistry } from "../../../../lib/research/evidence-registry"
import { factExtractor } from "../../../../lib/research/fact-extractor"
import { outlineBuilder } from "../../../../lib/research/outline-builder"
import { factVerifier } from "../../../../lib/research/fact-verifier"
import {
  phase1Rules,
  researchPipelineArchitecture,
} from "../../../../lib/research/pipeline-registry"

function escapeYaml(value: string) {
  return `"${value.replace(/"/g, '\\"')}"`
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    architecture: researchPipelineArchitecture,
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const niche = body.niche || "AI + Faith"
    const rawTitle =
      body.rawTitle ||
      "The Future of AI and Faith: Opportunities, Risks and Wisdom"
    const writeMdx = body.writeMdx === true

    const manualSources: SourceRecord[] =
      Array.isArray(body.manualSources)
        ? body.manualSources
        : []

    const research = researchAgent({ niche })

    const titleOptimizer = titleOptimizerAgent({
      rawTitle,
      niche,
    })

    const topic = titleOptimizer.optimizedTitle

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

    const outline = outlineBuilder(
      topic,
      factExtraction.facts
    )

    const article = articleGeneratorAgent({
      title: topic,
      niche,
      outline,
    })

    const factVerification = factVerifier(
      topic,
      factExtraction.facts
    )

    const seo = seoAgent({
      title: topic,
      niche,
      contentType: "Blog Article",
    })

    const category = titleOptimizer.category || "ai-tools"
    const slug = titleOptimizer.slug || seo.seo.slug
    const relativeMdxPath = `content/blog/${category}/${slug}.mdx`

    let mdxWritten = false

    if (writeMdx) {
      const mdxDir = path.join(
        process.cwd(),
        "content",
        "blog",
        category
      )

      const content = `---
title: ${escapeYaml(topic)}
slug: ${escapeYaml(slug)}
category: ${escapeYaml(category)}
status: "review-required"
publicationBlocked: ${factVerification.publicationBlocked}
sourceCount: ${sourceCollection.sourceCount}
evidenceCount: ${evidence.evidenceCount}
factCount: ${factExtraction.factCount}
verifiedCount: ${factVerification.verifiedCount}
---

# ${topic}

> Generated through the source-grounded research pipeline.
`

      await fs.mkdir(mdxDir, { recursive: true })
      await fs.writeFile(
        path.join(mdxDir, `${slug}.mdx`),
        content,
        "utf8"
      )
      mdxWritten = true
    }

    const publisher = publisherAgent({
      title: topic,
      mdxPath: relativeMdxPath,
      status: factVerification.publicationBlocked ? "draft-blocked" : "draft",
    })

    return NextResponse.json({
      ok: true,
      architecture: researchPipelineArchitecture.name,
      status: factVerification.publicationBlocked ? "draft-blocked" : "draft",
      publicationBlocked: factVerification.publicationBlocked,
      humanReviewRequired: true,
      publishReady: false,
      mdxWritten,
      phase1Rules,
      pipeline: {
        research,
        sourceCollection,
        evidence,
        factExtraction,
        outline,
        article,
        factVerification,
        seo,
        publisher,
        titleOptimizer,
      },
      summary: {
        niche,
        title: topic,
        slug,
        category,
        mdxPath: relativeMdxPath,
        sourceCount: sourceCollection.sourceCount,
        evidenceCount: evidence.evidenceCount,
        factCount: factExtraction.factCount,
        verifiedCount: factVerification.verifiedCount,
        verificationStatus: factVerification.verificationStatus,
      },
    })
  } catch (error) {
    console.error("Research pipeline failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error: "Research pipeline failed",
      },
      { status: 500 }
    )
  }
}
