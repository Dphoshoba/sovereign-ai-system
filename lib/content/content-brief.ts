import type {
  ApprovedResearchMissionInput,
  ContentCitation,
} from "./content-campaign"

export type MasterContentBrief = {
  id: string
  parentMission: string
  topic: string
  audience: string
  purpose: string
  keyFindings: string[]
  verifiedClaims: string[]
  citations: ContentCitation[]
  tone: string
  cta: string
  keywords: string[]
  risks: string[]
  reviewStatus: "needs-review"
  approvalStatus: "not-requested"
  readiness: number
  publicationState: "draft-only"
  version: number
}

export function buildMasterContentBrief(
  mission: ApprovedResearchMissionInput
): MasterContentBrief {
  return {
    id: `master-brief:${slugify(mission.topic)}`,
    parentMission: mission.id,
    topic: mission.topic,
    audience: mission.audience,
    purpose: mission.purpose,
    keyFindings: mission.keyFindings,
    verifiedClaims: mission.verifiedClaims,
    citations: mission.citations,
    tone:
      "Clear, grounded, useful, evidence-led, and careful where claims need human review.",
    cta: "Invite the audience into a practical next step without hype or pressure.",
    keywords: buildKeywords(mission),
    risks: mission.risks,
    reviewStatus: "needs-review",
    approvalStatus: "not-requested",
    readiness: calculateBriefReadiness(mission),
    publicationState: "draft-only",
    version: 1,
  }
}

export function summarizeMasterBrief(brief: MasterContentBrief) {
  return {
    id: brief.id,
    topic: brief.topic,
    keyFindings: brief.keyFindings.length,
    verifiedClaims: brief.verifiedClaims.length,
    citations: brief.citations.length,
    risks: brief.risks.length,
    readiness: brief.readiness,
    publicationState: brief.publicationState,
    approvalStatus: brief.approvalStatus,
  }
}

function calculateBriefReadiness(mission: ApprovedResearchMissionInput) {
  const evidenceScore = Math.min(mission.evidenceIds.length * 12, 36)
  const claimsScore = Math.min(mission.verifiedClaims.length * 10, 30)
  const citationScore = Math.min(mission.citations.length * 8, 24)
  const riskPenalty = Math.min(mission.risks.length * 3, 12)

  return Math.max(0, Math.min(100, 20 + evidenceScore + claimsScore + citationScore - riskPenalty))
}

function buildKeywords(mission: ApprovedResearchMissionInput) {
  const words = [
    ...mission.topic.split(/\s+/),
    mission.category,
    "research",
    "creator",
    "workflow",
    "governance",
  ]

  return [...new Set(words.map((word) => word.toLowerCase().replace(/[^a-z0-9-]/g, "")).filter(Boolean))].slice(0, 12)
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}
