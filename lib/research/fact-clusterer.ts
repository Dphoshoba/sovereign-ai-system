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

function getClusterName(claim: string) {
  const text = claim.toLowerCase()

  if (
    text.includes("understood as technology") ||
    text.includes("simulate aspects of human learning")
  ) {
    return "Definitions"
  }

  if (
    text.includes("identify objects") ||
    text.includes("human language") ||
    text.includes("learn from new information")
  ) {
    return "Capabilities"
  }

  if (
    text.includes("generative ai") ||
    text.includes("original content")
  ) {
    return "Generative AI"
  }

  if (
    text.includes("machine learning") ||
    text.includes("deep learning")
  ) {
    return "Foundations"
  }

  if (
    text.includes("ethical") ||
    text.includes("responsible use")
  ) {
    return "Ethics"
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
