export type MinistryStatus = "active" | "reviewing" | "planned"

export type MinistryWorkspace = {
  id: string
  name: string
  relatedResearchMission: string
  progress: number
  confidence: "low" | "moderate" | "high" | "very-high"
  status: MinistryStatus
  suggestedNextTeaching: string
  teachingCount: number
  scriptureCount: number
  lessonCount: number
  themes: string[]
  insights: string[]
  crossReferences: string[]
  timeline: Array<{
    date: string
    event: string
    status: "completed" | "in-progress" | "planned"
  }>
  sermonSeries: string[]
  bibleStudies: string[]
  teachingCourses: string[]
  smallGroupResources: string[]
  scriptureCollections: string[]
  prayerThemes: string[]
  pastoralApplications: string[]
  illustrations: string[]
  kingdomPrinciples: string[]
  readOnly: true
  previewOnly: true
  noAuth: true
  noSessions: true
  noJwt: true
  noDatabase: true
  noExecution: true
  noPublishing: true
  noOpenAI: true
  noGraphWrites: true
  noSocialPosting: true
}
