import type { ArticleSection } from "./section-builder"

export type NarrativeParagraph = {
  heading: string
  paragraph: string
  factsUsed: string[]
  factCount: number
  synthesisRule: string
  requiresHumanReview: boolean
}

export type NarrativeParagraphBuilderResult = {
  paragraphs: NarrativeParagraph[]
  paragraphCount: number
  builderStatus: string
}

function buildNarrativeParagraph(
  heading: string,
  facts: string[]
): string {
  if (facts.length === 0) {
    return "This section requires verified facts before publication."
  }

  if (facts.length === 1) {
    return facts[0]
  }

  return facts.join(" ")
}

export function narrativeParagraphBuilder(
  sections: ArticleSection[]
): NarrativeParagraphBuilderResult {
  const paragraphs = sections.map((section) => ({
    heading: section.heading,
    paragraph: buildNarrativeParagraph(
      section.heading,
      section.facts
    ),
    factsUsed: section.facts,
    factCount: section.factCount,
    synthesisRule:
      "Only use information already present in the facts list. Do not introduce new claims.",
    requiresHumanReview: true,
  }))

  return {
    paragraphs,
    paragraphCount: paragraphs.length,
    builderStatus:
      "Narrative paragraphs generated from verified section facts.",
  }
}
