import type { ExtractedFact } from "./fact-extractor"

export type OutlineSection = {
  heading: string
  purpose: string
  linkedEvidenceIds: string[]
  linkedFactClaims: string[]
  verificationRequired: boolean
}

export type OutlineFaqItem = {
  question: string
  answerDraft: string
  linkedEvidenceIds: string[]
  verificationRequired: boolean
}

export type OutlineResult = {
  topic: string
  introduction: {
    heading: string
    purpose: string
    linkedEvidenceIds: string[]
    verificationNote: string
  }
  sections: OutlineSection[]
  faq: OutlineFaqItem[]
  conclusion: {
    heading: string
    purpose: string
    linkedEvidenceIds: string[]
    verificationNote: string
  }
  outlineStatus: string
}

function sectionForFacts(
  heading: string,
  purpose: string,
  facts: ExtractedFact[],
  match: (fact: ExtractedFact) => boolean
): OutlineSection {
  const linked = facts.filter(match)

  return {
    heading,
    purpose,
    linkedEvidenceIds: linked.map((fact) => fact.evidenceId),
    linkedFactClaims: linked.map((fact) => fact.claim),
    verificationRequired: true,
  }
}

export function outlineBuilder(
  topic: string,
  facts: ExtractedFact[]
): OutlineResult {
  const allEvidenceIds = facts.map((fact) => fact.evidenceId)

  const sections: OutlineSection[] = [
    sectionForFacts(
      "What Is Artificial Intelligence?",
      facts.some((fact) =>
        fact.claim.toLowerCase().includes("artificial intelligence")
      )
        ? "Explain AI using only registered evidence and source-linked background."
        : "Explain AI in plain language. No factual claims without registered evidence.",
      facts,
      (fact) =>
        fact.claim.toLowerCase().includes("artificial intelligence")
    ),
    sectionForFacts(
      "Ethics and Responsible Use",
      facts.some((fact) =>
        fact.claim.toLowerCase().includes("ethical frameworks")
      )
        ? "Discuss responsible AI use using registered ethical framework evidence."
        : "Discuss ethical considerations. No factual claims without registered evidence.",
      facts,
      (fact) =>
        fact.claim.toLowerCase().includes("ethical frameworks")
    ),
    {
      heading: "Opportunities for Christians",
      purpose:
        "Explore responsible uses of AI for learning, administration, accessibility and ministry workflows using only verified background.",
      linkedEvidenceIds: allEvidenceIds,
      linkedFactClaims: facts.map((fact) => fact.claim),
      verificationRequired: true,
    },
    {
      heading: "Risks and Challenges",
      purpose:
        "Address misinformation, hallucinations, privacy and overdependence without inventing statistics or studies.",
      linkedEvidenceIds: allEvidenceIds,
      linkedFactClaims: facts.map((fact) => fact.claim),
      verificationRequired: true,
    },
    {
      heading: "Practical Guidelines",
      purpose:
        "Give readers clear steps for verifying information, protecting privacy and keeping human oversight.",
      linkedEvidenceIds: allEvidenceIds,
      linkedFactClaims: [],
      verificationRequired: true,
    },
    {
      heading: "Future Outlook",
      purpose:
        "Discuss possible implications carefully without presenting predictions as facts.",
      linkedEvidenceIds: [],
      linkedFactClaims: [],
      verificationRequired: true,
    },
  ]

  return {
    topic,
    introduction: {
      heading: "Introduction",
      purpose:
        "Introduce why AI and faith should be discussed with wisdom, discernment and care using only verifiable background.",
      linkedEvidenceIds: allEvidenceIds,
      verificationNote:
        facts.length > 0
          ? "Introduction must reference registered evidence before publication."
          : "Add verified context and registered sources before publication.",
    },
    sections,
    faq: [
      {
        question: "Can Christians use AI?",
        answerDraft:
          "Christians can use AI as a tool, but it should be used with wisdom, truthfulness, accountability and human oversight.",
        linkedEvidenceIds: allEvidenceIds,
        verificationRequired: true,
      },
      {
        question: "Is AI sinful?",
        answerDraft:
          "AI itself is a tool. The moral question depends on how it is designed, used and governed.",
        linkedEvidenceIds: allEvidenceIds,
        verificationRequired: true,
      },
      {
        question: "Can AI replace ministry?",
        answerDraft:
          "AI may support administrative and creative tasks, but it cannot replace human pastoral care, spiritual discernment or genuine community.",
        linkedEvidenceIds: [],
        verificationRequired: true,
      },
    ],
    conclusion: {
      heading: "Conclusion",
      purpose:
        "Conclude that AI should not be approached with fear or blind trust, but with wisdom, discernment and truth.",
      linkedEvidenceIds: allEvidenceIds,
      verificationNote:
        "Final article must include source-supported claims before publication.",
    },
    outlineStatus:
      facts.length > 0
        ? "Outline built from extracted facts and registered evidence."
        : "Outline built as skeleton only. Add sources before generating factual content.",
  }
}
