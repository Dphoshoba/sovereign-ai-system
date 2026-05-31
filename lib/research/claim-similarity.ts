function normalizeSynonyms(text: string) {
  return text
    .replace(/\bproduce\b/g, "create")
    .replace(/\bproduces\b/g, "create")
    .replace(/\bcreating\b/g, "create")
    .replace(/\bcreated\b/g, "create")
    .replace(/\bforms\b/g, "content")
    .replace(/\bform\b/g, "content")
    .replace(/\bsystems\b/g, "system")
    .replace(/\bmedia\b/g, "content")
}

function tokenize(text: string) {
  const stopWords = new Set([
    "the",
    "and",
    "or",
    "a",
    "an",
    "to",
    "of",
    "in",
    "for",
    "with",
    "that",
    "this",
    "can",
    "be",
    "is",
    "are",
    "as",
    "by",
    "from",
  ])

  return normalizeSynonyms(text.toLowerCase())
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(
      (word) =>
        word.length > 2 &&
        !stopWords.has(word)
    )
}

export function claimSimilarity(
  claimA: string,
  claimB: string
): number {
  const tokensA = new Set(tokenize(claimA))
  const tokensB = new Set(tokenize(claimB))

  if (tokensA.size === 0 || tokensB.size === 0) {
    return 0
  }

  const intersection = [...tokensA].filter((token) =>
    tokensB.has(token)
  )

  const union = new Set([
    ...tokensA,
    ...tokensB,
  ])

  return Math.round(
    (intersection.length / union.size) * 100
  )
}

export function claimsAreSimilar(
  claimA: string,
  claimB: string,
  threshold = 65
): boolean {
  return claimSimilarity(claimA, claimB) >= threshold
}
