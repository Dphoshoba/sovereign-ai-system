import type {
  ResearchWorkspace,
  MissionCard,
  DiscoveryItem,
  ResearchQuestion,
  ScriptureReference,
  TimelineEntry,
  RelatedWorkspace,
  KnowledgeDomain,
  ConfidenceLevel,
} from "./types"

const domains: KnowledgeDomain[] = [
  "theology",
  "history",
  "philosophy",
  "linguistics",
  "textual-criticism",
  "archaeology",
  "geography",
  "science",
  "culture",
]

const confidenceLevels: ConfidenceLevel[] = ["low", "moderate", "high", "very-high"]

// Deterministic preview data - no randomization
// All values are hardcoded for SSR/hydration stability

function generateScriptureReferences(count: number): ScriptureReference[] {
  // Deterministic preview scripture references
  const refs: ScriptureReference[] = [
    {
      book: "Matthew",
      chapter: 5,
      verse: "3-12",
      text: "Blessed are the merciful",
      confidence: "very-high",
      relatedDomains: ["theology", "philosophy"],
    },
    {
      book: "John",
      chapter: 1,
      verse: 1,
      text: "In the beginning was the Word",
      confidence: "high",
      relatedDomains: ["theology", "textual-criticism"],
    },
    {
      book: "Romans",
      chapter: 3,
      verse: "23-24",
      text: "All have sinned and fall short of the glory of God",
      confidence: "very-high",
      relatedDomains: ["theology", "history"],
    },
    {
      book: "Genesis",
      chapter: 1,
      verse: 1,
      text: "In the beginning God created the heavens and the earth",
      confidence: "high",
      relatedDomains: ["theology", "science"],
    },
    {
      book: "Psalms",
      chapter: 23,
      verse: 1,
      text: "The Lord is my shepherd",
      confidence: "high",
      relatedDomains: ["theology", "culture"],
    },
    {
      book: "Isaiah",
      chapter: 40,
      verse: "28-31",
      text: "The Lord is the everlasting God",
      confidence: "moderate",
      relatedDomains: ["theology", "philosophy"],
    },
    {
      book: "Proverbs",
      chapter: 3,
      verse: "5-6",
      text: "Trust in the Lord with all your heart",
      confidence: "high",
      relatedDomains: ["philosophy", "culture"],
    },
    {
      book: "1 Corinthians",
      chapter: 13,
      verse: "4-7",
      text: "Love is patient, love is kind",
      confidence: "very-high",
      relatedDomains: ["theology", "philosophy"],
    },
    {
      book: "Hebrews",
      chapter: 11,
      verse: 1,
      text: "Now faith is being sure of what we hope for",
      confidence: "high",
      relatedDomains: ["theology", "textual-criticism"],
    },
    {
      book: "James",
      chapter: 2,
      verse: "26",
      text: "Faith without deeds is dead",
      confidence: "moderate",
      relatedDomains: ["philosophy", "theology"],
    },
  ]
  return refs.slice(0, count)
}

