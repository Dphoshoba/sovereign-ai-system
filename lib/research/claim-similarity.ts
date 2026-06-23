function normalizeSynonyms(text: string) {
  return text
    .replace(/\bartificial intelligence\b/g, "ai")
    .replace(/\bmachine learning\b/g, "ai")
    .replace(/\bgenerative ai\b/g, "ai")

    .replace(/\bcontent creation\b/g, "content")
    .replace(/\bcontent production\b/g, "content")
    .replace(/\bvideo creation\b/g, "content")
    .replace(/\bmedia creation\b/g, "content")

    .replace(/\bproduce\b/g, "create")
    .replace(/\bproduces\b/g, "create")
    .replace(/\bproduction\b/g, "create")
    .replace(/\bcreating\b/g, "create")
    .replace(/\bcreated\b/g, "create")

    .replace(/\bautomation\b/g, "automate")
    .replace(/\bautomated\b/g, "automate")
    .replace(/\bautomating\b/g, "automate")

    .replace(/\bcreators\b/g, "creator")
    .replace(/\baudiences\b/g, "audience")

    .replace(/\bengage\b/g, "engagement")
    .replace(/\bengaging\b/g, "engagement")

    .replace(/\breach\b/g, "distribution")
    .replace(/\bdistribute\b/g, "distribution")
    .replace(/\bpublishing\b/g, "publish")
    .replace(/\bpublished\b/g, "publish")

    .replace(/\bincome\b/g, "revenue")
    .replace(/\bmonetization\b/g, "revenue")
    .replace(/\bmonetisation\b/g, "revenue")
    .replace(/\bmonetize\b/g, "revenue")

    .replace(/\bworkflows\b/g, "workflow")
    .replace(/\bprocesses\b/g, "workflow")
    .replace(/\bpipeline\b/g, "workflow")
    .replace(/\bpipelines\b/g, "workflow")

    .replace(/\befficient\b/g, "productivity")
    .replace(/\befficiency\b/g, "productivity")
    .replace(/\bproductive\b/g, "productivity")

    .replace(/\brepetitive\b/g, "routine")
    .replace(/\broutine\b/g, "routine")
    .replace(/\bmanual\b/g, "routine")

    .replace(/\breview\b/g, "oversight")
    .replace(/\boversight\b/g, "oversight")
    .replace(/\baccountability\b/g, "responsibility")
    .replace(/\bresponsible\b/g, "responsibility")
    .replace(/\bethical\b/g, "ethics")
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
    "before",
    "after",
    "into",
    "through",
  ])

  return normalizeSynonyms(text.toLowerCase())
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => (word.length > 2 || word === "ai") && !stopWords.has(word))
}

function themeBoost(claimA: string, claimB: string): number {
  const a = normalizeSynonyms(claimA.toLowerCase())
  const b = normalizeSynonyms(claimB.toLowerCase())

  const themes = [
    ["ai", "automate", "workflow"],
    ["ai", "content", "productivity"],
    ["ai", "analytics", "performance"],
    ["ai", "ethics", "responsibility"],
    ["human", "oversight", "publish"],
    ["creator", "revenue", "workflow"],
    ["routine", "creator", "task"],
  ]

  for (const theme of themes) {
    const matchesA = theme.filter((word) => a.includes(word)).length
    const matchesB = theme.filter((word) => b.includes(word)).length

    if (matchesA >= 2 && matchesB >= 2) {
      return 12
    }
  }

  return 0
}

export function claimSimilarity(claimA: string, claimB: string): number {
  const tokensA = new Set(tokenize(claimA))
  const tokensB = new Set(tokenize(claimB))

  if (tokensA.size === 0 || tokensB.size === 0) {
    return 0
  }

  const intersection = [...tokensA].filter((token) => tokensB.has(token))

  const union = new Set([...tokensA, ...tokensB])
  const minTokenCount = Math.min(tokensA.size, tokensB.size)

  const baseScore =
    (intersection.length / union.size) * 65 +
    (intersection.length / minTokenCount) * 35

  return Math.min(Math.round(baseScore + themeBoost(claimA, claimB)), 100)
}

export function claimsAreSimilar(
  claimA: string,
  claimB: string,
  threshold = 45
): boolean {
  return claimSimilarity(claimA, claimB) >= threshold
}