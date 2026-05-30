import type { FactCluster } from "./fact-clusterer"

export type ArticleSection = {
  heading: string
  facts: string[]
  factCount: number
}

export type SectionBuilderResult = {
  sections: ArticleSection[]
  sectionCount: number
}

function mapHeading(clusterName: string): string {
  switch (clusterName) {
    case "Definitions":
      return "What Is Artificial Intelligence?"

    case "Capabilities":
      return "What Can AI Do?"

    case "Generative AI":
      return "Understanding Generative AI"

    case "Foundations":
      return "Machine Learning and Deep Learning"

    case "Ethics":
      return "Ethics and Responsible AI"

    default:
      return clusterName
  }
}

export function sectionBuilder(
  clusters: FactCluster[]
): SectionBuilderResult {
  const sections = clusters.map((cluster) => ({
    heading: mapHeading(cluster.clusterName),

    facts: cluster.facts.map(
      (fact) => fact.claim
    ),

    factCount: cluster.factCount,
  }))

  return {
    sections,
    sectionCount: sections.length,
  }
}
