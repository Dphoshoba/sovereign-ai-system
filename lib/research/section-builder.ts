import type { ExtractedFact } from "./fact-extractor"
import type { FactCluster } from "./fact-clusterer"

export type ArticleSection = {
  heading: string
  facts: ExtractedFact[]
}

export type SectionBuildResult = {
  topic: string
  sections: ArticleSection[]
  sectionCount: number
  totalFacts: number
  buildStatus: string
}

const clusterHeadingMap: Record<string, string> = {
  Definitions: "What Is Artificial Intelligence?",
  Capabilities: "What Can AI Do?",
  "Generative AI": "Understanding Generative AI",
  Foundations: "Machine Learning and Deep Learning Foundations",
  Ethics: "Ethics and Responsible Use",
  "General Background": "Additional Background",
}

const clusterOrder = [
  "Definitions",
  "Capabilities",
  "Generative AI",
  "Foundations",
  "Ethics",
  "General Background",
]

export function sectionBuilder(
  topic: string,
  clusters: FactCluster[]
): SectionBuildResult {
  const clusterByName = new Map(
    clusters.map((cluster) => [cluster.clusterName, cluster])
  )

  const sections: ArticleSection[] = []

  for (const clusterName of clusterOrder) {
    const cluster = clusterByName.get(clusterName)

    if (!cluster || cluster.facts.length === 0) {
      continue
    }

    sections.push({
      heading:
        clusterHeadingMap[clusterName] || clusterName,
      facts: cluster.facts,
    })
  }

  for (const cluster of clusters) {
    if (
      clusterOrder.includes(cluster.clusterName) ||
      cluster.facts.length === 0
    ) {
      continue
    }

    sections.push({
      heading:
        clusterHeadingMap[cluster.clusterName] ||
        cluster.clusterName,
      facts: cluster.facts,
    })
  }

  const totalFacts = sections.reduce(
    (sum, section) => sum + section.facts.length,
    0
  )

  return {
    topic,
    sections,
    sectionCount: sections.length,
    totalFacts,
    buildStatus:
      sections.length > 0
        ? "Article sections built from fact clusters."
        : "No sections built because no clusters were supplied.",
  }
}