function generateDiscoveryItems(count: number): DiscoveryItem[] {
  // Deterministic preview discovery items
  const discoveries: DiscoveryItem[] = [
    {
      id: "discovery-0",
      title: "Textual variant analysis",
      description: "Detailed analysis and findings related to textual variant analysis",
      domain: "textual-criticism",
      confidence: "high",
      sourceCount: 12,
      relatedTo: ["ref-0", "question-0"],
      timestamp: new Date("2026-07-01"),
    },
    {
      id: "discovery-1",
      title: "Historical context reconstruction",
      description: "Detailed analysis and findings related to historical context reconstruction",
      domain: "history",
      confidence: "very-high",
      sourceCount: 8,
      relatedTo: ["ref-1", "question-1"],
      timestamp: new Date("2026-07-02"),
    },
    {
      id: "discovery-2",
      title: "Semantic domain mapping",
      description: "Detailed analysis and findings related to semantic domain mapping",
      domain: "linguistics",
      confidence: "high",
      sourceCount: 10,
      relatedTo: ["ref-2", "question-2"],
      timestamp: new Date("2026-06-30"),
    },
    {
      id: "discovery-3",
      title: "Archaeological correlation",
      description: "Detailed analysis and findings related to archaeological correlation",
      domain: "archaeology",
      confidence: "moderate",
      sourceCount: 6,
      relatedTo: ["ref-3", "question-3"],
      timestamp: new Date("2026-06-28"),
    },
    {
      id: "discovery-4",
      title: "Theological implication synthesis",
      description: "Detailed analysis and findings related to theological implication synthesis",
      domain: "theology",
      confidence: "high",
      sourceCount: 14,
      relatedTo: ["ref-4", "question-4"],
      timestamp: new Date("2026-06-25"),
    },
    {
      id: "discovery-5",
      title: "Cultural context mapping",
      description: "Detailed analysis and findings related to cultural context mapping",
      domain: "culture",
      confidence: "moderate",
      sourceCount: 9,
      relatedTo: ["ref-5", "question-1"],
      timestamp: new Date("2026-06-20"),
    },
    {
      id: "discovery-6",
      title: "Linguistic pattern recognition",
      description: "Detailed analysis and findings related to linguistic pattern recognition",
      domain: "linguistics",
      confidence: "high",
      sourceCount: 11,
      relatedTo: ["ref-2", "question-5"],
      timestamp: new Date("2026-06-18"),
    },
    {
      id: "discovery-7",
      title: "Source authentication",
      description: "Detailed analysis and findings related to source authentication",
      domain: "history",
      confidence: "very-high",
      sourceCount: 7,
      relatedTo: ["ref-1", "question-2"],
      timestamp: new Date("2026-06-15"),
    },
    {
      id: "discovery-8",
      title: "Chronological alignment",
      description: "Detailed analysis and findings related to chronological alignment",
      domain: "history",
      confidence: "high",
      sourceCount: 13,
      relatedTo: ["ref-3", "question-0"],
      timestamp: new Date("2026-06-12"),
    },
    {
      id: "discovery-9",
      title: "Philological analysis",
      description: "Detailed analysis and findings related to philological analysis",
      domain: "linguistics",
      confidence: "moderate",
      sourceCount: 8,
      relatedTo: ["ref-0", "question-4"],
      timestamp: new Date("2026-06-10"),
    },
    {
      id: "discovery-10",
      title: "Intertextual relationships",
      description: "Detailed analysis and findings related to intertextual relationships",
      domain: "textual-criticism",
      confidence: "high",
      sourceCount: 15,
      relatedTo: ["ref-4", "question-3"],
      timestamp: new Date("2026-06-08"),
    },
    {
      id: "discovery-11",
      title: "Doctrinal framework analysis",
      description: "Detailed analysis and findings related to doctrinal framework analysis",
      domain: "theology",
      confidence: "high",
      sourceCount: 10,
      relatedTo: ["ref-5", "question-5"],
      timestamp: new Date("2026-06-05"),
    },
  ]
  return discoveries.slice(0, count)
}

