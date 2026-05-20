export const PLANETARY_DOMAINS = [
  "ai-economy",
  "creator-economy",
  "ministry-church-technology",
  "global-markets",
  "governance-regulation",
  "education",
  "media-content",
  "spiritual-cultural-shifts",
] as const

export const STRESS_SCENARIO_TYPES = [
  "optimistic",
  "balanced",
  "disruptive",
  "recessionary",
  "regulatory-pressure",
  "ai-acceleration",
  "ministry-opportunity",
  "creator-economy-contraction",
] as const

export const STRATEGIC_SHOCK_TYPES = [
  "ai-price-collapse",
  "model-access-restrictions",
  "platform-algorithm-change",
  "payment-processor-disruption",
  "regulation-change",
  "major-market-opportunity",
  "cultural-spiritual-awakening-signal",
] as const

export type PlanetaryDomain = (typeof PLANETARY_DOMAINS)[number]
export type StressScenarioType = (typeof STRESS_SCENARIO_TYPES)[number]
export type StrategicShockType = (typeof STRATEGIC_SHOCK_TYPES)[number]

export type RecommendationScores = {
  urgencyScore?: number
  opportunityScore?: number
  riskScore?: number
  costPressureScore?: number
  executionDifficultyScore?: number
  governanceSensitivityScore?: number
  confidenceScore?: number
}

export function clampScore(value: unknown, fallback = 50): number {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback
  return Math.max(0, Math.min(100, Math.round(value)))
}

export function computeCompositeScore(scores: RecommendationScores): number {
  const urgency = clampScore(scores.urgencyScore, 50)
  const opportunity = clampScore(scores.opportunityScore, 50)
  const risk = clampScore(scores.riskScore, 40)
  const cost = clampScore(scores.costPressureScore, 40)
  const execution = clampScore(scores.executionDifficultyScore, 50)
  const governance = clampScore(scores.governanceSensitivityScore, 40)

  const raw =
    opportunity * 0.28 +
    urgency * 0.22 +
    (100 - risk) * 0.18 +
    (100 - cost) * 0.1 +
    (100 - execution) * 0.12 +
    (100 - governance) * 0.1

  return clampScore(raw, 60)
}

export function requiresPlanetaryApproval(
  scores: RecommendationScores,
  explicit?: boolean
): boolean {
  if (explicit === true) return true

  const urgency = clampScore(scores.urgencyScore, 50)
  const risk = clampScore(scores.riskScore, 40)
  const governance = clampScore(scores.governanceSensitivityScore, 40)

  if (governance >= 70) return true
  if (risk >= 75) return true
  if (urgency >= 85 && risk >= 50) return true
  if (governance >= 55 && risk >= 60) return true

  return false
}

export function priorityFromScores(
  scores: RecommendationScores,
  compositeScore: number
): string {
  const risk = clampScore(scores.riskScore, 40)
  const urgency = clampScore(scores.urgencyScore, 50)

  if (risk >= 80 || (urgency >= 85 && compositeScore >= 75)) return "critical"
  if (compositeScore >= 78 || urgency >= 75) return "high"
  if (compositeScore >= 55) return "medium"
  return "low"
}

export const WORLD_MODEL_V2_JSON_SCHEMA = `{
  "title":"...",
  "summary":"...",
  "confidenceScore":0.72,
  "planetaryStability":74,
  "opportunityIndex":81,
  "systemicRiskIndex":42,
  "strategicReadiness":76,
  "assumptions":["..."],
  "findings":{
    "domainOutlook":{},
    "macroTensions":["..."],
    "integrationNotes":["..."]
  },
  "domainSignals":[
    {
      "domain":"ai-economy|creator-economy|ministry-church-technology|global-markets|governance-regulation|education|media-content|spiritual-cultural-shifts",
      "signalType":"opportunity|risk|shift|constraint",
      "title":"...",
      "summary":"...",
      "severity":"low|medium|high|critical",
      "probability":0.6,
      "impactScore":72,
      "sourceLayer":"knowledge-graph|reasoning-engine|billing|federation|governance|synthesis",
      "payload":{}
    }
  ],
  "scenarios":[
    {
      "title":"...",
      "scenarioType":"optimistic|balanced|disruptive|recessionary|regulatory-pressure|ai-acceleration|ministry-opportunity|creator-economy-contraction",
      "probability":0.45,
      "impactLevel":"low|medium|high|critical",
      "narrative":"...",
      "risks":["..."],
      "opportunities":["..."],
      "strategicMoves":["..."]
    }
  ],
  "stressTests":[
    {
      "title":"...",
      "stressType":"optimistic|balanced|disruptive|recessionary|regulatory-pressure|ai-acceleration|ministry-opportunity|creator-economy-contraction",
      "severity":"low|medium|high|critical",
      "resilienceScore":68,
      "description":"...",
      "mitigation":"...",
      "payload":{}
    }
  ],
  "shocks":[
    {
      "title":"...",
      "shockType":"ai-price-collapse|model-access-restrictions|platform-algorithm-change|payment-processor-disruption|regulation-change|major-market-opportunity|cultural-spiritual-awakening-signal",
      "severity":"low|medium|high|critical",
      "probability":0.35,
      "impactScore":70,
      "timeHorizon":"immediate|near-term|quarter|long-term",
      "narrative":"...",
      "responsePlan":"...",
      "payload":{}
    }
  ],
  "postures":[
    {
      "title":"...",
      "postureType":"defensive|balanced|offensive|adaptive|governance-first",
      "readinessScore":72,
      "riskExposure":38,
      "upsidePotential":80,
      "recommendation":"...",
      "payload":{}
    }
  ],
  "recommendations":[
    {
      "title":"...",
      "recommendationType":"strategy|market|governance|technology|creator-growth|ministry|billing",
      "priority":"low|medium|high|critical",
      "rationale":"...",
      "expectedOutcome":"...",
      "urgencyScore":70,
      "opportunityScore":82,
      "riskScore":45,
      "costPressureScore":35,
      "executionDifficultyScore":50,
      "governanceSensitivityScore":40,
      "confidenceScore":0.74,
      "requiredApproval":true,
      "payload":{}
    }
  ]
}`
