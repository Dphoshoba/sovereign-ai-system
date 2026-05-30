import type { EvidenceChunk } from "./evidence-chunker"

export type RankedEvidenceChunk = EvidenceChunk & {
  relevanceScore: number
  matchedKeywords: string[]
}

function extractKeywords(topic: string): string[] {
  const stopWords = [
    "the",
    "and",
    "for",
    "with",
    "from",
    "that",
    "this",
    "into",
    "about",
    "what",
    "when",
    "where",
    "will",
    "have",
    "has",
    "are",
    "was",
    "were",
    "why",
    "how",
    "risks",
    "opportunities",
  ]

  return topic
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(
      (word) =>
        word.length > 2 &&
        !stopWords.includes(word)
    )
}

export function chunkRanker(
  topic: string,
  chunks: EvidenceChunk[]
): RankedEvidenceChunk[] {
  const topicKeywords = extractKeywords(topic)

  const priorityKeywords = [
    "artificial",
    "intelligence",
    "ai",
    "machine",
    "learning",
    "ethics",
    "faith",
    "responsible",
    "technology",
    "human",
    "decision",
    "risk",
    "wisdom",
  ]

  return chunks
    .map((chunk) => {
      const text = chunk.text.toLowerCase()

      const matchedKeywords = [
        ...topicKeywords,
        ...priorityKeywords,
      ].filter((keyword, index, array) => {
        return (
          array.indexOf(keyword) === index &&
          text.includes(keyword)
        )
      })

      const noisePenalty = [
        "newsletter",
        "subscribe",
        "privacy",
        "cookie",
        "advertisement",
      ].filter((noise) => text.includes(noise)).length * 10

      const relevanceScore = Math.max(
        0,
        Math.min(100, matchedKeywords.length * 8 - noisePenalty)
      )

      return {
        ...chunk,
        relevanceScore,
        matchedKeywords,
      }
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
}