function generateResearchQuestions(count: number): ResearchQuestion[] {
  // Deterministic preview research questions
  const questions: ResearchQuestion[] = [
    {
      id: "question-0",
      question: "What is the historical context of this passage?",
      status: "answered",
      confidence: "very-high",
      domain: "history",
      discoveries: [
        {
          id: "discovery-0",
          title: "Historical Context Reconstruction",
          description: "Comprehensive analysis of period, culture, and political situation",
          domain: "history",
          confidence: "very-high",
          sourceCount: 12,
          relatedTo: ["ref-0"],
          timestamp: new Date("2026-07-01"),
        },
      ],
      timestamp: new Date("2026-06-15"),
    },
    {
      id: "question-1",
      question: "How does this text relate to other biblical passages?",
      status: "answered",
      confidence: "high",
      domain: "textual-criticism",
      discoveries: [
        {
          id: "discovery-1",
          title: "Intertextual Analysis",
          description: "Mapping of cross-references and theological parallels",
          domain: "textual-criticism",
          confidence: "high",
          sourceCount: 8,
          relatedTo: ["ref-1"],
          timestamp: new Date("2026-07-02"),
        },
      ],
      timestamp: new Date("2026-06-14"),
    },
    {
      id: "question-2",
      question: "What are the linguistic implications?",
      status: "partial",
      confidence: "moderate",
      domain: "linguistics",
      discoveries: [
        {
          id: "discovery-2",
          title: "Linguistic Analysis",
          description: "Study of original language meaning and translation issues",
          domain: "linguistics",
          confidence: "moderate",
          sourceCount: 10,
          relatedTo: ["ref-2"],
          timestamp: new Date("2026-06-30"),
        },
      ],
      timestamp: new Date("2026-06-12"),
    },
    {
      id: "question-3",
      question: "What archaeological evidence supports this account?",
      status: "answered",
      confidence: "high",
      domain: "archaeology",
      discoveries: [
        {
          id: "discovery-3",
          title: "Archaeological Evidence",
          description: "Documentation of relevant archaeological findings and corroborations",
          domain: "archaeology",
          confidence: "high",
          sourceCount: 6,
          relatedTo: ["ref-3"],
          timestamp: new Date("2026-06-28"),
        },
      ],
      timestamp: new Date("2026-06-10"),
    },
    {
      id: "question-4",
      question: "How has interpretation evolved across traditions?",
      status: "partial",
      confidence: "moderate",
      domain: "theology",
      discoveries: [
        {
          id: "discovery-4",
          title: "Interpretive Evolution",
          description: "Historical development of theological interpretation",
          domain: "theology",
          confidence: "moderate",
          sourceCount: 14,
          relatedTo: ["ref-4"],
          timestamp: new Date("2026-06-25"),
        },
      ],
      timestamp: new Date("2026-06-08"),
    },
    {
      id: "question-5",
      question: "What textual variants exist and why?",
      status: "answered",
      confidence: "very-high",
      domain: "textual-criticism",
      discoveries: [
        {
          id: "discovery-5",
          title: "Textual Variants",
          description: "Comprehensive catalog of manuscript variants with explanations",
          domain: "textual-criticism",
          confidence: "very-high",
          sourceCount: 9,
          relatedTo: ["ref-5"],
          timestamp: new Date("2026-06-20"),
        },
      ],
      timestamp: new Date("2026-06-05"),
    },
    {
      id: "question-6",
      question: "What is the geographical significance?",
      status: "answered",
      confidence: "high",
      domain: "geography",
      discoveries: [],
      timestamp: new Date("2026-06-02"),
    },
    {
      id: "question-7",
      question: "How does this connect to broader theological themes?",
      status: "partial",
      confidence: "moderate",
      domain: "theology",
      discoveries: [],
      timestamp: new Date("2026-05-30"),
    },
  ]
  return questions.slice(0, count)
}

