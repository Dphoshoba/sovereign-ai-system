import type { VerifiedFact } from "./fact-verification-engine"

export type ConsensusGroup = {
  theme: string
  facts: VerifiedFact[]
  sourceCount: number
  sourceQualityScore: number
  consensusStatement: string
}

export const PUBLISH_READY_CONSENSUS_SCORE = 80
export const PUBLISH_READY_SOURCE_QUALITY_SCORE = 70
export const PUBLISH_READY_RECOMMENDATION = "publish-ready" as const

export type ConsensusResult = {
  totalFacts: number
  verifiedFacts: number
  partiallyVerifiedFacts: number
  unverifiedFacts: number
  consensusScore: number
  sourceQualityScore: number
  consensusGroups: ConsensusGroup[]
  zeroSourceGroups: ConsensusGroup[]
  consensusGroupCount: number
  publicationRecommendation:
    | "publish-ready"
    | "review-required"
    | "blocked"
  summary: string
}

const THEMES: { theme: string; keywords: string[]; body: string }[] = [
  {
    theme: "Faith and Courage",
    keywords: [
      "faith",
      "trust in god",
      "trust",
      "courage",
      "fear",
      "bold",
      "confidence",
      "lord",
      "god",
    ],
    body: "The evidence highlights faith in God and courageous action.",
  },
  {
    theme: "Conflict",
    keywords: [
      "battle",
      "fight",
      "war",
      "army",
      "philistine",
      "goliath",
      "enemy",
      "military",
      "conflict",
      "confront",
    ],
    body: "The evidence describes conflict and confrontation between opposing forces.",
  },
  {
    theme: "Leadership",
    keywords: [
      "saul",
      "king",
      "leader",
      "leadership",
      "shepherd",
      "david",
      "ability",
    ],
    body: "The evidence highlights leadership, calling, and responsibility.",
  },
  {
    theme: "Calling and Obedience",
    keywords: [
      "calling",
      "obedience",
      "obey",
      "volunteer",
      "serve",
      "servant",
      "mission",
      "willingness",
    ],
    body: "The evidence highlights willingness to obey and respond to God's calling.",
  },
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

// Prefixes kept as stems. Ordinary keywords use word boundaries.
const EXPLICIT_THEME_STEMS = new Set([
  "automat",
  "integrat",
  "produc",
  "generat",
  "distribut",
  "syndicat",
  "monetiz",
  "monetis",
  "analytic",
  "ethic",
  "responsib",
  "accountab",
])

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function keywordMatches(text: string, keyword: string): boolean {
  if (EXPLICIT_THEME_STEMS.has(keyword)) {
    return text.includes(keyword)
  }
  return new RegExp(`\\b${escapeRegExp(keyword)}\\b`, "i").test(text)
}

export function classifyConsensusTheme(claim: string): string {
  const text = claim.toLowerCase()
  let bestTheme = GENERAL_THEME
  let bestScore = 0

  for (const { theme, keywords } of THEMES) {
    const score = keywords.reduce((total, keyword) => {
      if (!keywordMatches(text, keyword)) {
        return total
      }

      return total + (keyword.includes(" ") ? 2 : 1)
    }, 0)

    if (score > bestScore) {
      bestTheme = theme
      bestScore = score
    }
  }

  return bestTheme
}

function classifyTheme(claim: string): string {
  return classifyConsensusTheme(claim)
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
function acceptedSourceUrls(facts: VerifiedFact[]): string[] {
  const urls = new Set<string>()

  for (const fact of facts) {
    for (const source of fact.supportingSources) {
      if (typeof source.sourceUrl === "string" && source.sourceUrl.trim()) {
        urls.add(source.sourceUrl)
      }
    }
  }

  return Array.from(urls)
}

function countUniqueSources(facts: VerifiedFact[]): number {
  return acceptedSourceUrls(facts).length
}

function calculateSourceQualityScore(facts: VerifiedFact[]): number {
  const scores = acceptedSourceUrls(facts).map(authorityScoreForUrl)

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
          : sourceCount === 1
            ? "A source indicates that"
            : "No accepted source supports this group yet, which concerns"

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
  const zeroSourceGroups = consensusGroups.filter((group) => group.sourceCount === 0)
  const sourcedGroups = consensusGroups.filter((group) => group.sourceCount > 0)
  const consensusGroupCount = consensusGroups.length

  const stronglyCorroborated = consensusGroups.filter(
    (group) => group.sourceCount >= 3
  ).length

  const moderatelyCorroborated = consensusGroups.filter(
    (group) => group.sourceCount === 2
  ).length

  const sourceQualityScore =
    sourcedGroups.length > 0
      ? Math.round(
          sourcedGroups.reduce(
            (sum, group) => sum + group.sourceQualityScore,
            0
          ) / sourcedGroups.length
        )
      : 0

  const verificationStrength =
    totalFacts === 0
      ? 0
      : (verifiedFacts * 100 + partiallyVerifiedFacts * 75) / totalFacts

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

  const consensusScore = Math.max(0, Math.min(rawConsensusScore, 100))

  const publicationRecommendation =
    consensusScore >= PUBLISH_READY_CONSENSUS_SCORE &&
    sourceQualityScore >= PUBLISH_READY_SOURCE_QUALITY_SCORE
      ? PUBLISH_READY_RECOMMENDATION
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
    zeroSourceGroups,
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
