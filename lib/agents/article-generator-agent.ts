type ArticleGeneratorInput = {
  title: string
  niche: string
  outline?: {
    introduction: {
      heading: string
      purpose: string
      verificationNote: string
    }
    sections: Array<{
      heading: string
      purpose: string
      verificationRequired: boolean
      linkedEvidenceIds?: string[]
      linkedFactClaims?: string[]
    }>
    faq: Array<{
      question: string
      answerDraft: string
      verificationRequired: boolean
    }>
    conclusion: {
      heading: string
      purpose: string
      verificationNote: string
    }
  }
}

export function articleGeneratorAgent(
  input: ArticleGeneratorInput
) {
  const defaultOutline = {
    introduction: {
      heading: "Introduction",
      purpose:
        "Introduce why AI and faith should be discussed with wisdom, discernment and care.",
      verificationNote:
        "Add verified context about current AI adoption before publication.",
    },

    sections: [
      {
        heading: "What Is Artificial Intelligence?",
        purpose:
          "Explain AI, generative AI, automation and machine learning in plain language.",
        verificationRequired: true,
      },
      {
        heading: "Opportunities for Christians",
        purpose:
          "Explore responsible uses of AI for learning, administration, accessibility, content support and ministry workflows.",
        verificationRequired: true,
      },
      {
        heading: "Risks and Challenges",
        purpose:
          "Address misinformation, hallucinations, privacy, deepfakes, overdependence and ethical concerns.",
        verificationRequired: true,
      },
      {
        heading: "Biblical Principles for Using AI Wisely",
        purpose:
          "Frame AI use through wisdom, truthfulness, stewardship, human dignity and discernment.",
        verificationRequired: true,
      },
      {
        heading: "Practical Guidelines",
        purpose:
          "Give readers clear steps for verifying information, protecting privacy and keeping human oversight.",
        verificationRequired: true,
      },
      {
        heading: "Future Outlook",
        purpose:
          "Discuss possible future implications carefully without presenting predictions as facts.",
        verificationRequired: true,
      },
    ],

    faq: [
      {
        question: "Can Christians use AI?",
        answerDraft:
          "Yes, Christians can use AI as a tool, but it should be used with wisdom, truthfulness, accountability and human oversight.",
        verificationRequired: true,
      },
      {
        question: "Is AI sinful?",
        answerDraft:
          "AI itself is a tool. The moral question depends on how it is designed, used and governed.",
        verificationRequired: true,
      },
      {
        question: "Can AI replace ministry?",
        answerDraft:
          "AI may support administrative and creative tasks, but it cannot replace human pastoral care, spiritual discernment or genuine community.",
        verificationRequired: true,
      },
    ],

    conclusion: {
      heading: "Conclusion",
      purpose:
        "Conclude that AI should not be approached with fear or blind trust, but with wisdom, discernment and truth.",
      verificationNote:
        "Final article must include source-supported claims before publication.",
    },
  }

  const outline = input.outline || defaultOutline

  return {
    autonomousArticleGeneratorAgent: true,
    title: input.title,
    niche: input.niche,
    articleStatus: input.outline
      ? "outline-grounded skeleton"
      : "source-grounded skeleton",

    introduction: outline.introduction,

    sections: outline.sections.map((section) => ({
      heading: section.heading,
      purpose: section.purpose,
      verificationRequired: section.verificationRequired,
      linkedEvidenceIds: section.linkedEvidenceIds || [],
      linkedFactClaims: section.linkedFactClaims || [],
    })),

    faq: outline.faq,

    conclusion: outline.conclusion,

    antiHallucinationPolicy: [
      "Do not invent statistics.",
      "Do not invent quotes.",
      "Do not invent studies.",
      "Do not invent companies.",
      "Do not publish unsupported factual claims.",
      "Use verified sources before final publication.",
    ],

    nextStage: "Ready for MDX writer upgrade.",
  }
}
