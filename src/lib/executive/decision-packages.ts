import { generateMonthlyExecutiveReview } from "@/lib/executive/autonomous-review"
import { buildExecutiveMemory } from "@/lib/executive/memory"
import { generateExecutiveOpportunities } from "@/lib/executive/opportunities"
import { generateExecutiveRisks } from "@/lib/executive/risks"
import {
  generateStrategicAdjustments,
  type StrategicAdjustment,
  type StrategicAdjustmentPriorityLevel,
} from "@/lib/executive/strategy-adjustments"

// Phase 24 — Boardroom Decision Automation.
// Deterministically converts strategic adjustments (plus uncovered critical
// risks and top opportunities) into boardroom-ready decision packages.
// No OpenAI. Read-only — packages are generated on demand, never persisted.

export type DecisionPackageStatus =
  | "Draft"
  | "Ready For Boardroom"
  | "Approved"
  | "Rejected"
  | "Implemented"

export type DecisionPackage = {
  id: string
  title: string
  category: string
  priority: StrategicAdjustmentPriorityLevel
  decisionRequired: string
  rationale: string
  evidence: string[]
  expectedImpact: string
  confidence: number
  recommendation: string
  status: DecisionPackageStatus
}

export type DecisionPackageSummary = {
  total: number
  byStatus: Record<DecisionPackageStatus, number>
  byCategory: Record<string, number>
  readyForBoardroom: number
  averageConfidence: number
}

const HIGH_OPPORTUNITY_SCORE = 70

function clampConfidence(value: number) {
  return Math.round(Math.max(0.3, Math.min(0.95, value)) * 100) / 100
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
}

/** High/critical adjustments go straight to the boardroom; the rest are drafts. */
function statusForPriority(
  priority: StrategicAdjustmentPriorityLevel
): DecisionPackageStatus {
  return priority === "critical" || priority === "high"
    ? "Ready For Boardroom"
    : "Draft"
}

/** Map an adjustment category to the boardroom decision type it requires. */
function decisionRequiredForCategory(category: string, title: string) {
  switch (category) {
    case "Revenue":
      return `Revenue Decision: approve or reject "${title}" as a revenue priority this cycle.`
    case "Growth":
      return `Growth Decision: approve or reject "${title}" as a growth investment this cycle.`
    case "Governance":
      return `Governance Decision: approve or reject the governance change proposed in "${title}".`
    case "Delivery":
      return `Delivery Decision: approve or reject "${title}" to protect delivery commitments.`
    case "Operations":
      return `Operations Decision: approve or reject "${title}" as a standing operational change.`
    default:
      return `Strategy Decision: approve or reject "${title}" as a strategic priority this cycle.`
  }
}

function packageFromAdjustment(
  adjustment: StrategicAdjustment,
  reviewHealthScore: number
): DecisionPackage {
  return {
    id: `dp-${adjustment.id}`,
    title: adjustment.title,
    category: adjustment.category,
    priority: adjustment.priority,
    decisionRequired: decisionRequiredForCategory(
      adjustment.category,
      adjustment.title
    ),
    rationale: adjustment.rationale,
    evidence: [
      ...adjustment.evidence,
      `Current platform health score: ${reviewHealthScore}/100.`,
    ],
    expectedImpact: adjustment.expectedImpact,
    confidence: adjustment.confidence,
    recommendation:
      adjustment.priority === "critical" || adjustment.priority === "high"
        ? `Approve and implement now: ${adjustment.proposedAction}`
        : `Approve for next planning cycle: ${adjustment.proposedAction}`,
    status: statusForPriority(adjustment.priority),
  }
}

