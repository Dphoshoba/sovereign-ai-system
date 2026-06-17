import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"
import { getMemoryContext } from "@/lib/ai/memory-context"

import {
  sourceCollector,
  type SourceRecord,
} from "../../../../lib/research/source-collector"
import { evidenceRegistry } from "../../../../lib/research/evidence-registry"
import { factExtractor } from "../../../../lib/research/fact-extractor"
import { factVerificationEngine } from "../../../../lib/research/fact-verification-engine"
import { consensusEngine } from "../../../../lib/research/consensus-engine"
import { publicationGate } from "../../../../lib/research/publication-gate"
import { encodingNormalizer } from "../../../../lib/research/encoding-normalizer"
import { contentSafeNormalizer } from "../../../../lib/research/content-safe-normalizer"
import { calculateEditorialQualityScore } from "../../../../lib/editorial/quality-score"

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

async function createUniqueSlug(baseSlug: string, category: string) {
  let slug = baseSlug
  let counter = 2

  while (true) {
    const existing = await prisma.article.findFirst({
      where: { slug, category },
      select: { id: true },
    })

    if (!existing) return slug

    slug = `${baseSlug}-${counter}`
    counter++
  }
}

function finalTextCleanup(value: string): string {
  const bad = String.fromCharCode(226)

  return value
    .replace(new RegExp(`([A-Za-z])${bad}s\\b`, "g"), "$1's")
    .replace(new RegExp(`([A-Za-z])${bad}t\\b`, "g"), "$1't")
    .replace(new RegExp(`([A-Za-z])${bad}re\\b`, "g"), "$1're")
    .replace(new RegExp(`([A-Za-z])${bad}ll\\b`, "g"), "$1'll")
    .replace(new RegExp(`([A-Za-z])${bad}ve\\b`, "g"), "$1've")
    .replace(new RegExp(`([A-Za-z])${bad}m\\b`, "g"), "$1'm")
    .replace(new RegExp(`([A-Za-z])${bad}d\\b`, "g"), "$1'd")
    .replace(new RegExp(`\\s*${bad}\\s*`, "g"), " - ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\bwillreward\b/gi, "will reward")
    .replace(/\bdeepentrust\b/gi, "deepen trust")
    .replace(/\bimprovecontent\b/gi, "improve content")
    .trim()
}

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { ok: false, error: "Missing OPENAI_API_KEY" },
        { status: 500 }
      )
    }

    const body = await request.json()

    const topic = body.topic || "AI automation for creators"
    const category = body.category || "ai-automation"
    const scheduledFor = body.scheduledFor
    const manualSources: SourceRecord[] = Array.isArray(body.manualSources)
      ? body.manualSources
      : []

    const sourceCollection = await sourceCollector(topic, manualSources)

    const evidence = await evidenceRegistry(
      topic,
      sourceCollection.collectedSources
    )

    const factExtraction = factExtractor(topic, evidence.evidence)

    const factVerification = factVerificationEngine(factExtraction.facts)

    const consensus = consensusEngine(factVerification.verifiedFacts)

    const publicationDecision = publicationGate(consensus)

    if (publicationDecision.status === "blocked") {
      return NextResponse.json(
        {
          ok: false,
          error: "Publication blocked by research gate",
          publicationDecision,
          researchAudit: {
            sourceCount: sourceCollection.sourceCount,
            averageAuthorityScore: sourceCollection.averageAuthorityScore,
            averageTrustScore: sourceCollection.averageTrustScore,
            researchConfidence: sourceCollection.researchConfidence,
            evidenceCount: evidence.evidenceCount,
            factCount: factExtraction.factCount,
            verifiedCount: factVerification.verifiedCount,
            averageVerificationScore: factVerification.averageVerificationScore,
            partiallyVerifiedCount: factVerification.partiallyVerifiedCount,
            unverifiedCount: factVerification.unverifiedCount,
            consensusScore: consensus.consensusScore,
            sourceQualityScore: consensus.sourceQualityScore,
            publicationRecommendation: consensus.publicationRecommendation,
          },
        },
        { status: 422 }
      )
    }

    const consensusText = consensus.consensusGroups
      .map(
        (group) =>
          `Theme: ${group.theme}\n` +
          `Sources: ${group.sourceCount}\n` +
          `Consensus: ${group.consensusStatement}`
      )
      .join("\n\n")

    const consensusBlock =
      consensus.consensusGroupCount > 0
        ? "CONSENSUS THEMES:\n\n" + consensusText
        : "No consensus themes available."

    const publishableFacts = factVerification.verifiedFacts.filter(
      (fact) =>
        fact.verificationStatus === "verified" ||
        fact.verificationStatus === "partially verified"
    )

    const verifiedFactsText = publishableFacts
      .map((fact) => {
        const sources = fact.supportingSources
          .map((source) => source.sourceUrl)
          .join(", ")

        return (
          `- ${fact.claim}\n` +
          `  Verification: ${fact.verificationStatus}\n` +
          `  Sources: ${sources || "none"}`
        )
      })
      .join("\n")

    const hasVerifiedEvidence =
      evidence.evidenceCount > 0 && publishableFacts.length > 0

    const factsBlock = hasVerifiedEvidence
      ? "EVIDENCE-SUPPORTED FACTS (the only factual material you may use):\n" +
        verifiedFactsText
      : "There are NO verified facts available for this topic. " +
        "Write a cautious, clearly-framed draft that avoids specific factual " +
        "claims, statistics, quotes, names, dates, companies, or sources. " +
        "Lean on principles, frameworks, and practical guidance rather than asserted facts."

    const memoryContext = await getMemoryContext({
      query: topic,
      types: ["strategy", "voice", "audience", "publishing"],
      limit: 8,
    })

    const response = await getOpenAI().responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the AI writing engine for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Return only valid JSON. No markdown wrapper. No explanations.",
      input:
        "Write a practical SEO blog article for Echoes & Visions in David's voice. " +
        "Topic: " +
        topic +
        ". Audience: creators, founders, ministries, agencies, and business owners using AI automation. " +
        "Relevant saved AI memory context: " +
        memoryContext +
        "\n\n" +
        consensusBlock +
        "\n\n" +
        factsBlock +
        "\n\n" +
        "STRICT RULES:\n" +
        "- Write only from the verified facts above.\n" +
        "- Do not invent statistics, quotes, sources, companies, or historical details.\n" +
        "- If evidence is limited, say so naturally and write around what is supported.\n" +
        "- Keep the article practical and useful.\n" +
        "- Return valid JSON only.\n" +
        "- Use plain ASCII punctuation only.\n" +
        "- Use straight apostrophes (').\n" +
        "- Use straight quotation marks (\").\n" +
        "- Use normal hyphens (-).\n" +
        "- Do not use smart quotes.\n" +
        "- Do not use curly apostrophes.\n" +
        "- Do not use em dashes.\n" +
        "- Do not use en dashes.\n\n" +
        'Return JSON only in this exact format: {"title":"...","excerpt":"...","content":"...","seoTitle":"...","seoDescription":"...","seoKeywords":"keyword one, keyword two, keyword three","featuredImagePrompt":"..."}. ' +
        "Requirements: use Markdown in content, include headings, practical examples, founder-level thinking, natural human rhythm, and a subtle Echoes & Visions CTA near the end.",
    })

    const parsed = JSON.parse(response.output_text)

    const cleanedContent = parsed.content
      ? finalTextCleanup(
          contentSafeNormalizer(encodingNormalizer(parsed.content))
        )
      : null

    const finalContent = cleanedContent

    const cleanedExcerpt = parsed.excerpt
      ? finalTextCleanup(encodingNormalizer(parsed.excerpt))
      : null

    const cleanedSeoDescription = parsed.seoDescription
      ? finalTextCleanup(encodingNormalizer(parsed.seoDescription))
      : null

    const title = finalTextCleanup(parsed.title || topic)
    const baseSlug = slugify(title)
    const slug = await createUniqueSlug(baseSlug, category)

    const wordCount = finalContent
      ? finalContent.split(/\s+/).filter(Boolean).length
      : 0

    const editorialQuality = calculateEditorialQualityScore({
      wordCount,
      hasTitle: Boolean(title),
      hasExcerpt: Boolean(cleanedExcerpt),
      hasSeoTitle: Boolean(parsed.seoTitle || title),
      hasSeoDescription: Boolean(cleanedSeoDescription || cleanedExcerpt),
      hasFeaturedImage: false,
      consensusScore: consensus.consensusScore,
      verifiedCount: factVerification.verifiedCount,
      partiallyVerifiedCount: factVerification.partiallyVerifiedCount,
      unverifiedCount: factVerification.unverifiedCount,
      publicationRecommendation: consensus.publicationRecommendation,
    })

    const article = await prisma.article.create({
      data: {
        title,
        slug,
        category,
        status: "review-required",
        excerpt: cleanedExcerpt,
        content: finalContent,
        featuredImage: null,
        seoTitle: finalTextCleanup(parsed.seoTitle || title),
        seoDescription: cleanedSeoDescription || cleanedExcerpt || null,
        seoKeywords: parsed.seoKeywords
          ? finalTextCleanup(parsed.seoKeywords)
          : null,
        publishedAt: null,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        editorialScore: editorialQuality.score,
        editorialGrade: editorialQuality.grade,
        editorialWarnings: editorialQuality.warnings,
      },
    })
   
    await prisma.articleResearchAudit.create({
      data: {
        articleId: article.id,
    
        sourceCount: sourceCollection.sourceCount,
        averageAuthorityScore:
          sourceCollection.averageAuthorityScore,
    
        averageTrustScore:
          sourceCollection.averageTrustScore,
    
        researchConfidence:
          sourceCollection.researchConfidence,
    
        evidenceCount:
          evidence.evidenceCount,
    
        factCount:
          factExtraction.factCount,
    
        verifiedCount:
          factVerification.verifiedCount,
    
        partiallyVerifiedCount:
          factVerification.partiallyVerifiedCount,
    
        unverifiedCount:
          factVerification.unverifiedCount,
    
        averageVerificationScore:
          factVerification.averageVerificationScore,
    
        consensusScore:
          consensus.consensusScore,
    
        sourceQualityScore:
          consensus.sourceQualityScore,
    
        publicationRecommendation:
          consensus.publicationRecommendation,
    
        sources:
          sourceCollection.collectedSources,
    

        evidence: evidence.evidence,
    
        facts:
          factVerification.verifiedFacts,
    
        consensus:
          consensus.consensusGroups,
      },
    })

    let updatedArticle = article

    try {
      const imageResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/ai/generate-featured-image`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            articleId: article.id,
          }),
        }
      )

      const imageData = await imageResponse.json()

      if (imageData?.ok && imageData?.article) {
        updatedArticle = imageData.article
      }
    } catch (imageError) {
      console.error(
        "Article created, but featured image generation failed:",
        imageError
      )
    }

    const editorialWarning =
      consensus.publicationRecommendation === "blocked"
        ? "Research pipeline marked this article as blocked for publication readiness because the available facts lack sufficient cross-source verification. The article was still saved as review-required for human editorial review."
        : null

    return NextResponse.json({
      ok: true,
      article: updatedArticle,
      researchAudit: {
        sourceCount: sourceCollection.sourceCount,
        averageAuthorityScore: sourceCollection.averageAuthorityScore,
        averageTrustScore: sourceCollection.averageTrustScore,
        researchConfidence: sourceCollection.researchConfidence,
        evidenceCount: evidence.evidenceCount,
        factCount: factExtraction.factCount,
        verifiedCount: factVerification.verifiedCount,
        averageVerificationScore: factVerification.averageVerificationScore,
        partiallyVerifiedCount: factVerification.partiallyVerifiedCount,
        unverifiedCount: factVerification.unverifiedCount,
        consensusScore: consensus.consensusScore,
        sourceQualityScore: consensus.sourceQualityScore,
        publicationRecommendation: consensus.publicationRecommendation,
        publicationDecision,
        editorialWarning,
        editorialQuality,
      },
    })
  } catch (error) {
    console.error("AI article generation failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to generate article",
      },
      { status: 500 }
    )
  }
}
