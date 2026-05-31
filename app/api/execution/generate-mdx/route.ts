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
import { factClusterer } from "../../../../lib/research/fact-clusterer"
import { sectionBuilder } from "../../../../lib/research/section-builder"
import { narrativeParagraphBuilder } from "../../../../lib/research/narrative-paragraph-builder"
import { articleComposer } from "../../../../lib/research/article-composer"
import { citationBuilder } from "../../../../lib/research/citation-builder"
import { mdxCitationRenderer } from "../../../../lib/research/mdx-citation-renderer"
import { factVerificationEngine } from "../../../../lib/research/fact-verification-engine"
import { consensusEngine } from "../../../../lib/research/consensus-engine"
import { publicationGate } from "../../../../lib/research/publication-gate"
import { outlineBuilder } from "../../../../lib/research/outline-builder"
import { phase1Rules } from "../../../../lib/research/pipeline-registry"

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

    const clusters = factClusterer(
      titleOptimizer.optimizedTitle,
      factExtraction.facts
    )

    const sections = sectionBuilder(
      clusters.clusters
    )

    const paragraphs = narrativeParagraphBuilder(
      sections.sections
    )

    const composedArticle = articleComposer(
      titleOptimizer.optimizedTitle,
      titleOptimizer.optimizedTitle,
      paragraphs.paragraphs
    )

    const factVerification = factVerificationEngine(
      factExtraction.facts
    )

    const citations = citationBuilder(
      factVerification.verifiedFacts
    )

    const consensus = consensusEngine(
      factVerification.verifiedFacts
    )

    const publicationDecision = publicationGate(consensus)

    const citationBlock = mdxCitationRenderer(
      citations.citations
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

    const seo = seoAgent({
      title: topic,
      niche,
      contentType: "Blog Article",
    })

    const category = titleOptimizer.category || "ai-tools"
    const slug = titleOptimizer.slug || seo.seo.slug

    const mdxDir = path.join(
      process.cwd(),
      "content",
      "blog",
      category
    )

    const mdxPath = path.join(mdxDir, `${slug}.mdx`)

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

    const evidenceList =
      evidence.evidence.length > 0
        ? evidence.evidence
            .map(
              (record) =>
                `- **ID:** ${record.id}\n  - **Extracted text:** ${record.extractedText}\n  - **Source:** [${record.sourceTitle}](${record.sourceUrl})\n  - **Source type:** ${record.sourceType}\n  - **Confidence:** ${record.confidence}\n  - **Human review required:** ${record.requiresHumanReview ? "Yes" : "No"}`
            )
            .join("\n\n")
        : "- No evidence registered yet."

    const factList =
      factExtraction.facts.length > 0
        ? factExtraction.facts
            .map(
              (fact) =>
                `- **Claim:** ${fact.claim}\n  - **Evidence ID:** ${fact.evidenceId}\n  - **Evidence:** ${fact.evidenceText}\n  - **Source:** [${fact.sourceTitle}](${fact.sourceUrl})\n  - **Source type:** ${fact.sourceType}\n  - **Confidence:** ${fact.confidence}\n  - **Human review required:** ${fact.requiresHumanReview ? "Yes" : "No"}`
            )
            .join("\n\n")
        : "- No facts extracted yet."

    const verificationList =
      factVerification.verifiedFacts.length > 0
        ? factVerification.verifiedFacts
            .map(
              (record) =>
                `- **Claim:** ${record.claim}\n  - **Status:** ${record.verificationStatus}\n  - **Method:** ${record.verificationMethod}\n  - **Sources:** ${record.supportingSources.map((source) => source.sourceTitle).join(", ")}\n  - **Human review required:** Yes`
            )
            .join("\n\n")
        : "- No facts available for verification."

    const evidenceFrontmatter =
      evidence.evidence.length > 0
        ? evidence.evidence
            .map(
              (record) => `  - id: ${escapeYaml(record.id)}
    sourceTitle: ${escapeYaml(record.sourceTitle)}
    sourceUrl: ${escapeYaml(record.sourceUrl)}
    sourceType: ${escapeYaml(record.sourceType)}
    extractedText: ${escapeYaml(record.extractedText)}
    confidence: ${record.confidence}
    requiresHumanReview: ${record.requiresHumanReview}`
            )
            .join("\n")
        : ""

    const factFrontmatter =
      factExtraction.facts.length > 0
        ? factExtraction.facts
            .map(
              (fact) => `  - claim: ${escapeYaml(fact.claim)}
    evidenceId: ${escapeYaml(fact.evidenceId)}
    evidenceText: ${escapeYaml(fact.evidenceText)}
    sourceTitle: ${escapeYaml(fact.sourceTitle)}
    sourceUrl: ${escapeYaml(fact.sourceUrl)}
    sourceType: ${escapeYaml(fact.sourceType)}
    confidence: ${escapeYaml(fact.confidence)}
    requiresHumanReview: ${fact.requiresHumanReview}`
            )
            .join("\n")
        : ""

    const content = `---
title: ${escapeYaml(topic)}
slug: ${escapeYaml(slug)}
category: ${escapeYaml(category)}
excerpt: ${escapeYaml(
      `A source-grounded draft exploring ${topic}.`
    )}
metaTitle: ${escapeYaml(seo.seo.metaTitle)}
metaDescription: ${escapeYaml(seo.seo.metaDescription)}
keywords:
${seo.seo.keywords.map((keyword) => `  - ${escapeYaml(keyword)}`).join("\n")}
featuredImagePrompt: ${escapeYaml(
      `A thoughtful cinematic image representing ${topic}, wisdom, technology and faith.`
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
publicationBlocked: ${factVerification.publicationBlocked}
sourceCount: ${sourceCollection.sourceCount}
evidenceCount: ${evidence.evidenceCount}
factCount: ${factExtraction.factCount}
verifiedCount: ${factVerification.verifiedCount}
consensusScore: ${consensus.consensusScore}
publicationStatus: ${escapeYaml(publicationDecision.status)}
approvedForPublishing: ${publicationDecision.approved}
publicationReason: ${escapeYaml(publicationDecision.reason)}
evidence:
${evidenceFrontmatter ? `\n${evidenceFrontmatter}` : " []"}
facts:
${factFrontmatter ? `\n${factFrontmatter}` : " []"}
---

# ${topic}

> Draft status: Source-grounded article skeleton. Human review, source collection and fact verification are required before publication.

> Publication blocked: ${factVerification.publicationBlocked ? "Yes" : "No"}

## ${article.introduction.heading}

${article.introduction.purpose}

> ${article.introduction.verificationNote}

${composedArticle.sections
  .map(
    (section) => `## ${section.heading}

${section.body}

> Facts used: ${section.factCount}
> Human review required: ${section.requiresHumanReview ? "Yes" : "No"}
`
  )
  .join("\n")}

## Source Records

${sourceList}

## Evidence Registry

${evidenceList}

## Extracted Fact Records

${factList}

## Fact Verification

${verificationList}

## FAQ

${faq}

## ${article.conclusion.heading}

${article.conclusion.purpose}

> ${article.conclusion.verificationNote}

${citationBlock}

## Anti-Hallucination Policy

${article.antiHallucinationPolicy.map((rule) => `- ${rule}`).join("\n")}

## Phase 1 Rules

${phase1Rules.map((rule) => `- ${rule}`).join("\n")}
`

    await fs.mkdir(mdxDir, { recursive: true })
    await fs.writeFile(mdxPath, content, "utf8")

    const publisher = publisherAgent({
      title: topic,
      mdxPath: `content/blog/${category}/${slug}.mdx`,
      status: factVerification.publicationBlocked ? "draft-blocked" : "draft",
    })

    return NextResponse.json({
      ok: true,
      generated: true,
      status: factVerification.publicationBlocked ? "draft-blocked" : "draft",
      publicationBlocked: factVerification.publicationBlocked,
      humanReviewRequired: true,
      publishReady: false,
      title: topic,
      niche,
      category,
      slug,
      mdxPath: `content/blog/${category}/${slug}.mdx`,
      phase1Rules,
      research,
      sourceCollection,
      evidence,
      factExtraction,
      factVerification,
      citations,
      citationBlock,
      consensus,
      publicationDecision,
      clusters,
      sections,
      paragraphs,
      composedArticle,
      outline,
      article,
      seo,
      publisher,
      titleOptimizer,
      message:
        "Source-grounded MDX draft generated through the full research pipeline. Human review and fact-checking required before publication.",
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
