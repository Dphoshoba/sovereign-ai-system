import {
  buildContentCampaign,
  summarizeCampaign,
  type ApprovedResearchMissionInput,
} from "./content-campaign"
import { buildMasterContentBrief, summarizeMasterBrief } from "./content-brief"
import { buildChannelExecutionPlan } from "./channel-planner"
import { summarizeCampaignLineage } from "./content-lineage"
import { buildContentDashboard, evaluateContentReadiness } from "./content-readiness"

export type ContentOrchestrationResult = {
  dryRun: true
  writesToPrisma: false
  graphWrites: false
  graphDeletes: false
  automaticApprovals: false
  publishing: false
  socialPosting: false
  mission: ApprovedResearchMissionInput
  masterBrief: ReturnType<typeof buildMasterContentBrief>
  campaign: ReturnType<typeof buildContentCampaign>
  channelPlan: ReturnType<typeof buildChannelExecutionPlan>
  lineage: ReturnType<typeof summarizeCampaignLineage>
  readiness: ReturnType<typeof evaluateContentReadiness>
  dashboard: ReturnType<typeof buildContentDashboard>
  summary: {
    campaign: ReturnType<typeof summarizeCampaign>
    brief: ReturnType<typeof summarizeMasterBrief>
    readinessScore: number
    nextAction: string
  }
}

export const exampleApprovedResearchMission: ApprovedResearchMissionInput = {
  id: "research-mission:ai-agents-for-creator-research-workflows",
  topic: "AI agents for creator research workflows",
  category: "ai-tools",
  audience: "creator-operators building evidence-led content systems",
  purpose:
    "Turn a verified research mission into a governed multi-channel content campaign plan.",
  keyFindings: [
    "AI agents can reduce repetitive research organization tasks.",
    "Human review remains necessary before publishing AI-assisted content.",
    "Traceable citations and lineage improve trust in multi-channel repurposing.",
  ],
  verifiedClaims: [
    "AI tools can support content planning and outlining.",
    "Responsible and ethical AI use remains important for creators.",
    "Human review remains important before publishing AI-assisted content.",
  ],
  citations: [
    {
      id: "citation:creator-ai-workflows:1",
      label: "Evidence 1",
      sourceTitle: "Responsible AI workflow source",
      sourceUrl: "https://example.com/responsible-ai-workflows",
      evidenceId: "evidence:creator-ai-workflows:1",
    },
    {
      id: "citation:creator-ai-workflows:2",
      label: "Evidence 2",
      sourceTitle: "Creator productivity source",
      sourceUrl: "https://example.com/creator-productivity",
      evidenceId: "evidence:creator-ai-workflows:2",
    },
  ],
  evidenceIds: [
    "evidence:creator-ai-workflows:1",
    "evidence:creator-ai-workflows:2",
    "evidence:creator-ai-workflows:3",
  ],
  consensusIds: ["consensus:creator-ai-workflows:responsible-automation"],
  ontologyRecordIds: ["ontology:creator-ai-workflows:ai-tools"],
  reviewPackageIds: ["execution-authorization:phase-6-content-preview"],
  approvalStatus: "approved",
  risks: [
    "Avoid overstating automation benefits.",
    "Keep human review visible before any publication.",
    "Do not imply social posting is automatic.",
  ],
}

export function orchestrateContentCampaign(
  mission: ApprovedResearchMissionInput = exampleApprovedResearchMission
): ContentOrchestrationResult {
  const masterBrief = buildMasterContentBrief(mission)
  const campaign = buildContentCampaign(mission)
  const channelPlan = buildChannelExecutionPlan(campaign)
  const lineage = summarizeCampaignLineage(campaign)
  const readiness = evaluateContentReadiness(campaign)
  const dashboard = buildContentDashboard(campaign)

  return {
    dryRun: true,
    writesToPrisma: false,
    graphWrites: false,
    graphDeletes: false,
    automaticApprovals: false,
    publishing: false,
    socialPosting: false,
    mission,
    masterBrief,
    campaign,
    channelPlan,
    lineage,
    readiness,
    dashboard,
    summary: {
      campaign: summarizeCampaign(campaign),
      brief: summarizeMasterBrief(masterBrief),
      readinessScore: readiness.overallReadiness,
      nextAction:
        "Review the master brief and channel plan before enabling any content generation slice.",
    },
  }
}
