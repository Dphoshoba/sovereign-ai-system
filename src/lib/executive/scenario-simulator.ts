import { EvidenceConfidence, computeEvidenceConfidence, ReasoningChain, buildReasoning } from './evidence-confidence'
import { Prediction, PredictionSet, generatePredictionSet } from './prediction-engine'

export type ScenarioType = 'hire' | 'delay' | 'expand' | 'reduce_budget' | 'increase_marketing' | 'acquire' | 'launch_product'

export interface ScenarioDefinition {
  id: string
  type: ScenarioType
  title: string
  description: string
  assumptions: string[]
  impactMultipliers: {
    revenue: number
    risk: number
    capacity: number
    cashflow: number
    pipeline: number
  }
}

export interface ScenarioResult {
  scenario: ScenarioDefinition
  predictions: PredictionSet
  projectedOutcome: string
  risksIdentified: string[]
  opportunitiesIdentified: string[]
  recommendation: string
  overallConfidence: number
  generatedAt: number
}

const SCENARIO_DEFINITIONS: Record<ScenarioType, Omit<ScenarioDefinition, 'id'>> = {
  hire: {
    type: 'hire', title: 'Expand team', description: 'Hire additional staff across key departments',
    assumptions: ['Available talent pool', 'Onboarding takes 90 days', 'Budget available'],
    impactMultipliers: { revenue: 0.15, risk: 0.05, capacity: 0.20, cashflow: 0.10, pipeline: 0.25 },
  },
  delay: {
    type: 'delay', title: 'Delay initiatives', description: 'Postpone non-critical projects by 90 days',
    assumptions: ['Critical path unaffected', 'No client impact', 'Team remains aligned'],
    impactMultipliers: { revenue: -0.05, risk: -0.10, capacity: 0.15, cashflow: 0.05, pipeline: -0.10 },
  },
  expand: {
    type: 'expand', title: 'Market expansion', description: 'Enter new market segment',
    assumptions: ['Market demand validated', 'Competitive analysis complete', '6-month ramp-up'],
    impactMultipliers: { revenue: 0.25, risk: 0.15, capacity: -0.05, cashflow: 0.20, pipeline: 0.30 },
  },
  reduce_budget: {
    type: 'reduce_budget', title: 'Budget reduction', description: 'Reduce operational budget by 15%',
    assumptions: ['Non-essential spending identifiable', 'No layoffs required', 'Efficiency gains possible'],
    impactMultipliers: { revenue: 0.05, risk: 0.10, capacity: -0.10, cashflow: 0.15, pipeline: 0.05 },
  },
  increase_marketing: {
    type: 'increase_marketing', title: 'Marketing push', description: 'Increase marketing spend significantly',
    assumptions: ['Channel effectiveness validated', 'Content pipeline ready', '3-month ROI period'],
    impactMultipliers: { revenue: 0.20, risk: 0.05, capacity: 0.05, cashflow: 0.25, pipeline: 0.35 },
  },
  acquire: {
    type: 'acquire', title: 'Acquire company', description: 'Acquire a complementary business',
    assumptions: ['Due diligence complete', 'Integration plan exists', 'Culture compatible'],
    impactMultipliers: { revenue: 0.35, risk: 0.25, capacity: 0.15, cashflow: -0.10, pipeline: 0.40 },
  },
  launch_product: {
    type: 'launch_product', title: 'Launch new product', description: 'Bring new product to market',
    assumptions: ['MVP validated', 'Go-to-market strategy ready', '6-month development cycle'],
    impactMultipliers: { revenue: 0.30, risk: 0.20, capacity: -0.15, cashflow: 0.30, pipeline: 0.45 },
  },
}

export function simulateScenario(params: {
  type: ScenarioType
  baselineRevenue: number
  trendRevenue: number
  sourceCount: number
  timestampMs: number
}): ScenarioResult {
  const def = SCENARIO_DEFINITIONS[params.type]
  const now = Date.now()

  const scenario: ScenarioDefinition = {
    id: `scenario-${params.type}-${now}`,
    ...def,
  }

  const baseline = generatePredictionSet({
    baselineRevenue: params.baselineRevenue,
    trendRevenue: params.trendRevenue,
    sourceCount: params.sourceCount,
    timestampMs: params.timestampMs,
  })

  const simulatedRevenue = params.baselineRevenue * (1 + scenario.impactMultipliers.revenue)
  const simulatedTrend = params.trendRevenue * (1 + scenario.impactMultipliers.pipeline)

  const predictions = generatePredictionSet({
    baselineRevenue: simulatedRevenue,
    trendRevenue: simulatedTrend,
    sourceCount: params.sourceCount,
    timestampMs: params.timestampMs,
  })

  const risks: string[] = []
  if (scenario.impactMultipliers.risk > 0.1) risks.push(`Elevated risk exposure: ${scenario.impactMultipliers.risk * 100}% increase`)
  if (scenario.impactMultipliers.capacity < 0) risks.push('Capacity strain during transition')
  if (scenario.impactMultipliers.cashflow < 0) risks.push('Cashflow pressure in early phases')

  const opportunities: string[] = []
  if (scenario.impactMultipliers.revenue > 0.15) opportunities.push(`Revenue growth opportunity: ${scenario.impactMultipliers.revenue * 100}% gain`)
  if (scenario.impactMultipliers.pipeline > 0.2) opportunities.push('Pipeline expansion potential')

  const recommendation = scenario.impactMultipliers.revenue > 0.2
    ? `Strong recommendation: ${scenario.title} shows significant upside`
    : `Consider ${scenario.title.toLowerCase()} alongside other scenarios for balance`

  return {
    scenario,
    predictions,
    projectedOutcome: `${scenario.title}: projected revenue ${simulatedRevenue.toFixed(0)} (${(scenario.impactMultipliers.revenue * 100).toFixed(0)}% change)`,
    risksIdentified: risks,
    opportunitiesIdentified: opportunities,
    recommendation,
    overallConfidence: baseline.overallConfidence * 0.9,
    generatedAt: now,
  }
}

export function simulateAllScenarios(params: {
  baselineRevenue: number
  trendRevenue: number
  sourceCount: number
  timestampMs: number
}): ScenarioResult[] {
  const types: ScenarioType[] = ['hire', 'delay', 'expand', 'reduce_budget', 'increase_marketing', 'acquire', 'launch_product']
  return types.map(type => simulateScenario({ type, ...params }))
}
