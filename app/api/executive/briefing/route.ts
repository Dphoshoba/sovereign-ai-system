import { NextResponse } from "next/server"
import {
  generateExecutiveRecommendations,
  type ExecutiveIntelligenceRecommendation,
} from "@/lib/executive/recommendations"
import {
  generateExecutiveOpportunities,
  type ExecutiveOpportunity,
} from "@/lib/executive/opportunities"
import {
  generateExecutiveRisks,
  type ExecutiveRisk,
} from "@/lib/executive/risks"
import {
  ConfidenceAnalysis,
  computeCompositeConfidence,
} from "@/lib/executive/evidence-confidence"
import { generatePredictionSet } from "@/lib/executive/prediction-engine"

export const dynamic = "force-dynamic"

const SEVERITY_PENALTY: Record<ExecutiveRisk["severity"], number> = {
  critical: 15,
  high: 10,
  medium: 6,
  low: 3,
}

function computeBriefingHealth(
  risks: ExecutiveRisk[],
  opportunities: ExecutiveOpportunity[]
) {
  let health = 100

  for (const risk of risks) {
    health -= SEVERITY_PENALTY[risk.severity]
  }

  // Strong opportunity pipeline offsets some risk pressure.
  health += Math.min(5, opportunities.length)

  return Math.max(0, Math.min(100, health))
}

function buildNextActions(
  recommendations: ExecutiveIntelligenceRecommendation[],
  risks: ExecutiveRisk[]
) {
  const actions: string[] = []

  for (const recommendation of recommendations.slice(0, 5)) {
    actions.push(recommendation.action)
  }

  for (const risk of risks.slice(0, 3)) {
    if (!actions.includes(risk.mitigation)) {
      actions.push(risk.mitigation)
    }
  }

  return actions.slice(0, 7)
}

export async function GET() {
  try {
    const [recommendations, opportunities, risks] = await Promise.all([
      generateExecutiveRecommendations(),
      generateExecutiveOpportunities(),
      generateExecutiveRisks(),
    ])

    const health = computeBriefingHealth(risks, opportunities)

    const allConfidences = [
      ...opportunities.map(o => o.evidenceConfidence.score),
      ...risks.map(r => r.evidenceConfidence.score),
      ...recommendations.map(r => r.confidence),
    ];
    const allSourceCounts = [
      ...opportunities.map(o => o.evidenceConfidence.sourceCount),
      ...risks.map(r => r.evidenceConfidence.sourceCount),
      ...recommendations.filter(r => r.evidenceIds).map(r => r.evidenceIds!.length),
    ];

    const confidenceAnalysis: ConfidenceAnalysis = {
      overallConfidence: computeCompositeConfidence(allConfidences, allSourceCounts),
      assumptionConfidence: 0.85,
      evidenceCoverage: allConfidences.length > 0 ? (allConfidences.filter(c => c >= 0.6).length / allConfidences.length) : 0,
      trackRecordComments: `${opportunities.length} opportunities, ${risks.length} risks assessed`,
      componentCount: allConfidences.length,
      componentsAssessed: allConfidences.length,
    };

    const explainabilitySummary = {
      opportunitiesWithEvidence: opportunities.filter(o => o.reasoning.supportingEvidence.length > 0).length,
      risksWithEvidence: risks.filter(r => r.reasoning.supportingEvidence.length > 0).length,
      recommendationsWithEvidence: recommendations.filter(r => r.reasoning.supportingEvidence.length > 0).length,
      totalConfidenceFactors: [
        ...opportunities.flatMap(o => o.reasoning.confidenceFactors),
        ...risks.flatMap(r => r.reasoning.confidenceFactors),
        ...recommendations.flatMap(r => r.reasoning.confidenceFactors),
      ].length,
      missingEvidenceCounts: [
        ...opportunities.flatMap(o => o.reasoning.missingEvidence),
        ...risks.flatMap(r => r.reasoning.missingEvidence),
      ].length,
    }

    return NextResponse.json({
      ok: true,
      briefing: {
        health,
        generatedAt: new Date().toISOString(),
        topOpportunities: opportunities.slice(0, 5),
        topRisks: risks.slice(0, 5),
        recommendations: recommendations.slice(0, 5),
        nextActions: buildNextActions(recommendations, risks),
        confidenceAnalysis,
        explainabilitySummary,
        decisionMemory: {
          totalTracked: 0,
          effectiveSince: 'Not yet populated — requires production decision outcomes',
        },
        totals: {
          recommendations: recommendations.length,
          opportunities: opportunities.length,
          risks: risks.length,
        },
        predictions: generatePredictionSet({
          baselineRevenue: 10000,
          trendRevenue: 1500,
          sourceCount: opportunities.length + recommendations.length,
          timestampMs: Date.now(),
        }),
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Executive briefing failed",
      },
      { status: 500 }
    )
  }
}
