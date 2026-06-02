import type { ExtractedFact } from "./fact-extractor"

export type FactCluster = {
  clusterName: string
  facts: ExtractedFact[]
  factCount: number
}

export type FactClusterResult = {
  topic: string
  clusters: FactCluster[]
  clusterCount: number
  totalFacts: number
  clusteringStatus: string
}

// Broad, topic-agnostic clusters. Keyword sets are intentionally generic so
// they work across AI, health, history, Bible/faith, motivation, space,
// creator-economy, and similar topics. Order matters: the first cluster whose
// keywords match wins, so more distinctive themes are checked first.
const CLUSTER_KEYWORDS: { name: string; keywords: string[] }[] = [
  {
    name: "Risks and Challenges",
    keywords: [
      "risk",
      "challenge",
      "danger",
      "threat",
      "harm",
      "concern",
      "problem",
      "limitation",
      "downside",
      "caution",
      "warning",
      "barrier",
      "obstacle",
      "side effect",
      "mistake",
      "fail",
      "decline",
      "loss",
      "negative",
      "controversy",
    ],
  },
  {
    name: "Human Responsibility",
    keywords: [
      "ethic",
      "responsib",
      "moral",
      "wisdom",
      "faith",
      "god",
      "bible",
      "scripture",
      "spiritual",
      "integrity",
      "accountab",
      "stewardship",
      "trust",
      "conscience",
      "character",
      "discipline",
      "purpose",
      "meaning",
      "values",
      "care",
    ],
  },
  {
    name: "Business and Revenue",
    keywords: [
      "business",
      "revenue",
      "money",
      "profit",
      "income",
      "monetiz",
      "market",
      "customer",
      "client",
      "sales",
      "pricing",
      "cost",
      "roi",
      "brand",
      "audience",
      "subscriber",
      "sponsor",
      "economy",
      "investment",
      "growth strategy",
    ],
  },
  {
    name: "Tools and Workflows",
    keywords: [
      "tool",
      "workflow",
      "software",
      "app",
      "platform",
      "automation",
      "process",
      "system",
      "framework",
      "method",
      "technique",
      "strategy",
      "step",
      "pipeline",
      "integrat",
      "build",
      "setup",
      "configure",
      "practice",
      "routine",
    ],
  },
  {
    name: "Benefits and Opportunities",
    keywords: [
      "benefit",
      "opportunit",
      "advantage",
      "improve",
      "gain",
      "positive",
      "potential",
      "boost",
      "enhance",
      "value",
      "help",
      "effective",
      "success",
      "breakthrough",
      "useful",
      "save time",
      "efficien",
      "productiv",
      "healthy",
      "strength",
    ],
  },
  {
    name: "Key Trends",
    keywords: [
      "trend",
      "future",
      "emerging",
      "growing",
      "shift",
      "rise",
      "increasingly",
      "popular",
      "adoption",
      "latest",
      "evolving",
      "prediction",
      "forecast",
      "momentum",
      "history",
      "historical",
      "origin",
      "discover",
      "recent",
      "new ",
    ],
  },
]

function getClusterName(claim: string) {
  const text = claim.toLowerCase()

  for (const cluster of CLUSTER_KEYWORDS) {
    if (cluster.keywords.some((keyword) => text.includes(keyword))) {
      return cluster.name
    }
  }

  return "General Background"
}

export function factClusterer(
  topic: string,
  facts: ExtractedFact[]
): FactClusterResult {
  const clusterMap = new Map<string, ExtractedFact[]>()

  for (const fact of facts) {
    const clusterName = getClusterName(fact.claim)

    if (!clusterMap.has(clusterName)) {
      clusterMap.set(clusterName, [])
    }

    clusterMap.get(clusterName)?.push(fact)
  }

  const clusters: FactCluster[] = Array.from(
    clusterMap.entries()
  ).map(([clusterName, clusterFacts]) => ({
    clusterName,
    facts: clusterFacts,
    factCount: clusterFacts.length,
  }))

  return {
    topic,
    clusters,
    clusterCount: clusters.length,
    totalFacts: facts.length,
    clusteringStatus:
      clusters.length > 0
        ? "Facts clustered successfully."
        : "No facts available for clustering.",
  }
}
