import { prisma } from "@/lib/prisma"

export type DecisionImpactArea =
  | "Revenue"
  | "Growth"
  | "Delivery"
  | "Operations"

export type DecisionImpact = {
  decision: string
  impactArea: DecisionImpactArea
  impactScore: number
  confidence: number
}

const STATUS_BASE_SCORE: Record<string, number> = {
  implemented: 60,
  approved: 40,
  proposed: 20,
  rejected: 5,
}

/** Map free-form decision categories / impact areas onto the four tracked areas. */
function resolveImpactArea(
  impactArea: string | null,
  category: string | null
): DecisionImpactArea {
  const key = (impactArea ?? category ?? "").trim().toLowerCase()

  if (key.includes("revenue") || key.includes("sales")) {
    return "Revenue"
  }

  if (
    key.includes("growth") ||
    key.includes("marketing") ||
    key.includes("strategy") ||
    key.includes("content")
  ) {
    return "Growth"
  }

  if (key.includes("delivery") || key.includes("client")) {
    return "Delivery"
  }

  return "Operations"
}

/** Normalize effectiveness to a 0-100 scale (seeds use 1-5, some data uses 0-100). */
function normalizeEffectiveness(value: number | null) {
  if (value === null) {
    return null
  }

  const normalized = value <= 5 ? value * 20 : value
  return Math.max(0, Math.min(100, normalized))
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

/**
 * Rule-based decision impact tracking. Scores each executive decision's
 * impact on Revenue, Growth, Delivery, or Operations. Deterministic.
 */
export async function trackDecisionImpacts(): Promise<DecisionImpact[]> {
  try {
    const decisions = await prisma.executiveDecision.findMany({
      orderBy: { createdAt: "desc" },
    })

    const impacts: DecisionImpact[] = []

    for (const decision of decisions) {
      const impactArea = resolveImpactArea(
        decision.impactArea,
        decision.category
      )
      const statusBase = STATUS_BASE_SCORE[decision.status] ?? 20
      const effectiveness = normalizeEffectiveness(decision.effectiveness)

      // Status drives half the score; recorded effectiveness drives the rest.
      const impactScore = clampScore(
        effectiveness !== null
          ? statusBase * 0.5 + effectiveness * 0.5
          : statusBase * 0.6
      )

      // Confidence rises with recorded evidence (outcome + effectiveness).
      const hasOutcome = Boolean(decision.outcome?.trim())
      const confidence =
        hasOutcome && effectiveness !== null
          ? 0.9
          : hasOutcome || effectiveness !== null
            ? 0.7
            : 0.5

      impacts.push({
        decision: decision.title,
        impactArea,
        impactScore,
        confidence,
      })
    }

    return impacts.sort(
      (a, b) =>
        b.impactScore - a.impactScore ||
        b.confidence - a.confidence ||
        a.decision.localeCompare(b.decision)
    )
  } catch (error) {
    console.error("Decision impact tracking failed:", error)
    return []
  }
}
