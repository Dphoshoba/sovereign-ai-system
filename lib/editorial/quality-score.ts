export type EditorialQualityInput = {
  wordCount: number
  hasTitle: boolean
  hasExcerpt: boolean
  hasSeoTitle: boolean
  hasSeoDescription: boolean
  hasFeaturedImage: boolean
  consensusScore: number
  verifiedCount: number
  partiallyVerifiedCount: number
  unverifiedCount: number
  publicationRecommendation: string
}

export type EditorialQualityResult = {
  score: number
  grade: "reject" | "review" | "approval-candidate"
  warnings: string[]
}

export function calculateEditorialQualityScore(
  input: EditorialQualityInput
): EditorialQualityResult {
  const warnings: string[] = []
  let score = 0

  if (input.hasTitle) score += 10
  else warnings.push("Missing title.")

  if (input.hasExcerpt) score += 10
  else warnings.push("Missing excerpt.")

  if (input.hasSeoTitle) score += 10
  else warnings.push("Missing SEO title.")

  if (input.hasSeoDescription) score += 10
  else warnings.push("Missing SEO description.")

  if (input.hasFeaturedImage) score += 10
  else warnings.push("Missing featured image.")

  if (input.wordCount >= 800) score += 15
  else warnings.push("Article may be too short.")

  if (input.consensusScore >= 80) score += 20
  else if (input.consensusScore >= 50) score += 10
  else warnings.push("Low research consensus score.")

  if (input.verifiedCount > 0 || input.partiallyVerifiedCount > 0) score += 15
  else warnings.push("No verified or partially verified facts.")

  if (input.unverifiedCount > 0) warnings.push("Contains unverified facts.")

  if (input.publicationRecommendation === "blocked") {
    score = Math.min(score, 59)
    warnings.push("Research recommendation blocks publishing.")
  }

  const grade =
    score >= 80
      ? "approval-candidate"
      : score >= 60
        ? "review"
        : "reject"

  return {
    score,
    grade,
    warnings,
  }
}
