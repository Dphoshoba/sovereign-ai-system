type RetentionInput = {
  hookStrength: number
  pacingScore: number
  emotionalIntensity: number
  titleStrength: number
  thumbnailStrength: number
}

export function retentionPredictionAgent(input: RetentionInput) {
  let score = 0

  score += input.hookStrength * 0.3
  score += input.pacingScore * 0.25
  score += input.emotionalIntensity * 0.2
  score += input.titleStrength * 0.15
  score += input.thumbnailStrength * 0.1

  const retentionScore = Math.round(score)

  const risks = []

  if (input.hookStrength < 60) {
    risks.push("Opening hook may lose viewers early.")
  }

  if (input.pacingScore < 60) {
    risks.push("Video pacing may reduce retention.")
  }

  if (input.thumbnailStrength < 60) {
    risks.push("Thumbnail may reduce click-through rate.")
  }

  if (input.titleStrength < 60) {
    risks.push("Title may lack emotional pull.")
  }

  const recommendations = []

  if (input.hookStrength < 80) {
    recommendations.push("Increase emotional intensity within first 5 seconds.")
  }

  if (input.pacingScore < 80) {
    recommendations.push("Add faster scene transitions and visual movement.")
  }

  if (input.thumbnailStrength < 80) {
    recommendations.push("Increase thumbnail contrast and emotional expression.")
  }

  if (input.titleStrength < 80) {
    recommendations.push("Use stronger curiosity-driven wording.")
  }

  return {
    retentionScore,

    prediction:
      retentionScore >= 85
        ? "High retention potential."
        : retentionScore >= 70
          ? "Moderate retention potential."
          : "Retention risk detected.",

    risks,

    recommendations,
  }
}