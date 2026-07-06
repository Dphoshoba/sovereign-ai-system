import type { MissionQueryWorkspace } from "./types"

export function getMockMissionQueryWorkspace(): MissionQueryWorkspace {
  return {
    mission: "womanhood",
    missionTitle: "Research Mission 001 - Womanhood",
    queryCount: 10,
    questionCount: 8,
    answerCount: 10,
    gapCount: 3,
    recommendationCount: 6,
    coverageScore: 62,
    inferenceCoverage: 58,
    confidenceScore: 71,
    recommendationScore: 77,
    missionPriorityScore: 78,
    knowledgeCompleteness: 59,
    healthScore: 66,
    missingAssets: ["taxonomy.md", "podcast-series.md", "interactive-course.md", "workshop-material.md"],
    weakAreas: [
      { workspace: "creator", score: 48, status: "weak" },
      { workspace: "executive", score: 51, status: "watch" },
    ],
    strongAreas: [
      { workspace: "research", score: 62, status: "watch" },
      { workspace: "shared-knowledge", score: 77, status: "strong" },
    ],
    suggestedNextActions: [
      "Build taxonomy.md",
      "Create motherhood article",
      "Expand hormones.md",
      "Create seminar.md for women and civilization",
    ],
    answers: [
      {
        id: "query-1",
        query: "What discoveries support this teaching?",
        answer: ["Oxytocin research", "Hormone studies", "questions.md references", "scriptures.md references"],
        confidence: "high",
        evidence: [
          { source: "gamma/research/womanhood/hormones.md", summary: "Hormonal evidence for bonding and behavior." },
          { source: "gamma/research/womanhood/scriptures.md", summary: "Scripture references for compassion and attachment." },
        ],
        priority: "high",
        recommendedNextActions: ["Link discovery lines directly into teaching cards."],
      },
    ],
    readOnly: true,
    previewOnly: true,
    noAuth: true,
    noSessions: true,
    noJwt: true,
    noDatabase: true,
    noExecution: true,
    noPublishing: true,
    noOpenAI: true,
    noGraphWrites: true,
    noSocialPosting: true,
  }
}
