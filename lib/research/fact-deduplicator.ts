import type { ExtractedFact } from "./fact-extractor"

function duplicateKey(fact: ExtractedFact): string {
  return [
    fact.claim.toLowerCase().trim(),
    fact.evidenceId,
    fact.sourceUrl,
    fact.evidenceText.trim().toLowerCase().replace(/\s+/g, " "),
  ].join("\n")
}

export function factDeduplicator(
  facts: ExtractedFact[]
): ExtractedFact[] {
  const seen = new Set<string>()
  const unique: ExtractedFact[] = []

  for (const fact of facts) {
    const key = duplicateKey(fact)
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(fact)
  }

  return unique
}