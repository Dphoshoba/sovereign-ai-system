import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"
import { getMemoryContext } from "@/lib/ai/memory-context"

// NOTE: the "@/*" path alias maps to "./src/*", but these research modules
// live at the repo-root "lib/research", so they must be imported relatively.
import {
  sourceCollector,
  type SourceRecord,
} from "../../../../lib/research/source-collector"
import { evidenceRegistry } from "../../../../lib/research/evidence-registry"
import { factExtractor } from "../../../../lib/research/fact-extractor"
import { factVerificationEngine } from "../../../../lib/research/fact-verification-engine"
import { consensusEngine } from "../../../../lib/research/consensus-engine"
import { encodingNormalizer } from "../../../../lib/research/encoding-normalizer"

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

    // --- Phase 2A: evidence-first research pipeline (runs before OpenAI) ---

    // 1. Collect sources (search provider + any manually supplied sources).
    const sourceCollection = await sourceCollector(topic, manualSources)

    // 2. Build an evidence registry from the actual fetched source content.
    const evidence = await evidenceRegistry(
      topic,
      sourceCollection.collectedSources
    )

    // 3. Extract structured claims strictly from the evidence.
    const factExtraction = factExtractor(topic, evidence.evidence)

    // 4. Cross-verify claims across sources.
    const factVerification = factVerificationEngine(factExtraction.facts)

    // 5. Score consensus / publication readiness.
    const consensus = consensusEngine(factVerification.verifiedFacts)

    const consensusText =
      consensus.consensusGroups
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

    // --- Build the grounding block handed to the model ---

    const publishableFacts =
      factVerification.verifiedFacts.filter(
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
      evidence.evidenceCount > 0 &&
      publishableFacts.length > 0

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
        "- Return valid JSON only.\n\n" +
        'Return JSON only in this exact format: {"title":"...","excerpt":"...","content":"...","seoTitle":"...","seoDescription":"...","seoKeywords":"keyword one, keyword two, keyword three","featuredImagePrompt":"..."}. ' +
        "Requirements: use Markdown in content, include headings, practical examples, founder-level thinking, natural human rhythm, and a subtle Echoes & Visions CTA near the end.",
    })

    const parsed = JSON.parse(response.output_text)

    const cleanedContent =
      parsed.content
        ? encodingNormalizer(parsed.content)
        : null

    const cleanedExcerpt =
      parsed.excerpt
        ? encodingNormalizer(parsed.excerpt)
        : null

    const cleanedSeoDescription =
      parsed.seoDescription
        ? encodingNormalizer(parsed.seoDescription)
        : null

    const title = parsed.title || topic
    const baseSlug = slugify(title)
    const slug = await createUniqueSlug(baseSlug, category)

    const article = await prisma.article.create({
      data: {
        title,
        slug,
        category,
        status: "review-required",
        excerpt: cleanedExcerpt,
        content: cleanedContent,
        featuredImage: null,
        seoTitle: parsed.seoTitle || title,
        seoDescription:
          cleanedSeoDescription ||
          cleanedExcerpt ||
          null,
        seoKeywords: parsed.seoKeywords || null,
        publishedAt: null,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
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
        evidenceCount: evidence.evidenceCount,
        factCount: factExtraction.factCount,
        verifiedCount: factVerification.verifiedCount,
        partiallyVerifiedCount: factVerification.partiallyVerifiedCount,
        unverifiedCount: factVerification.unverifiedCount,
        consensusScore: consensus.consensusScore,
        publicationRecommendation: consensus.publicationRecommendation,
        editorialWarning,
      },
    })
  } catch (error) {
    console.error("AI article generation failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate article",
      },
      { status: 500 }
    )
  }
}
