export const PLANETARY_DOMAINS = [
  "AI economy",
  "Creator economy",
  "Ministry/church technology",
  "Global markets",
  "Governance/regulation",
  "Education",
  "Media/content",
  "Spiritual/cultural shifts",
]

export const STRESS_SCENARIO_TYPES = [
  "optimistic",
  "balanced",
  "disruptive",
  "recessionary",
  "regulatory pressure",
  "AI acceleration",
  "ministry opportunity",
  "creator economy contraction",
]

export const STRATEGIC_SHOCK_TYPES = [
  "AI price collapse",
  "model access restrictions",
  "platform algorithm change",
  "payment processor disruption",
  "regulation change",
  "major market opportunity",
  "cultural/spiritual awakening signal",
]

export const WORLD_MODEL_V2_JSON_SCHEMA = {
  title: "string",
  summary: "string",
  domains: [],
  scenarios: [],
  stressTests: [],
  shocks: [],
  postures: [],
  recommendations: [],
}

export function clampScore(value: number, min = 0, max = 100) {
  if (Number.isNaN(value)) return min
  return Math.max(min, Math.min(max, Math.round(value)))
}

export function computeCompositeScore(input: {
  urgency?: number
  opportunity?: number
  risk?: number
  costPressure?: number
  executionDifficulty?: number
  governanceSensitivity?: number
  confidence?: number
}) {
  const urgency = clampScore(input.urgency ?? 50)
  const opportunity = clampScore(input.opportunity ?? 50)
  const risk = clampScore(input.risk ?? 40)
  const costPressure = clampScore(input.costPressure ?? 40)
  const executionDifficulty = clampScore(input.executionDifficulty ?? 40)
  const governanceSensitivity = clampScore(input.governanceSensitivity ?? 40)
  const confidence = clampScore(input.confidence ?? 70)

  return clampScore(
    opportunity * 0.3 +
      urgency * 0.2 +
      confidence * 0.2 -
      risk * 0.1 -
      costPressure * 0.1 -
      executionDifficulty * 0.05 -
      governanceSensitivity * 0.05
  )
}

export function priorityFromScores(input: {
  urgency?: number
  opportunity?: number
  risk?: number
  governanceSensitivity?: number
}) {
  const urgency = clampScore(input.urgency ?? 50)
  const opportunity = clampScore(input.opportunity ?? 50)
  const risk = clampScore(input.risk ?? 40)
  const governanceSensitivity = clampScore(input.governanceSensitivity ?? 40)

  if (risk >= 85 || governanceSensitivity >= 85) return "critical"
  if (urgency >= 75 || opportunity >= 80 || risk >= 70) return "high"
  if (urgency >= 45 || opportunity >= 50 || risk >= 45) return "medium"
  return "low"
}

export function requiresPlanetaryApproval(input: {
  risk?: number
  urgency?: number
  governanceSensitivity?: number
  executionDifficulty?: number
  priority?: string
}) {
  const risk = clampScore(input.risk ?? 40)
  const urgency = clampScore(input.urgency ?? 50)
  const governanceSensitivity = clampScore(input.governanceSensitivity ?? 40)
  const executionDifficulty = clampScore(input.executionDifficulty ?? 40)

  return (
    input.priority === "critical" ||
    input.priority === "high" ||
    risk >= 70 ||
    urgency >= 85 ||
    governanceSensitivity >= 65 ||
    executionDifficulty >= 80
  )
}