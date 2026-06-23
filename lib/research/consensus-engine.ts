import type { VerifiedFact } from "./fact-verification-engine"

export type ConsensusGroup = {
  theme: string
  facts: VerifiedFact[]
  sourceCount: number
  sourceQualityScore: number
  consensusStatement: string
}

export type ConsensusResult = {
  totalFacts: number
  verifiedFacts: number
  partiallyVerifiedFacts: number
  unverifiedFacts: number
  consensusScore: number
  sourceQualityScore: number
  consensusGroups: ConsensusGroup[]
  consensusGroupCount: number
  publicationRecommendation:
    | "publish-ready"
    | "review-required"
    | "blocked"
  summary: string
}

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
    theme: "Motivation and Discipline",
    keywords: [
      "motivation",
      "discipline",
      "habit",
      "habits",
      "consistency",
      "goal",
      "goals",
      "mindset",
      "focus",
      "resilience",
      "perseverance",
      "self-control",
      "growth",
    ],
    body: "motivation and discipline are strengthened through consistent habits, clear goals, and repeated practice",
  },
  {
    theme: "Personal Growth",
    keywords: [
      "personal growth",
      "self improvement",
      "self-improvement",
      "leadership",
      "character",
      "decision",
      "decisions",
      "responsibility",
      "learning",
      "reflection",
      "purpose",
    ],
    body: "personal growth develops through intentional decisions, reflection, responsibility, and continued learning",
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

function authorityScoreForUrl(url: string): number {
  const lower = url.toLowerCase()

  if (lower.includes(".gov")) return 100
  if (lower.includes(".edu")) return 95

  if (
    lower.includes("nih.gov") ||
    lower.includes("who.int") ||
    lower.includes("nature.com") ||
    lower.includes("science.org")
  ) {
    return 90
  }

  if (
    lower.includes("reuters.com") ||
    lower.includes("bbc.com") ||
    lower.includes("apnews.com") ||
    lower.includes("theguardian.com")
  ) {
    return 85
  }

  if (
    lower.includes("microsoft.com") ||
    lower.includes("google.com") ||
    lower.includes("openai.com") ||
    lower.includes("adobe.com") ||
    lower.includes("salesforce.com") ||
    lower.includes("ibm.com") ||
    lower.includes("aws.amazon.com")
  ) {
    return 80
  }

  if (
    lower.includes("forbes.com") ||
    lower.includes("hbr.org") ||
    lower.includes("mckinsey.com") ||
    lower.includes("zapier.com") ||
    lower.includes("kit.com")
  ) {
    return 75
  }

  if (
    lower.includes("startus-insights.com") ||
    lower.includes("desilo.studio") ||
    lower.includes("automateed.com") ||
    lower.includes("analyticsinsight.net") ||
    lower.includes("etedge-insights.com") ||
    lower.includes("uxmatters.com") ||
    lower.includes("storyteq.com") ||
    lower.includes("goconsensus.com")
  ) {
    return 65
  }

  if (
    lower.includes("pressmaster.ai") ||
    lower.includes("floodlightnewmarketing.co.uk") ||
    lower.includes("solomonadvising.com")
  ) {
    return 60
  }

  return 50
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

function calculateSourceQualityScore(facts: VerifiedFact[]): number {
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

  const scores = Array.from(urls).map(authorityScoreForUrl)

  if (scores.length === 0) return 0

  return Math.round(
    scores.reduce((sum, score) => sum + score, 0) / scores.length
  )
}

function buildConsensusGroups(facts: VerifiedFact[]): ConsensusGroup[] {
  const byTheme = new Map<string, VerifiedFact[]>()

  for (const fact of facts) {
    const theme = classifyTheme(fact.claim)

    if (!byTheme.has(theme)) {
      byTheme.set(theme, [])
    }

    byTheme.get(theme)?.push(fact)
  }

  return Array.from(byTheme.entries()).map(([theme, themeFacts]) => {
    const sourceCount = countUniqueSources(themeFacts)
    const sourceQualityScore = calculateSourceQualityScore(themeFacts)

    const prefix =
      sourceCount >= 3
        ? "Strong multi-source evidence indicates that"
        : sourceCount === 2
          ? "Multiple sources indicate that"
          : "A source indicates that"

    return {
      theme,
      facts: themeFacts,
      sourceCount,
      sourceQualityScore,
      consensusStatement: `${prefix} ${themeBody(theme)}.`,
    }
  })
}

export function consensusEngine(facts: VerifiedFact[]): ConsensusResult {
  const totalFacts = facts.length

  const verifiedFacts = facts.filter(
    (fact) => fact.verificationStatus === "verified"
  ).length

  const partiallyVerifiedFacts = facts.filter(
    (fact) => fact.verificationStatus === "partially verified"
  ).length

  const unverifiedFacts = facts.filter(
    (fact) => fact.verificationStatus === "unverified"
  ).length

  const consensusGroups = buildConsensusGroups(facts)
  const consensusGroupCount = consensusGroups.length

  const stronglyCorroborated = consensusGroups.filter(
    (group) => group.sourceCount >= 3
  ).length

  const moderatelyCorroborated = consensusGroups.filter(
    (group) => group.sourceCount === 2
  ).length

  const sourceQualityScore =
    consensusGroups.length > 0
      ? Math.round(
          consensusGroups.reduce(
            (sum, group) => sum + group.sourceQualityScore,
            0
          ) / consensusGroups.length
        )
      : 0

  const verificationStrength =
    verifiedFacts * 100 +
    partiallyVerifiedFacts * 75

  const corroborationStrength =
    stronglyCorroborated * 100 +
    moderatelyCorroborated * 75

  const rawConsensusScore =
    totalFacts === 0
      ? 0
      : Math.round(
          verificationStrength * 0.5 +
          corroborationStrength * 0.25 +
          sourceQualityScore * 0.25
        )

  const consensusScore = Math.min(rawConsensusScore, 100)

  const publicationRecommendation =
    consensusScore >= 80 && sourceQualityScore >= 70
      ? "publish-ready"
      : consensusScore >= 50 || totalFacts >= 2
        ? "review-required"
        : "blocked"

 console.log(
  "Consensus Groups:",
  consensusGroups.map(group => ({
    theme: group.theme,
    sourceCount: group.sourceCount,
    facts: group.facts.map(f => f.claim)
  }))
)

  return {
    totalFacts,
    verifiedFacts,
    partiallyVerifiedFacts,
    unverifiedFacts,
    consensusScore,
    sourceQualityScore,
    consensusGroups,
    consensusGroupCount,
    publicationRecommendation,
    summary:
      `Consensus score is ${consensusScore} across ${consensusGroupCount} consensus group(s). ` +
      `Source quality score is ${sourceQualityScore}. ` +
      `Verified: ${verifiedFacts}. ` +
      `Partially verified: ${partiallyVerifiedFacts}. ` +
      `Unverified: ${unverifiedFacts}.`,
  }
}