function generateMissionCards(count: number): MissionCard[] {
  // Deterministic preview mission cards
  const missions: MissionCard[] = [
    {
      id: "mission-0",
      title: "Theology Research Mission",
      objective: "Comprehensive textual analysis",
      status: "active",
      progress: 72,
      domain: "theology",
      confidence: "high",
      questionsToAnswer: 8,
      questionsAnswered: 6,
      discoveriesToMake: 12,
      discoveriesMade: 10,
      startDate: new Date("2026-05-15"),
      estimatedCompletion: new Date("2026-08-15"),
      scriptureReferences: generateScriptureReferences(6),
    },
    {
      id: "mission-1",
      title: "History Research Mission",
      objective: "Historical timeline construction",
      status: "active",
      progress: 58,
      domain: "history",
      confidence: "very-high",
      questionsToAnswer: 10,
      questionsAnswered: 6,
      discoveriesToMake: 15,
      discoveriesMade: 9,
      startDate: new Date("2026-06-01"),
      estimatedCompletion: new Date("2026-09-01"),
      scriptureReferences: generateScriptureReferences(5),
    },
    {
      id: "mission-2",
      title: "Linguistics Research Mission",
      objective: "Linguistic mapping",
      status: "active",
      progress: 64,
      domain: "linguistics",
      confidence: "high",
      questionsToAnswer: 7,
      questionsAnswered: 4,
      discoveriesToMake: 10,
      discoveriesMade: 6,
      startDate: new Date("2026-05-20"),
      estimatedCompletion: new Date("2026-08-20"),
      scriptureReferences: generateScriptureReferences(4),
    },
    {
      id: "mission-3",
      title: "Textual Criticism Research Mission",
      objective: "Source verification",
      status: "completed",
      progress: 100,
      domain: "textual-criticism",
      confidence: "very-high",
      questionsToAnswer: 6,
      questionsAnswered: 6,
      discoveriesToMake: 8,
      discoveriesMade: 8,
      startDate: new Date("2026-04-01"),
      estimatedCompletion: new Date("2026-07-01"),
      scriptureReferences: generateScriptureReferences(7),
    },
    {
      id: "mission-4",
      title: "Archaeology Research Mission",
      objective: "Archaeological correlation",
      status: "active",
      progress: 45,
      domain: "archaeology",
      confidence: "moderate",
      questionsToAnswer: 9,
      questionsAnswered: 3,
      discoveriesToMake: 14,
      discoveriesMade: 5,
      startDate: new Date("2026-06-10"),
      estimatedCompletion: new Date("2026-09-10"),
      scriptureReferences: generateScriptureReferences(3),
    },
    {
      id: "mission-5",
      title: "Philosophy Research Mission",
      objective: "Theological synthesis",
      status: "planned",
      progress: 12,
      domain: "philosophy",
      confidence: "moderate",
      questionsToAnswer: 8,
      questionsAnswered: 1,
      discoveriesToMake: 11,
      discoveriesMade: 1,
      startDate: new Date("2026-07-01"),
      estimatedCompletion: new Date("2026-10-01"),
      scriptureReferences: generateScriptureReferences(2),
    },
  ]
  return missions.slice(0, count)
}

function generateTimelineEntries(count: number): TimelineEntry[] {
  // Deterministic preview timeline entries
  const entries: TimelineEntry[] = [
    {
      timestamp: new Date("2026-07-03"),
      event: "Started research mission",
      discoveryCount: 2,
      questionsAnswered: 1,
      status: "completed",
    },
    {
      timestamp: new Date("2026-07-02"),
      event: "Completed discovery phase",
      discoveryCount: 3,
      questionsAnswered: 2,
      status: "completed",
    },
    {
      timestamp: new Date("2026-07-01"),
      event: "Verified sources",
      discoveryCount: 1,
      questionsAnswered: 0,
      status: "completed",
    },
    {
      timestamp: new Date("2026-06-30"),
      event: "Answered research question",
      discoveryCount: 0,
      questionsAnswered: 1,
      status: "completed",
    },
    {
      timestamp: new Date("2026-06-29"),
      event: "Updated confidence level",
      discoveryCount: 0,
      questionsAnswered: 0,
      status: "completed",
    },
    {
      timestamp: new Date("2026-06-28"),
      event: "Added new scripture reference",
      discoveryCount: 2,
      questionsAnswered: 0,
      status: "completed",
    },
    {
      timestamp: new Date("2026-06-27"),
      event: "Cross-referenced findings",
      discoveryCount: 4,
      questionsAnswered: 2,
      status: "completed",
    },
    {
      timestamp: new Date("2026-06-26"),
      event: "Completed textual analysis",
      discoveryCount: 1,
      questionsAnswered: 1,
      status: "completed",
    },
    {
      timestamp: new Date("2026-06-25"),
      event: "Identified theological implications",
      discoveryCount: 3,
      questionsAnswered: 1,
      status: "completed",
    },
    {
      timestamp: new Date("2026-06-24"),
      event: "Resolved duplicate entities",
      discoveryCount: 0,
      questionsAnswered: 0,
      status: "completed",
    },
    {
      timestamp: new Date("2026-06-23"),
      event: "Started research mission",
      discoveryCount: 2,
      questionsAnswered: 1,
      status: "completed",
    },
    {
      timestamp: new Date("2026-06-22"),
      event: "Completed discovery phase",
      discoveryCount: 1,
      questionsAnswered: 0,
      status: "completed",
    },
    {
      timestamp: new Date("2026-06-21"),
      event: "Verified sources",
      discoveryCount: 2,
      questionsAnswered: 1,
      status: "completed",
    },
    {
      timestamp: new Date("2026-06-20"),
      event: "Answered research question",
      discoveryCount: 0,
      questionsAnswered: 2,
      status: "completed",
    },
    {
      timestamp: new Date("2026-06-19"),
      event: "Updated confidence level",
      discoveryCount: 1,
      questionsAnswered: 0,
      status: "completed",
    },
  ]
  return entries.slice(0, count)
}

