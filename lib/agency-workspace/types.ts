export type AgencyConfidence = "low" | "moderate" | "high" | "very-high"

export type AgencyWorkspace = {
  id: string
  name: string
  relatedMission: string
  progress: number
  confidence: AgencyConfidence
  pipelineStage: "discovery" | "proposal" | "delivery"
  projectStatus: "active" | "reviewing" | "planned"
  valueProposition: string
  revenuePotential: string
  nextSuggestedService: string
  proposalCount: number
  offerCount: number
  workshopCount: number
  packageCount: number
  timelineCount: number
  clientProposals: string[]
  servicePackages: string[]
  discoveryDocuments: string[]
  workshopPlans: string[]
  consultingDeliverables: string[]
  presentationOutlines: string[]
  caseStudies: string[]
  offerTemplates: string[]
  roadmaps: string[]
  crossReferences: string[]
  timeline: Array<{
    date: string
    event: string
    status: "completed" | "in-progress" | "planned"
  }>
  relatedMissions: Array<{
    id: string
    title: string
    status: string
  }>
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
