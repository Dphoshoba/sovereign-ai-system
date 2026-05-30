import type { ArticleParagraph } from "./paragraph-builder"

export type ComposedArticle = {
  title: string
  topic: string
  introduction: string
  sections: {
    heading: string
    body: string
    factCount: number
    requiresHumanReview: boolean
  }[]
  conclusion: string
  articleStatus: string
  requiresHumanReview: boolean
}

export function articleComposer(
  topic: string,
  title: string,
  paragraphs: ArticleParagraph[]
): ComposedArticle {
  return {
    title,
    topic,

    introduction:
      `This article explores ${topic} using source-grounded evidence and human-reviewed claims.`,

    sections: paragraphs.map((paragraph) => ({
      heading: paragraph.heading,
      body: paragraph.paragraph,
      factCount: paragraph.factCount,
      requiresHumanReview:
        paragraph.requiresHumanReview,
    })),

    conclusion:
      "AI should be approached with wisdom, careful verification and human responsibility. This draft remains subject to human review before publication.",

    articleStatus:
      "evidence-based draft",

    requiresHumanReview: true,
  }
}
