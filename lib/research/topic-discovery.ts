import { normalizeDomainCategory, type DomainCategory } from "../ontology"

export type TopicDiscoveryCandidate = {
  topic: string
  category: DomainCategory
  manualRequest?: boolean
  strategicPriority?: number
  freshnessNeed?: number
  knowledgeGap?: number
  duplicateSimilarity?: number
  trendingSignal?: number
  rationale?: string
}

export type ScoredTopicCandidate = TopicDiscoveryCandidate & {
  scores: {
    knowledgeGap: number
    freshness: number
    categoryDiversity: number
    strategicPriority: number
    manualRequest: number
    trendingCapability: number
    duplicateAvoidance: number
  }
  totalScore: number
  recommendation: "QUEUE" | "WATCH" | "SKIP_DUPLICATE"
}

export type TopicDiscoveryResult = {
  dryRun: true
  liveTrendCollection: false
  candidates: ScoredTopicCandidate[]
  queued: ScoredTopicCandidate[]
  watch: ScoredTopicCandidate[]
  skipped: ScoredTopicCandidate[]
}

export type TopicDiscoveryOptions = {
  recentCategories?: string[]
  duplicateTopics?: string[]
}

const DEFAULT_CANDIDATES: TopicDiscoveryCandidate[] = [
  {
    topic: "AI agents for creator research workflows",
    category: "ai-tools",
    strategicPriority: 92,
    freshnessNeed: 86,
    knowledgeGap: 82,
    manualRequest: true,
    trendingSignal: 60,
    rationale: "Strong fit for EV-KOS research automation and creator outcomes.",
  },
  {
    topic: "David and Goliath courage themes for modern leadership",
    category: "bible-stories",
    strategicPriority: 74,
    freshnessNeed: 42,
    knowledgeGap: 68,
    trendingSignal: 25,
    rationale: "Good ontology diversity and strong theme extraction use case.",
  },
  {
    topic: "Health misinformation review workflows",
    category: "health",
    strategicPriority: 78,
    freshnessNeed: 82,
    knowledgeGap: 75,
    trendingSignal: 50,
    rationale: "High governance value; requires careful verification.",
  },
  {
    topic: "Reusable business playbooks for AI-assisted operators",
    category: "business",
    strategicPriority: 84,
    freshnessNeed: 64,
    knowledgeGap: 72,
    trendingSignal: 45,
    rationale: "Directly supports future operator dashboard use cases.",
  },
]

export function discoverResearchTopics(
  candidates: TopicDiscoveryCandidate[] = DEFAULT_CANDIDATES,
  options: TopicDiscoveryOptions = {}
): TopicDiscoveryResult {
  const scored = candidates
    .map((candidate) => scoreTopicCandidate(candidate, options))
    .sort((a, b) => b.totalScore - a.totalScore)

  return {
    dryRun: true,
    liveTrendCollection: false,
    candidates: scored,
    queued: scored.filter((candidate) => candidate.recommendation === "QUEUE"),
    watch: scored.filter((candidate) => candidate.recommendation === "WATCH"),
    skipped: scored.filter(
      (candidate) => candidate.recommendation === "SKIP_DUPLICATE"
    ),
  }
}

export function scoreTopicCandidate(
  candidate: TopicDiscoveryCandidate,
  options: TopicDiscoveryOptions = {}
): ScoredTopicCandidate {
  const category = normalizeDomainCategory(candidate.category)
  const duplicateSimilarity = candidate.duplicateSimilarity ?? estimateDuplicate(
    candidate.topic,
    options.duplicateTopics ?? []
  )
  const duplicateAvoidance = clamp(100 - duplicateSimilarity, 0, 100)
  const categoryDiversity = options.recentCategories?.includes(category) ? 45 : 85
  const scores = {
    knowledgeGap: clamp(candidate.knowledgeGap ?? 60, 0, 100),
    freshness: clamp(candidate.freshnessNeed ?? 50, 0, 100),
    categoryDiversity,
    strategicPriority: clamp(candidate.strategicPriority ?? 50, 0, 100),
    manualRequest: candidate.manualRequest ? 100 : 35,
    trendingCapability: clamp(candidate.trendingSignal ?? 0, 0, 100),
    duplicateAvoidance,
  }
  const totalScore = Math.round(
    scores.knowledgeGap * 0.2 +
      scores.freshness * 0.15 +
      scores.categoryDiversity * 0.12 +
      scores.strategicPriority * 0.22 +
      scores.manualRequest * 0.13 +
      scores.trendingCapability * 0.08 +
      scores.duplicateAvoidance * 0.1
  )
  const recommendation =
    duplicateSimilarity >= 82
      ? "SKIP_DUPLICATE"
      : totalScore >= 72
        ? "QUEUE"
        : "WATCH"

  return {
    ...candidate,
    category,
    duplicateSimilarity,
    scores,
    totalScore,
    recommendation,
  }
}

function estimateDuplicate(topic: string, duplicateTopics: string[]) {
  const normalized = normalizeText(topic)
  let max = 0

  for (const duplicate of duplicateTopics) {
    const left = new Set(normalized.split(" ").filter(Boolean))
    const right = new Set(normalizeText(duplicate).split(" ").filter(Boolean))
    const overlap = [...left].filter((token) => right.has(token)).length
    const union = new Set([...left, ...right]).size

    max = Math.max(max, union === 0 ? 0 : Math.round((overlap / union) * 100))
  }

  return max
}

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
