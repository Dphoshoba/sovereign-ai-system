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
}

export function articleComposer(
  topic: string,
  title: string,
  paragraphs: NarrativeParagraph[]
): ComposedArticle {
  return {
    title,
    topic,

    introduction:
      `This article explores ${topic} using source-grounded evidence, verified facts and human-reviewed claims.`,

    sections: paragraphs.map((paragraph) => ({
      heading: paragraph.heading,
      body: paragraph.paragraph,
      factCount: paragraph.factCount,
      factsUsed: paragraph.factsUsed,
      requiresHumanReview:
        paragraph.requiresHumanReview,
    })),

    conclusion:
      "AI should be approached with wisdom, careful verification and human responsibility. This draft remains subject to human review before publication.",

    articleStatus:
      "evidence-based narrative draft",

    requiresHumanReview: true,
  }
}
