import type { ContentAssetType } from "./content-campaign"

export type DraftAssetType =
  | "article"
  | "newsletter"
  | "linkedin"
  | "x-twitter"
  | "threads"
  | "facebook"
  | "youtube-script"
  | "shorts-script"
  | "podcast-outline"
  | "presentation-outline"
  | "lead-magnet"
  | "email-campaign"

export type DraftOutputSchema = {
  format: "markdown" | "json" | "outline" | "script"
  requiredFields: string[]
  optionalFields: string[]
}

export type AssetPromptContract = {
  assetType: DraftAssetType
  promptPurpose: string
  toneGuidelines: string[]
  outputSchema: DraftOutputSchema
  riskFlags: string[]
}

export const DRAFT_ASSET_TYPES: DraftAssetType[] = [
  "article",
  "newsletter",
  "linkedin",
  "x-twitter",
  "threads",
  "facebook",
  "youtube-script",
  "shorts-script",
  "podcast-outline",
  "presentation-outline",
  "lead-magnet",
  "email-campaign",
]

export const CONTENT_TO_DRAFT_ASSET_TYPE: Partial<
  Record<ContentAssetType, DraftAssetType>
> = {
  "long-form-article": "article",
  newsletter: "newsletter",
  linkedin: "linkedin",
  "x-twitter": "x-twitter",
  threads: "threads",
  facebook: "facebook",
  "youtube-script": "youtube-script",
  "shorts-script": "shorts-script",
  "podcast-outline": "podcast-outline",
  "presentation-outline": "presentation-outline",
  "lead-magnet": "lead-magnet",
  "email-campaign": "email-campaign",
}

export function buildAssetPromptContract(
  assetType: DraftAssetType
): AssetPromptContract {
  return {
    assetType,
    promptPurpose: promptPurposeFor(assetType),
    toneGuidelines: [
      "Use source-grounded, practical language.",
      "Do not invent facts, statistics, quotes, studies, or citations.",
      "Keep uncertainty visible where evidence is limited.",
      "Preserve the master brief's audience, purpose, CTA, and risk boundaries.",
    ],
    outputSchema: outputSchemaFor(assetType),
    riskFlags: riskFlagsFor(assetType),
  }
}

export function buildAllAssetPromptContracts() {
  return DRAFT_ASSET_TYPES.map(buildAssetPromptContract)
}

function promptPurposeFor(assetType: DraftAssetType) {
  switch (assetType) {
    case "article":
      return "Prepare a long-form article draft preview contract from the approved master brief and verified claims."
    case "newsletter":
      return "Prepare an email newsletter draft preview contract that summarizes the mission for subscribers."
    case "linkedin":
    case "x-twitter":
    case "threads":
    case "facebook":
      return `Prepare a ${assetType} social draft preview contract with platform-aware constraints.`
    case "youtube-script":
      return "Prepare a YouTube script draft preview contract with hook, sections, and CTA."
    case "shorts-script":
      return "Prepare a short-form video script draft preview contract with concise hook and beats."
    case "podcast-outline":
      return "Prepare a podcast outline draft preview contract with talking points and source reminders."
    case "presentation-outline":
      return "Prepare a presentation outline draft preview contract with slide-level structure."
    case "lead-magnet":
      return "Prepare a lead magnet draft preview contract with useful, evidence-led takeaway structure."
    case "email-campaign":
      return "Prepare a multi-email campaign draft preview contract with sequence purpose and review gates."
  }
}

function outputSchemaFor(assetType: DraftAssetType): DraftOutputSchema {
  switch (assetType) {
    case "article":
      return {
        format: "markdown",
        requiredFields: ["title", "excerpt", "sections", "citations", "reviewNotes"],
        optionalFields: ["faq", "seoKeywords"],
      }
    case "newsletter":
      return {
        format: "json",
        requiredFields: ["subject", "previewText", "body", "citations", "reviewNotes"],
        optionalFields: ["segments"],
      }
    case "youtube-script":
    case "shorts-script":
      return {
        format: "script",
        requiredFields: ["hook", "beats", "cta", "citations", "reviewNotes"],
        optionalFields: ["bRollIdeas", "visualNotes"],
      }
    case "podcast-outline":
    case "presentation-outline":
      return {
        format: "outline",
        requiredFields: ["title", "outline", "citations", "reviewNotes"],
        optionalFields: ["timing", "speakerNotes"],
      }
    case "lead-magnet":
      return {
        format: "markdown",
        requiredFields: ["title", "intro", "sections", "cta", "citations", "reviewNotes"],
        optionalFields: ["worksheetPrompts"],
      }
    case "email-campaign":
      return {
        format: "json",
        requiredFields: ["campaignGoal", "emails", "cta", "citations", "reviewNotes"],
        optionalFields: ["segmentationNotes"],
      }
    default:
      return {
        format: "json",
        requiredFields: ["body", "cta", "citations", "reviewNotes"],
        optionalFields: ["variants"],
      }
  }
}

function riskFlagsFor(assetType: DraftAssetType) {
  const base = [
    "requires-human-review",
    "requires-citation-check",
    "no-automatic-publication",
  ]

  if (["linkedin", "x-twitter", "threads", "facebook"].includes(assetType)) {
    return [...base, "no-social-posting", "platform-context-risk"]
  }

  if (["youtube-script", "shorts-script"].includes(assetType)) {
    return [...base, "spoken-claim-risk", "visual-context-risk"]
  }

  if (assetType === "email-campaign") {
    return [...base, "email-compliance-review-required"]
  }

  return base
}
