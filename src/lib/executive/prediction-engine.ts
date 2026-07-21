import {
  EvidenceConfidence,
  computeEvidenceConfidence,
  ReasoningChain,
  buildReasoning,
} from './evidence-confidence'

export type PredictionHorizon = '30d' | '90d' | '180d'

export interface Prediction {
  id: string
  metric: string
  horizon: PredictionHorizon
  value: number
  confidence: EvidenceConfidence
  reasoning: ReasoningChain
  assumptions: string[]
  riskAdjustment: number
  generatedAt: number
}

export interface PredictionSet {
  id: string
  generatedAt: number
  predictions: Prediction[]
  summary: string
  overallConfidence: number
}

export function forecastPrediction(params: {
  metric: string
  horizon: PredictionHorizon
  baselineValue: number
  trendFactor: number
  confidenceSourceCount: number
  confidenceTimestampMs: number
  assumptions?: string[]
  riskAdjustment?: number
}): Prediction {
  const now = Date.now()
  const horizonMultiplier =
    params.horizon === '30d' ? 0.3 : params.horizon === '90d' ? 0.6 : 1.0
  const value =
    params.baselineValue + params.trendFactor * horizonMultiplier
  const riskAdj = params.riskAdjustment || 0

  const confidence = computeEvidenceConfidence({
    evidenceIds: [`pred-${params.metric}-${params.horizon}`],
    sourceCount: params.confidenceSourceCount,
    timestampMs: params.confidenceTimestampMs,
    missingEvidence:
      params.horizon === '180d'
        ? ['Long-range uncertainty', 'Market volatility']
        : [],
  })

  const reasoning = buildReasoning({
    summary: `${params.horizon} forecast for ${params.metric}: ${value.toFixed(2)}`,
    evidenceIds: [`pred-${params.metric}-${params.horizon}`],
    confidenceScore: confidence.score,
    sourceCount: confidence.sourceCount,
    dataFreshnessHours: confidence.dataFreshnessHours,
    missingEvidence: confidence.missingEvidence,
    hasConflictingEvidence: confidence.hasConflictingEvidence,
    decisionFactors: [
      `Baseline: ${params.baselineValue}`,
      `Trend factor: ${params.trendFactor}`,
      `Horizon: ${params.horizon} (multiplier ${horizonMultiplier})`,
      `Risk adjustment: ${riskAdj}`,
    ],
  })

  return {
    id: `pred-${params.metric}-${params.horizon}-${now}`,
    metric: params.metric,
    horizon: params.horizon,
    value: Math.round(value * 100) / 100,
    confidence,
    reasoning,
    assumptions: params.assumptions || [
      `${params.horizon} projection`,
      'Trend continues',
      'No structural disruption',
    ],
    riskAdjustment: riskAdj,
    generatedAt: now,
  }
}

export function generatePredictionSet(params: {
  baselineRevenue: number
  trendRevenue: number
  sourceCount: number
  timestampMs: number
}): PredictionSet {
  const metrics = ['Revenue', 'Risk', 'Capacity', 'Cashflow', 'Pipeline']
  const horizons: PredictionHorizon[] = ['30d', '90d', '180d']
  const predictions: Prediction[] = []

  for (const metric of metrics) {
    for (const horizon of horizons) {
      const baselineVals: Record<string, number> = {
        Revenue: params.baselineRevenue,
        Risk: 40,
        Capacity: 70,
        Cashflow: params.baselineRevenue * 0.8,
        Pipeline: params.baselineRevenue * 1.5,
      }
      const trendVals: Record<string, number> = {
        Revenue: params.trendRevenue * 0.15,
        Risk: params.trendRevenue * 0.03,
        Capacity: params.trendRevenue * 0.1,
        Cashflow: params.trendRevenue * 0.12,
        Pipeline: params.trendRevenue * 0.2,
      }
      predictions.push(
        forecastPrediction({
          metric,
          horizon,
          baselineValue: baselineVals[metric],
          trendFactor: trendVals[metric],
          confidenceSourceCount: params.sourceCount,
          confidenceTimestampMs: params.timestampMs,
          riskAdjustment: metric === 'Risk' ? 5 : 0,
        })
      )
    }
  }

  const overallConfidence =
    predictions.reduce((s, p) => s + p.confidence.score, 0) /
    predictions.length

  return {
    id: `predset-${Date.now()}`,
    generatedAt: Date.now(),
    predictions,
    summary: `${predictions.length} predictions across ${metrics.length} metrics at ${horizons.length} horizons`,
    overallConfidence: Math.round(overallConfidence * 100) / 100,
  }
}
