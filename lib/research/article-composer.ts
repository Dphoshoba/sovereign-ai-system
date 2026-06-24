import type { NarrativeParagraph } from "./narrative-paragraph-builder"
import type { VerifiedFact } from "./fact-verification-engine"

export type ComposedArticleSection = {
  heading: string
  body: string
  factCount: number
  factsUsed: string[]
  requiresHumanReview: boolean
}

export type ComposedArticle = {
  title: string
  topic: string
  introduction: string
  sections: ComposedArticleSection[]
  conclusion: string
  articleStatus: string
  requiresHumanReview: boolean
  evidenceSummary: {
    sectionCount: number
    totalFacts: number
    verifiedFacts: number
    partiallyVerifiedFacts: number
    requiresHumanReview: boolean
  }
}

function toTitleCase(value: string): string {
  return value
    .replace(/\.$/, "")
    .split(/\s+/)
    .map((word) =>
      word.length <= 3 && word.toLowerCase() !== "ai"
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ")
    .replace(/\bAi\b/g, "AI")
}

function buildFactSection(fact: VerifiedFact): ComposedArticleSection {
  const heading = toTitleCase(fact.claim)

  const verificationText =
    fact.verificationStatus === "verified"
      ? "This point is verified by the research pipeline."
      : "This point is partially verified and should be reviewed carefully before publication."

  return {
    heading,
    body:
      `${fact.claim}\n\n` +
      `${verificationText} In practical terms, this should be treated as an evidence-led section, not a broad claim. The article should explain what this means, how it applies, where creators should be careful, and why human judgment still matters.\n\n` +
      `Supporting source count: ${fact.verificationCount}. Verification score: ${fact.verificationScore}.`,
    factCount: 1,
    factsUsed: [fact.claim],
    requiresHumanReview: true,
  }
}

function buildParagraphSection(
  paragraph: NarrativeParagraph
): ComposedArticleSection {
  return {
    heading: paragraph.heading,
    body: paragraph.paragraph,
    factCount: paragraph.factCount,
    factsUsed: paragraph.factsUsed,
    requiresHumanReview: paragraph.requiresHumanReview,
  }
}

export function articleComposer(
  topic: string,
  title: string,
  paragraphs: NarrativeParagraph[] = [],
  verifiedFacts: VerifiedFact[] = []
): ComposedArticle {
  const publishableFacts = verifiedFacts.filter(
    (fact) =>
      fact.verificationStatus === "verified" ||
      fact.verificationStatus === "partially verified"
  )

  const factSections = publishableFacts.map(buildFactSection)
  const paragraphSections = paragraphs.map(buildParagraphSection)

  const sections =
    factSections.length > 0 ? factSections : paragraphSections

  const totalFacts = sections.reduce(
    (sum, section) => sum + section.factCount,
    0
  )

  const verifiedFactCount = publishableFacts.filter(
    (fact) => fact.verificationStatus === "verified"
  ).length

  const partiallyVerifiedFactCount = publishableFacts.filter(
    (fact) => fact.verificationStatus === "partially verified"
  ).length

  return {
    title,
    topic,

    introduction:
      `This article explores ${topic} using evidence gathered from external sources, structured fact extraction, verification checks, and human-reviewed synthesis. The article is organized around the strongest verified and partially verified facts available from the research pipeline.`,

    sections,

    conclusion:
      `The evidence suggests meaningful developments in ${topic}, but responsible publishing still requires context, careful verification, and human oversight. Every section should remain subject to editorial review before publication.`,

    articleStatus: "evidence-led article draft",

    requiresHumanReview: true,

    evidenceSummary: {
      sectionCount: sections.length,
      totalFacts,
      verifiedFacts: verifiedFactCount,
      partiallyVerifiedFacts: partiallyVerifiedFactCount,
      requiresHumanReview: true,
    },
  }
}