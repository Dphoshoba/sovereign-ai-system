import type { NarrativeParagraph } from "./narrative-paragraph-builder"

export type ComposedArticle = {
  title: string
  topic: string
  introduction: string
  sections: {
    heading: string
    body: string
    factCount: number
    factsUsed: string[]
    requiresHumanReview: boolean
  }[]
  conclusion: string
  articleStatus: string
  requiresHumanReview: boolean
  evidenceSummary: {
    sectionCount: number
    totalFacts: number
    requiresHumanReview: boolean
  }
}

export function articleComposer(
  topic: string,
  title: string,
  paragraphs: NarrativeParagraph[]
): ComposedArticle {
  const totalFacts = paragraphs.reduce(
    (sum, p) => sum + p.factCount,
    0
  )

  return {
    title,
    topic,

    introduction:
      `This article explores ${topic} using evidence gathered from external sources, structured fact extraction, verification checks, and human-reviewed synthesis. All conclusions remain subject to editorial review before publication.`,

    sections: paragraphs.map((paragraph) => ({
      heading: paragraph.heading,
      body: paragraph.paragraph,
      factCount: paragraph.factCount,
      factsUsed: paragraph.factsUsed,
      requiresHumanReview:
        paragraph.requiresHumanReview,
    })),

    conclusion:
      `The evidence suggests meaningful developments in ${topic}, but responsible publishing requires ongoing verification, context, and human oversight. This article remains in review status until approved by an editor.`,

    articleStatus:
      "evidence-based narrative draft",

    requiresHumanReview: true,

    evidenceSummary: {
      sectionCount: paragraphs.length,
      totalFacts,
      requiresHumanReview: true,
    },
  }
}
