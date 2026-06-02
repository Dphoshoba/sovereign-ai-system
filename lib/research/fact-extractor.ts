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
    .trim()
}

function isUsefulSentence(sentence: string) {
  const text = sentence.toLowerCase()

  if (sentence.length < 60) return false
  if (sentence.length > 320) return false

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
    "by ",
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
    "conclusion:",
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
    "this article",
    "the source",
    "ai-generated",
    "future trends",
    "provides relevant evidence",
    "future of digital media",
    "potential for growth",
    "start your journey",
    "industry impact",
    "key benchmarks",
  ]

  if (junkPatterns.some((pattern) => text.includes(pattern))) {
    return false
  }

  const metadataPatterns = [
    /\b\d{5,}\b/,
    /\+\d{2,}/,
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  ]

  if (metadataPatterns.some((pattern) => pattern.test(sentence))) {
    return false
  }

  // Reject "N min/hour/day read" style metadata.
  if (
    /^\d+\s*(min|minute|minutes|hour|hours|day|days)\s*read/i.test(sentence)
  ) {
    return false
  }

  const trimmed = sentence.trim()
  const lowerTrimmed = trimmed.toLowerCase()

  // Reject sentences that begin with known boilerplate / headline prefixes.
  const rejectedPrefixes = [
    "published",
    "by ",
    "image by",
    "trending",
    "view all",
    "total",
    "shares",
    "the source",
    "this article",
    "future of",
    "from hours to",
    "ai revolution",
    "how ai is",
  ]

  if (rejectedPrefixes.some((prefix) => lowerTrimmed.startsWith(prefix))) {
    return false
  }

  const words = trimmed.split(/\s+/).filter(Boolean)

  // Reject very short sentences (fewer than 8 words).
  if (words.length < 8) {
    return false
  }

  // Reject sentences where more than 60% of words begin with an uppercase
  // letter (headlines, navigation, title-case fragments).
  const capitalizedWords = words.filter((word) => /^[A-Z]/.test(word))
  if (capitalizedWords.length / words.length > 0.6) {
    return false
  }

  // Reject sentences that are more than 40% numbers / symbols.
  const condensed = trimmed.replace(/\s+/g, "")
  if (condensed.length > 0) {
    const symbolOrNumber = condensed.replace(/[a-z]/gi, "").length
    if (symbolOrNumber / condensed.length > 0.4) {
      return false
    }
  }

  // Reject sentences ending in incomplete / cut-off phrases.
  const incompleteEndings = [
    "to know to",
    "need to",
    "what professionals need",
  ]

  const endText = lowerTrimmed.replace(/[^a-z ]+$/g, "").trimEnd()
  if (incompleteEndings.some((ending) => endText.endsWith(ending))) {
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
  ]

  return usefulPatterns.some((pattern) => pattern.test(text))
}

function sentenceToClaim(sentence: string) {
  return cleanSentence(sentence)
}

function buildClaims(topic: string, evidence: EvidenceRecord): string[] {
  const sentences = evidence.extractedText
    .split(/(?<=[.!?])\s+/)
    .map(cleanSentence)
    .filter(isUsefulSentence)

  const claims = sentences
    .slice(0, 5)
    .map(sentenceToClaim)

  if (claims.length === 0) {
    return []
  }

  return claims
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
        ? "Structured facts extracted from evidence records."
        : "No facts extracted because no suitable evidence records were supplied.",
  }
}
