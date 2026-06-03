import type { VerifiedFact } from "./fact-verification-engine"

export type ConsensusGroup = {
  theme: string
  facts: VerifiedFact[]
  sourceCount: number
  consensusStatement: string
}

export type ConsensusResult = {
  totalFacts: number
  verifiedFacts: number
  partiallyVerifiedFacts: number
  unverifiedFacts: number
  consensusScore: number
  consensusGroups: ConsensusGroup[]
  consensusGroupCount: number
  publicationRecommendation:
    | "publish-ready"
    | "review-required"
    | "blocked"
  summary: string
}

// Semantic themes used to group corroborating facts. Order matters: a fact is
// assigned to the first theme whose keywords it matches.
const THEMES: { theme: string; keywords: string[]; body: string }[] = [
  {
    theme: "Automation",
    keywords: [
      "automat",
      "workflow",
      "pipeline",
      "integrat",
      "no-code",
      "repetitive",
      "streamline",
    ],
    body: "AI automation is streamlining repetitive work for creators",
  },
  {
    theme: "Content Production",
    keywords: [
      "content",
      "produc",
      "create",
      "creation",
      "writing",
      "write",
      "video",
      "article",
      "script",
      "generat",
    ],
    body: "AI is improving content production efficiency",
  },
  {
    theme: "Content Distribution",
    keywords: [
      "distribut",
      "publish",
      "channel",
      "reach",
      "social",
      "platform",
      "syndicat",
    ],
    body: "AI is reshaping how content is distributed and reaches people",
  },
  {
    theme: "Audience Growth",
    keywords: [
      "audience",
      "growth",
      "grow",
      "subscriber",
      "follower",
      "engagement",
      "engage",
      "community",
      "retention",
    ],
    body: "AI-supported strategies are helping creators grow their audience",
  },
  {
    theme: "Revenue Optimization",
    keywords: [
      "revenue",
      "income",
      "monetiz",
      "monetis",
      "profit",
      "sales",
      "pricing",
      "sponsor",
      "earnings",
    ],
    body: "AI is opening new ways to optimize revenue and monetization",
  },
  {
    theme: "Analytics",
    keywords: [
      "analytic",
      "data",
      "metric",
      "measure",
      "insight",
      "performance",
      "track",
      "report",
      "benchmark",
    ],
    body: "AI-driven analytics are improving performance insights",
  },
  {
    theme: "Creative Workflows",
    keywords: [
      "creative",
      "idea",
      "ideation",
      "design",
      "brainstorm",
      "editing",
      "draft",
      "concept",
    ],
    body: "AI is enhancing creative workflows and ideation",
  },
  {
    theme: "Ethics and Responsibility",
    keywords: [
      "ethic",
      "responsib",
      "moral",
      "transparency",
      "trust",
      "bias",
      "privacy",
      "safety",
      "accountab",
      "human",
    ],
    body: "responsible, ethical use of AI remains an important consideration",
  },
]

const GENERAL_THEME = "General Findings"

function classifyTheme(claim: string): string {
  const text = claim.toLowerCase()

  for (const { theme, keywords } of THEMES) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return theme
    }
  }

  return GENERAL_THEME
}

function themeBody(theme: string): string {
  const match = THEMES.find((entry) => entry.theme === theme)
  return match
    ? match.body
    : "the available evidence supports relevant findings on this topic"
}

function countUniqueSources(facts: VerifiedFact[]): number {
  const urls = new Set<string>()

  for (const fact of facts) {
    if (fact.supportingSources.length > 0) {
      for (const source of fact.supportingSources) {
        if (source.sourceUrl) urls.add(source.sourceUrl)
      }
    } else if (fact.sourceUrl) {
      urls.add(fact.sourceUrl)
    }
  }

  return urls.size
}

function buildConsensusGroups(
  facts: VerifiedFact[]
): ConsensusGroup[] {
  const byTheme = new Map<string, VerifiedFact[]>()

  for (const fact of facts) {
    const theme = classifyTheme(fact.claim)
    if (!byTheme.has(theme)) byTheme.set(theme, [])
    byTheme.get(theme)?.push(fact)
  }

  return Array.from(byTheme.entries()).map(([theme, themeFacts]) => {
    const sourceCount = countUniqueSources(themeFacts)
    const prefix =
      sourceCount >= 2
        ? "Multiple sources indicate that"
        : "A source indicates that"

    return {
      theme,
      facts: themeFacts,
      sourceCount,
      consensusStatement: `${prefix} ${themeBody(theme)}.`,
    }
  })
}

export function consensusEngine(
  facts: VerifiedFact[]
): ConsensusResult {
  const totalFacts = facts.length

  const verifiedFacts = facts.filter(
    (fact) => fact.verificationStatus === "verified"
  ).length

  const partiallyVerifiedFacts = facts.filter(
    (fact) =>
      fact.verificationStatus === "partially verified"
  ).length

  const unverifiedFacts = facts.filter(
    (fact) => fact.verificationStatus === "unverified"
  ).length

  // Build semantic consensus groups before scoring.
  const consensusGroups = buildConsensusGroups(facts)
  const consensusGroupCount = consensusGroups.length

  // Score from the consensus groups: a group corroborated by more independent
  // sources contributes a higher weight.
  const stronglyCorroborated = consensusGroups.filter(
    (group) => group.sourceCount >= 3
  ).length

  const moderatelyCorroborated = consensusGroups.filter(
    (group) => group.sourceCount === 2
  ).length

  const consensusScore =
    totalFacts === 0
      ? 0
      : Math.round(
          (
            verifiedFacts * 100 +
            partiallyVerifiedFacts * 70 +
            stronglyCorroborated * 100 +
            moderatelyCorroborated * 60
          ) /
          (
            totalFacts +
            Math.max(consensusGroupCount, 1)
          )
        )

  const publicationRecommendation =
    consensusScore >= 80
      ? "publish-ready"
      : consensusScore >= 50 || totalFacts >= 2
        ? "review-required"
        : "blocked"

  return {
    totalFacts,
    verifiedFacts,
    partiallyVerifiedFacts,
    unverifiedFacts,
    consensusScore,
    consensusGroups,
    consensusGroupCount,
    publicationRecommendation,
    summary:
      `Consensus score is ${consensusScore} across ${consensusGroupCount} consensus group(s). ` +
      `Verified: ${verifiedFacts}. ` +
      `Partially verified: ${partiallyVerifiedFacts}. ` +
      `Unverified: ${unverifiedFacts}.`,
  }
}
