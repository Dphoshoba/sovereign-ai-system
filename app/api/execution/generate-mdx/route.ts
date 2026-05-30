import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

import { titleOptimizerAgent } from "../../../../lib/agents/title-optimizer-agent"
import { articleGeneratorAgent } from "../../../../lib/agents/article-generator-agent"
import { seoAgent } from "../../../../lib/agents/seo-agent"
import {
  sourceCollector,
  type SourceRecord,
} from "../../../../lib/research/source-collector"
import { factExtractor } from "../../../../lib/research/fact-extractor"

function escapeYaml(value: string) {
  return `"${value.replace(/"/g, '\\"')}"`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const niche = body.niche || "AI + Faith"
    const rawTitle =
      body.rawTitle ||
      "The Future of AI and Faith: Opportunities, Risks and Wisdom"

    const manualSources: SourceRecord[] =
      Array.isArray(body.manualSources)
        ? body.manualSources
        : []

    const titleOptimizer = titleOptimizerAgent({
      rawTitle,
      niche,
    })

    const article = articleGeneratorAgent({
      title: titleOptimizer.optimizedTitle,
      niche,
    })

    const seo = seoAgent({
      title: titleOptimizer.optimizedTitle,
      niche,
      contentType: "Blog Article",
    })

    const sourceCollection = await sourceCollector(
      titleOptimizer.optimizedTitle,
      manualSources
    )

    const factExtraction = factExtractor(
      titleOptimizer.optimizedTitle,
      sourceCollection.collectedSources
    )

    const category = titleOptimizer.category || "ai-tools"
    const slug = titleOptimizer.slug || seo.seo.slug

    const mdxDir = path.join(
      process.cwd(),
      "content",
      "blog",
      category
    )

    const mdxPath = path.join(mdxDir, `${slug}.mdx`)

    const sections = article.sections
      .map(
        (section) => `## ${section.heading}

${section.purpose}

> Verification required: ${section.verificationRequired ? "Yes" : "No"}
`
      )
      .join("\n")

    const faq = article.faq
      .map(
        (item) => `### ${item.question}

${item.answerDraft}

> Verification required: ${item.verificationRequired ? "Yes" : "No"}
`
      )
      .join("\n")

    const sourceList =
      sourceCollection.collectedSources.length > 0
        ? sourceCollection.collectedSources
            .map(
              (source) =>
                `- [${source.title}](${source.url}) — ${source.sourceType}, relevance ${source.relevanceScore}`
            )
            .join("\n")
        : "- No verified sources supplied yet."

    const factList =
      factExtraction.facts.length > 0
        ? factExtraction.facts
            .map(
              (fact) =>
                `- ${fact.claim}\n  - Source: [${fact.sourceTitle}](${fact.sourceUrl})\n  - Confidence: ${fact.confidence}\n  - Human review required: ${fact.requiresHumanReview ? "Yes" : "No"}`
            )
            .join("\n")
        : "- No facts extracted yet."

    const content = `---
title: ${escapeYaml(titleOptimizer.optimizedTitle)}
slug: ${escapeYaml(slug)}
category: ${escapeYaml(category)}
excerpt: ${escapeYaml(
      `A source-grounded draft exploring ${titleOptimizer.optimizedTitle}.`
    )}
metaTitle: ${escapeYaml(seo.seo.metaTitle)}
metaDescription: ${escapeYaml(seo.seo.metaDescription)}
keywords:
${seo.seo.keywords.map((keyword) => `  - ${escapeYaml(keyword)}`).join("\n")}
featuredImagePrompt: ${escapeYaml(
      `A thoughtful cinematic image representing ${titleOptimizer.optimizedTitle}, wisdom, technology and faith.`
    )}
publishedAt: ${escapeYaml(new Date().toISOString())}
author: "Echoes & Visions"
tags:
  - ${escapeYaml(niche)}
  - "AI"
  - "Faith"
ctaType: "default"
faq:
${article.faq
  .map(
    (item) => `  - question: ${escapeYaml(item.question)}
    answer: ${escapeYaml(item.answerDraft)}`
  )
  .join("\n")}
internalLinks: []
status: "draft"
sourceCount: ${sourceCollection.sourceCount}
factCount: ${factExtraction.factCount}
---

# ${titleOptimizer.optimizedTitle}

> Draft status: Source-grounded article skeleton. Human review, source collection and fact verification are required before publication.

## ${article.introduction.heading}

${article.introduction.purpose}

> ${article.introduction.verificationNote}

${sections}

## Source Records

${sourceList}

## Extracted Fact Records

${factList}

## FAQ

${faq}

## ${article.conclusion.heading}

${article.conclusion.purpose}

> ${article.conclusion.verificationNote}

## Anti-Hallucination Policy

${article.antiHallucinationPolicy.map((rule) => `- ${rule}`).join("\n")}
`

    await fs.mkdir(mdxDir, { recursive: true })
    await fs.writeFile(mdxPath, content, "utf8")

    return NextResponse.json({
      ok: true,
      generated: true,
      status: "draft",
      title: titleOptimizer.optimizedTitle,
      niche,
      category,
      slug,
      mdxPath: `content/blog/${category}/${slug}.mdx`,
      sourceCollection,
      factExtraction,
      titleOptimizer,
      article,
      seo,
      message:
        "Source-grounded MDX draft generated successfully. Human review and fact-checking required before publication.",
    })
  } catch (error) {
    console.error("Generate MDX failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error: "Generate MDX failed",
      },
      { status: 500 }
    )
  }
}
