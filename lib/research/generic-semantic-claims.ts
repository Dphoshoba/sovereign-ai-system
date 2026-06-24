function cleanGenericSentence(sentence: string): string {
  return sentence
    .replace(/\s+/g, " ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .trim()
}

function isGenericJunk(sentence: string): boolean {
  const text = sentence.toLowerCase()

  const junk = [
    "learn more",
    "watch the replay",
    "read the report",
    "explore ai",
    "ai academy",
    "register",
    "sign up",
    "on-demand",
    "quick read",
    "policy brief",
    "news",
    "services",
    "procurement",
    "human resources",
    "sales teams",
    "contact us",
    "webinar",
    "summit",
    "download",
    "use cases",
    "your business will see",
    "removing labor costs",
    "arguing that",
    "data transparency",
    "independent, rigorous measurement",
    "technologies from generative ai",
    "applied to the right ai use cases"
  ]

  return junk.some((item) => text.includes(item))
}

function hasClaimShape(sentence: string): boolean {
  const text = sentence.toLowerCase()

  return (
    /\b(is|are|was|were|can|could|may|might|will|has|have|helps|supports|improves|reduces|increases|requires|remains|shows|suggests)\b/.test(text) &&
    !isGenericJunk(sentence)
  )
}

export function genericSemanticClaims(sentence: string): string[] {
  const cleaned = cleanGenericSentence(sentence)

  if (cleaned.length < 70) return []
  if (cleaned.length > 220) return []
  if (!hasClaimShape(cleaned)) return []

  return [cleaned]
}