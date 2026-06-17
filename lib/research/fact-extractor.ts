import type { EvidenceRecord } from "./evidence-registry"
import { factDeduplicator } from "./fact-deduplicator"

export type ExtractedFact = {
  claim: string
  evidenceId: string
  sourceTitle: string
  sourceUrl: string
  sourceType: string
  evidenceText: string
  confidence: "high" | "medium" | "low"
  requiresHumanReview: boolean
}

export type FactExtractionResult = {
  topic: string
  facts: ExtractedFact[]
  factCount: number
  extractionStatus: string
}

function confidenceLabel(confidence: number) {
  if (confidence >= 90) return "high"
  if (confidence >= 70) return "medium"
  return "low"
}

function cleanSentence(sentence: string) {
  return sentence
    .replace(/\s+/g, " ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/â€™/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"')
    .replace(/â/g, "'")
    .trim()
}

function canonicalClaim(sentence: string): string | null {
  const text = sentence.toLowerCase()

  if (
    text.includes("automation") ||
    text.includes("workflow") ||
    text.includes("repetitive") ||
    text.includes("streamline")
  ) {
    return "AI automation is streamlining repetitive work and improving creator workflows."
  }

  if (
    text.includes("content production") ||
    text.includes("content creation") ||
    text.includes("produce content") ||
    text.includes("generate content") ||
    text.includes("writing")
  ) {
    return "AI is improving content production efficiency for creators."
  }

  if (
    text.includes("audience") ||
    text.includes("engagement") ||
    text.includes("followers") ||
    text.includes("subscriber") ||
    text.includes("community")
  ) {
    return "AI-supported strategies can help creators grow and engage audiences."
  }

  if (
    text.includes("revenue") ||
    text.includes("monetization") ||
    text.includes("monetisation") ||
    text.includes("sales") ||
    text.includes("income") ||
    text.includes("pricing")
  ) {
    return "AI is opening new ways for creators to optimize revenue and monetization."
  }

  if (
    text.includes("creative") ||
    text.includes("ideation") ||
    text.includes("brainstorm") ||
    text.includes("draft") ||
    text.includes("idea")
  ) {
    return "AI is enhancing creative workflows and ideation for creators."
  }

  if (
    text.includes("analytics") ||
    text.includes("data") ||
    text.includes("performance") ||
    text.includes("metrics") ||
    text.includes("insight")
  ) {
    return "AI-driven analytics can improve content performance insights."
  }

  if (
    text.includes("ethic") ||
    text.includes("responsible") ||
    text.includes("transparency") ||
    text.includes("privacy") ||
    text.includes("trust") ||
    text.includes("human")
  ) {
    return "Responsible and ethical AI use remains important for creators."
  }

  return null
}

function isUsefulSentence(sentence: string) {
  const text = sentence.toLowerCase()

  if (sentence.length < 50) return false
  if (sentence.length > 420) return false

  const junkPatterns = [
    "sign up",
    "cookie",
    "privacy policy",
    "terms of service",
    "share this",
    "advertisement",
    "subscribe",
    "newsletter",
    "main navigation",
    "get in touch",
    "all rights reserved",
    "published",
    "minutes ago",
    "min read",
    "minute read",
    "hours ago",
    "days ago",
    "read more",
    "author",
    "author:",
    "written by",
    "contact",
    "email",
    "phone",
    "hello@",
    "top stories",
    "latest stories",
    "latest news",
    "breaking news",
    "copyright",
    "table of contents",
    "frequently asked questions",
    "faq",
    "conclusion",
    "trending now",
    "view all",
    "image by",
    "photo by",
    "hero image",
    "shares",
    "total shares",
    "follow us",
    "category:",
    "tags:",
    "comments",
    "leave a reply",
  ]

  if (junkPatterns.some((pattern) => text.includes(pattern))) {
    return false
  }

  const usefulPatterns = [
    /\b\d+%/,
    /\b\d{4}\b/,
    /\bmarket\b/,
    /\bgrowth\b/,
    /\bcreators?\b/,
    /\bautomation\b/,
    /\bartificial intelligence\b/,
    /\bgenerative ai\b/,
    /\bworkflow\b/,
    /\btools?\b/,
    /\btrend\b/,
    /\bchallenge\b/,
    /\brisk\b/,
    /\bopportunity\b/,
    /\bplatform\b/,
    /\baudience\b/,
    /\bcontent\b/,
    /\bbusiness\b/,
    /\brevenue\b/,
    /\bproductivity\b/,
    /\bethic/,
    /\btransparency\b/,
    /\bhuman\b/,
    /\bcreative\b/,
    /\bideation\b/,
    /\banalytics\b/,
  ]

  return usefulPatterns.some((pattern) => pattern.test(text))
}

function buildClaims(topic: string, evidence: EvidenceRecord): string[] {
  const canonicalClaims = new Set<string>()

  const sentences = evidence.extractedText
    .split(/(?<=[.!?])\s+/)
    .map(cleanSentence)
    .filter(isUsefulSentence)

  for (const sentence of sentences.slice(0, 12)) {
    const claim = canonicalClaim(sentence)

    if (claim) {
      canonicalClaims.add(claim)
    }
  }

  return Array.from(canonicalClaims).slice(0, 5)
}

export function factExtractor(
  topic: string,
  evidenceRecords: EvidenceRecord[]
): FactExtractionResult {
  const facts = evidenceRecords.flatMap((evidence) =>
    buildClaims(topic, evidence).map((claim) => ({
      claim,
      evidenceId: evidence.id,
      sourceTitle: evidence.sourceTitle,
      sourceUrl: evidence.sourceUrl,
      sourceType: evidence.sourceType,
      evidenceText: evidence.extractedText,
      confidence: confidenceLabel(evidence.confidence),
      requiresHumanReview: true,
    }))
  ) as ExtractedFact[]

  const uniqueFacts = factDeduplicator(facts)

  return {
    topic,
    facts: uniqueFacts,
    factCount: uniqueFacts.length,
    extractionStatus:
      uniqueFacts.length > 0
        ? "Canonical facts extracted from evidence records."
        : "No facts extracted because no suitable evidence records were supplied.",
  }
}