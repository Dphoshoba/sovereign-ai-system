import type { ExtractedFact } from "./fact-extractor"

export function factDeduplicator(
  facts: ExtractedFact[]
): ExtractedFact[] {
  const seen = new Set<string>()

  return facts.filter((fact) => {
    const key = fact.claim
      .toLowerCase()
      .trim()

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}
