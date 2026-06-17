import type { ExtractedFact } from "./fact-extractor"

export function factDeduplicator(
  facts: ExtractedFact[]
): ExtractedFact[] {
  const grouped = new Map<string, ExtractedFact[]>()

  for (const fact of facts) {
    const key = fact.claim.toLowerCase().trim()

    if (!grouped.has(key)) {
      grouped.set(key, [])
    }

    grouped.get(key)?.push(fact)
  }

  return Array.from(grouped.values()).flat()
}