export async function generateDecisionPackages(): Promise<DecisionPackage[]> {
  const [adjustments, review, memory, risks, opportunities] =
    await Promise.all([
      generateStrategicAdjustments(),
      generateMonthlyExecutiveReview(),
      buildExecutiveMemory(),
      generateExecutiveRisks(),
      generateExecutiveOpportunities(),
    ])

  const packages: DecisionPackage[] = adjustments.map((adjustment) =>
    packageFromAdjustment(adjustment, review.healthScore)
  )

  const coveredText = packages
    .map((item) => `${item.title} ${item.rationale}`.toLowerCase())
    .join(" | ")

  // Critical/high revenue risks not already covered by an adjustment become
  // standalone revenue decisions.
  for (const risk of risks) {
    if (risk.severity !== "critical" && risk.severity !== "high") {
      continue
    }

    const keyword = risk.title.slice(0, 24).toLowerCase()
    if (coveredText.includes(keyword)) {
      continue
    }

    packages.push({
      id: `dp-risk-${slugify(risk.title)}`,
      title: `Resolve: ${risk.title}`,
      category: "Revenue",
      priority: risk.severity === "critical" ? "critical" : "high",
      decisionRequired: `Revenue Decision: approve the mitigation plan for "${risk.title}".`,
      rationale: `The risk engine flags this as ${risk.severity} severity and no strategic adjustment currently covers it.`,
      evidence: [
        `Risk impact: ${risk.impact}`,
        `Severity: ${risk.severity}.`,
        ...memory.strategicMemory.recurringRisks
          .filter((item) => item.occurrences >= 2)
          .slice(0, 1)
          .map(
            (item) =>
              `Related recurring risk in memory: "${item.text}" (${item.occurrences}x).`
          ),
      ],
      expectedImpact: `Neutralizes a ${risk.severity}-severity risk before it affects revenue or delivery.`,
      confidence: clampConfidence(risk.severity === "critical" ? 0.8 : 0.7),
      recommendation: risk.mitigation,
      status: "Ready For Boardroom",
    })
  }

  // High-scoring opportunities not already covered become growth decisions.
  for (const opportunity of opportunities) {
    if (opportunity.score < HIGH_OPPORTUNITY_SCORE) {
      continue
    }

    const keyword = opportunity.title.slice(0, 24).toLowerCase()
    if (coveredText.includes(keyword)) {
      continue
    }

    packages.push({
      id: `dp-opportunity-${slugify(opportunity.title)}`,
      title: `Pursue: ${opportunity.title}`,
      category: "Growth",
      priority: "medium",
      decisionRequired: `Growth Decision: approve pursuing "${opportunity.title}".`,
      rationale: `The opportunity engine scores this ${opportunity.score}/100 and no strategic adjustment currently covers it.`,
      evidence: [
        `Opportunity score: ${opportunity.score}/100.`,
        ...(opportunity.potentialValue > 0
          ? [
              `Potential value: AUD ${Math.round(opportunity.potentialValue).toLocaleString("en-AU")}.`,
            ]
          : []),
        ...memory.strategicMemory.recurringOpportunities
          .filter((item) => item.occurrences >= 2)
          .slice(0, 1)
          .map(
            (item) =>
              `Related recurring opportunity in memory: "${item.text}" (${item.occurrences}x).`
          ),
      ],
      expectedImpact:
        opportunity.potentialValue > 0
          ? `Up to AUD ${Math.round(opportunity.potentialValue).toLocaleString("en-AU")} in potential value.`
          : "Advances growth momentum on a high-scoring opportunity.",
      confidence: clampConfidence(0.4 + opportunity.score / 200),
      recommendation: opportunity.nextAction,
      status: "Draft",
    })
  }

  const priorityRank: Record<StrategicAdjustmentPriorityLevel, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  }

  return packages.sort(
    (a, b) =>
      priorityRank[a.priority] - priorityRank[b.priority] ||
      b.confidence - a.confidence ||
      a.title.localeCompare(b.title)
  )
}

export function summarizeDecisionPackages(
  packages: DecisionPackage[]
): DecisionPackageSummary {
  const byStatus: DecisionPackageSummary["byStatus"] = {
    Draft: 0,
    "Ready For Boardroom": 0,
    Approved: 0,
    Rejected: 0,
    Implemented: 0,
  }
  const byCategory: Record<string, number> = {}

  for (const item of packages) {
    byStatus[item.status] += 1
    byCategory[item.category] = (byCategory[item.category] ?? 0) + 1
  }

  const averageConfidence =
    packages.length > 0
      ? Math.round(
          (packages.reduce((sum, item) => sum + item.confidence, 0) /
            packages.length) *
            100
        ) / 100
      : 0

  return {
    total: packages.length,
    byStatus,
    byCategory,
    readyForBoardroom: byStatus["Ready For Boardroom"],
    averageConfidence,
  }
}