function generateRelatedWorkspaces(count: number): RelatedWorkspace[] {
  // Deterministic preview related workspaces
  const workspaces: RelatedWorkspace[] = [
    {
      id: "workspace-0",
      name: "Gospel Parallels Study",
      similarity: 82,
      sharedDomains: ["theology", "history", "textual-criticism"],
      status: "active",
    },
    {
      id: "workspace-1",
      name: "Pauline Epistles Analysis",
      similarity: 68,
      sharedDomains: ["theology", "linguistics", "philosophy"],
      status: "active",
    },
    {
      id: "workspace-2",
      name: "Old Testament History",
      similarity: 74,
      sharedDomains: ["history", "archaeology", "geography"],
      status: "active",
    },
    {
      id: "workspace-3",
      name: "Parable Research Project",
      similarity: 56,
      sharedDomains: ["theology", "culture", "philosophy"],
      status: "reviewing",
    },
    {
      id: "workspace-4",
      name: "Prophecy Fulfillment Study",
      similarity: 71,
      sharedDomains: ["theology", "history", "textual-criticism"],
      status: "completed",
    },
  ]
  return workspaces.slice(0, count)
}

export function generateMockResearchWorkspace(
  id: string = "ws-001"
): ResearchWorkspace {
  const missions = generateMissionCards(6)
  const discoveries = generateDiscoveryItems(12)
  const questions = generateResearchQuestions(8)
  const scriptureReferences = generateScriptureReferences(10)

  // Static values for deterministic rendering
  const discoveryCount = 12
  const questionCount = 8
  const questionsAnswered = 4
  const scriptureReferenceCount = 10
  const overallProgress = 62

  return {
    id,
    name: "Gospel Chronology Research Workspace",
    description:
      "Comprehensive research into the chronological and theological relationships between the four gospels, including textual variants, historical context, and archaeological correlations.",
    status: "active",
    createdAt: new Date("2026-01-15"),
    lastUpdated: new Date("2026-07-03"),

    overallProgress,
    overallConfidence: "high",
    discoveryCount,
    questionCount,
    questionsAnswered,
    scriptureReferenceCount,

    missions,
    discoveries,
    questions,
    scriptureReferences,
    timeline: generateTimelineEntries(15),
    domains: [
      { domain: "theology", count: 18, confidence: "high" },
      { domain: "history", count: 15, confidence: "very-high" },
      { domain: "textual-criticism", count: 12, confidence: "high" },
      { domain: "linguistics", count: 9, confidence: "moderate" },
      { domain: "archaeology", count: 8, confidence: "moderate" },
      { domain: "philosophy", count: 7, confidence: "high" },
      { domain: "geography", count: 6, confidence: "high" },
      { domain: "science", count: 5, confidence: "moderate" },
      { domain: "culture", count: 11, confidence: "moderate" },
    ],
    relatedWorkspaces: generateRelatedWorkspaces(5),

    readOnly: true,
    noDatabase: true,
    noExecution: true,
    previewOnly: true,
  }
}

export function getAllMockWorkspaces(): ResearchWorkspace[] {
  return [
    generateMockResearchWorkspace("ws-001"),
    generateMockResearchWorkspace("ws-002"),
    generateMockResearchWorkspace("ws-003"),
    generateMockResearchWorkspace("ws-004"),
    generateMockResearchWorkspace("ws-005"),
  ]
}
