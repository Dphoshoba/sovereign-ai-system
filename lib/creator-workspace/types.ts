export type CreatorOutputType =
  | "book-outline"
  | "course-outline"
  | "youtube-series"
  | "article-ideas"

export type CreatorOutputItem = {
  id: string
  title: string
  summary: string
  status: "draft" | "ready" | "in-progress"
  itemCount: number
}

export type CreatorWorkspace = {
  id: string
  name: string
  relatedMissionId: string
  relatedMissionName: string
  progress: number
  confidence: "low" | "moderate" | "high" | "very-high"
  nextSuggestedOutput: CreatorOutputType
  contentStatus: string
  creatorProjects: CreatorOutputItem[]
  bookOutlines: string[]
  courseOutlines: string[]
  youtubeSeries: string[]
  articleIdeas: string[]
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