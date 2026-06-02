function normalizeSynonyms(text: string) {
  return (
    text
      // Multi-word phrases first so they collapse before single-word rules run.
      .replace(/\bartificial intelligence\b/g, "ai")
      .replace(/\bmachine learning\b/g, "ai")
      .replace(/\bgenerative ai\b/g, "ai")
      .replace(/\bcontent creation\b/g, "content")
      .replace(/\bvideo creation\b/g, "content")
      .replace(/\bmedia creation\b/g, "content")
      // Existing mappings.
      .replace(/\bproduce\b/g, "create")
      .replace(/\bproduces\b/g, "create")
      .replace(/\bcreating\b/g, "create")
      .replace(/\bcreated\b/g, "create")
      .replace(/\bforms\b/g, "content")
      .replace(/\bform\b/g, "content")
      .replace(/\bsystems\b/g, "system")
      .replace(/\bmedia\b/g, "content")
      // Automation family.
      .replace(/\bautomation\b/g, "automate")
      .replace(/\bautomated\b/g, "automate")
      .replace(/\bautomating\b/g, "automate")
      // Creators.
      .replace(/\bcreators\b/g, "creator")
      // Audience.
      .replace(/\baudiences\b/g, "audience")
      // Engagement.
      .replace(/\bengage\b/g, "engagement")
      .replace(/\bengaging\b/g, "engagement")
      // Distribution / reach.
      .replace(/\breach\b/g, "distribution")
      // Revenue family.
      .replace(/\bincome\b/g, "revenue")
      .replace(/\bmonetization\b/g, "revenue")
      .replace(/\bmonetisation\b/g, "revenue")
      .replace(/\bmonetize\b/g, "revenue")
      // Workflow.
      .replace(/\bworkflows\b/g, "workflow")
      // Productivity family.
      .replace(/\befficient\b/g, "productivity")
      .replace(/\befficiency\b/g, "productivity")
  )
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
        // Keep "ai" explicitly; the synonym map collapses several phrases to it.
        (word.length > 2 || word === "ai") &&
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

  const minTokenCount = Math.min(tokensA.size, tokensB.size)

  const score =
    (intersection.length / union.size) * 70 +
    (intersection.length / minTokenCount) * 30

  return Math.round(score)
}

export function claimsAreSimilar(
  claimA: string,
  claimB: string,
  threshold = 50
): boolean {
  return claimSimilarity(claimA, claimB) >= threshold
}
