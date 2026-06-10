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

    return NextResponse.json({
      ok: true,
      briefing: {
        health,
        generatedAt: new Date().toISOString(),
        topOpportunities: opportunities.slice(0, 5),
        topRisks: risks.slice(0, 5),
        recommendations: recommendations.slice(0, 5),
        nextActions: buildNextActions(recommendations, risks),
        totals: {
          recommendations: recommendations.length,
          opportunities: opportunities.length,
          risks: risks.length,
        },
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
