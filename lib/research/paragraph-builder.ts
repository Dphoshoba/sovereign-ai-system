import type { ArticleSection } from "./section-builder"

export type ArticleParagraph = {
  heading: string
  paragraph: string
  factsUsed: string[]
  factCount: number
  requiresHumanReview: boolean
}

export type ParagraphBuilderResult = {
  paragraphs: ArticleParagraph[]
  paragraphCount: number
}

function buildParagraph(heading: string, facts: string[]) {
  if (facts.length === 0) {
    return `This section requires verified facts before publication.`
  }

  if (facts.length === 1) {
    return facts[0]
  }

  return facts.join(" ")
}

export function paragraphBuilder(
  sections: ArticleSection[]
): ParagraphBuilderResult {
  const paragraphs = sections.map((section) => ({
    heading: section.heading,
    paragraph: buildParagraph(
      section.heading,
      section.facts
    ),
    factsUsed: section.facts,
    factCount: section.factCount,
    requiresHumanReview: true,
  }))

  return {
    paragraphs,
    paragraphCount: paragraphs.length,
  }
}
