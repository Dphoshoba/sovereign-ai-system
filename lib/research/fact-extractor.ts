import type { EvidenceRecord } from "./evidence-registry"
import { factDeduplicator } from "./fact-deduplicator"
import { genericSemanticClaims } from "./generic-semantic-claims"


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

function isUsefulClaim(claim: string): boolean {
  const normalized = claim.toLowerCase().trim()

  if (normalized.length < 40) return false
  if (normalized.length > 240) return false

  const blockedPhrases = [
    "contact us",
    "buy now",
    "free trial",
    "sunflower",
    "menu",
    "cookie",
    "privacy policy",
    "terms of service",
    "subscribe",
    "newsletter",
    "table of contents",
    "frequently asked questions",
    "all rights reserved",
    "read more",
    "get in touch",
    "hero image",
    "category:",
    "tags:",
  ]

  return !blockedPhrases.some((phrase) => normalized.includes(phrase))
}

function aiAutomationClaims(sentence: string): string[] {
  const text = sentence.toLowerCase()
  const claims = new Set<string>()

  if (text.includes("repetitive") || text.includes("routine")) {
    claims.add("AI automation can reduce repetitive creator tasks.")
  }

  if (text.includes("workflow") || text.includes("process") || text.includes("pipeline")) {
    claims.add("AI automation can improve creator workflows.")
  }

  if (text.includes("draft") || text.includes("first draft")) {
    claims.add("AI-assisted drafting can support content production.")
  }

  if (text.includes("editing") || text.includes("rewrite") || text.includes("clarity")) {
    claims.add("AI tools can assist with content editing workflows.")
  }

  if (text.includes("format") || text.includes("reformat") || text.includes("repurpose")) {
    claims.add("AI automation can reduce manual formatting and repurposing effort.")
  }

  if (
    text.includes("content production") ||
    text.includes("content creation") ||
    text.includes("produce content") ||
    text.includes("generate content") ||
    text.includes("writing")
  ) {
    claims.add("AI can improve content production efficiency for creators.")
  }

  if (
    text.includes("outline") ||
    text.includes("planning") ||
    text.includes("structure")
  ) {
    claims.add("AI tools can support content planning and outlining.")
  }

  if (
    text.includes("title") ||
    text.includes("headline") ||
    text.includes("caption") ||
    text.includes("summary")
  ) {
    claims.add("AI tools can support creator packaging tasks such as titles, captions, and summaries.")
  }

  if (
    text.includes("audience") ||
    text.includes("engagement") ||
    text.includes("followers") ||
    text.includes("subscriber") ||
    text.includes("community")
  ) {
    claims.add("AI-supported workflows can help creators plan audience engagement.")
  }

  if (
    text.includes("revenue") ||
    text.includes("monetization") ||
    text.includes("monetisation") ||
    text.includes("sales") ||
    text.includes("income") ||
    text.includes("pricing")
  ) {
    claims.add("AI can support creator monetization and revenue workflow planning.")
  }

  if (
    text.includes("creative") ||
    text.includes("ideation") ||
    text.includes("brainstorm") ||
    text.includes("idea")
  ) {
    claims.add("AI tools can support creator ideation and creative planning.")
  }

  if (
    text.includes("analytics") ||
    text.includes("performance") ||
    text.includes("metrics") ||
    text.includes("insight")
  ) {
    claims.add("AI-driven analytics can improve content performance insights.")
  }

  if (
    text.includes("ethic") ||
    text.includes("responsible") ||
    text.includes("transparency") ||
    text.includes("privacy") ||
    text.includes("trust")
  ) {
    claims.add("Responsible and ethical AI use remains important for creators.")
  }

  if (
    text.includes("human") ||
    text.includes("review") ||
    text.includes("oversight") ||
    text.includes("accountability")
  ) {
    claims.add("Human review remains important before publishing AI-assisted content.")
  }

  return Array.from(claims).filter(isUsefulClaim)
}

function isUsefulSentence(sentence: string) {
  const text = sentence.toLowerCase()

  if (sentence.length < 40) return false
  if (sentence.length > 500) return false

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
    "sunflower",
  ]

  if (junkPatterns.some((pattern) => text.includes(pattern))) {
    return false
  }

  const usefulPatterns = [
    /\bcreators?\b/,
    /\bautomation\b/,
    /\bartificial intelligence\b/,
    /\bgenerative ai\b/,
    /\bworkflow\b/,
    /\btools?\b/,
    /\baudience\b/,
    /\bcontent\b/,
    /\brevenue\b/,
    /\bproductivity\b/,
    /\bethic/,
    /\btransparency\b/,
    /\bhuman\b/,
    /\bcreative\b/,
    /\bideation\b/,
    /\banalytics\b/,
    /\bdraft\b/,
    /\bediting\b/,
    /\bformat\b/,
    /\brepurpose\b/,
    /\boutline\b/,
    /\bresponsible\b/,
    /\btrust\b/,
  ]

  return usefulPatterns.some((pattern) => pattern.test(text))
}

function buildClaims(topic: string, evidence: EvidenceRecord): string[] {
  const claims = new Set<string>()

  const sentences = evidence.extractedText
    .split(/(?<=[.!?])\s+/)
    .map(cleanSentence)
    .filter(isUsefulSentence)

    for (const sentence of sentences.slice(0, 20)) {
      for (const claim of aiAutomationClaims(sentence)) {
        claims.add(claim)
      }
    
      for (const claim of genericSemanticClaims(sentence)) {
        claims.add(claim)
      }
    }

  return Array.from(claims).slice(0, 12)
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

  console.log(
    "Extracted Unique Claims:",
    Array.from(new Set(uniqueFacts.map((fact) => fact.claim)))
  )

  return {
    topic,
    facts: uniqueFacts,
    factCount: uniqueFacts.length,
    extractionStatus:
      uniqueFacts.length > 0
        ? "Expanded canonical facts extracted from evidence records."
        : "No facts extracted because no suitable evidence records were supplied.",
  }
}