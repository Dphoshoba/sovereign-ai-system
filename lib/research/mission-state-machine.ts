export const RESEARCH_MISSION_STATES = [
  "DISCOVERED",
  "PLANNED",
  "RESEARCHING",
  "COLLECTING",
  "VERIFYING",
  "EXTRACTING",
  "CONSENSUS",
  "ONTOLOGY",
  "ENTITY_RESOLUTION",
  "REVIEW_READY",
  "APPROVED",
  "DRAFT_READY",
  "COMPLETED",
  "FAILED",
  "BLOCKED",
] as const

export type ResearchMissionState = (typeof RESEARCH_MISSION_STATES)[number]

export type MissionStateTransitionValidation = {
  valid: boolean
  from: ResearchMissionState
  to: ResearchMissionState
  errors: string[]
  warnings: string[]
}

export const MISSION_STATE_TRANSITIONS: Record<
  ResearchMissionState,
  ResearchMissionState[]
> = {
  DISCOVERED: ["PLANNED", "BLOCKED"],
  PLANNED: ["RESEARCHING", "BLOCKED", "FAILED"],
  RESEARCHING: ["COLLECTING", "BLOCKED", "FAILED"],
  COLLECTING: ["VERIFYING", "BLOCKED", "FAILED"],
  VERIFYING: ["EXTRACTING", "BLOCKED", "FAILED"],
  EXTRACTING: ["CONSENSUS", "BLOCKED", "FAILED"],
  CONSENSUS: ["ONTOLOGY", "REVIEW_READY", "BLOCKED", "FAILED"],
  ONTOLOGY: ["ENTITY_RESOLUTION", "BLOCKED", "FAILED"],
  ENTITY_RESOLUTION: ["REVIEW_READY", "BLOCKED", "FAILED"],
  REVIEW_READY: ["APPROVED", "BLOCKED", "FAILED"],
  APPROVED: ["DRAFT_READY", "BLOCKED", "FAILED"],
  DRAFT_READY: ["COMPLETED", "BLOCKED", "FAILED"],
  COMPLETED: [],
  FAILED: ["DISCOVERED"],
  BLOCKED: ["DISCOVERED", "PLANNED"],
}

export function validateMissionTransition(
  from: ResearchMissionState,
  to: ResearchMissionState
): MissionStateTransitionValidation {
  const errors: string[] = []
  const warnings: string[] = []
  const allowed = MISSION_STATE_TRANSITIONS[from] ?? []

  if (from === to) {
    warnings.push("Mission is already in the requested state.")
  } else if (!allowed.includes(to)) {
    errors.push(`Transition ${from} -> ${to} is not allowed.`)
  }

  if (to === "APPROVED") {
    warnings.push(
      "APPROVED can only mean human approval was recorded externally; this state machine does not approve automatically."
    )
  }

  if (to === "COMPLETED") {
    warnings.push(
      "COMPLETED must not imply automatic publication or graph writes."
    )
  }

  return {
    valid: errors.length === 0,
    from,
    to,
    errors,
    warnings,
  }
}

export function nextMissionStates(
  state: ResearchMissionState
): ResearchMissionState[] {
  return MISSION_STATE_TRANSITIONS[state] ?? []
}

export function estimateNextMissionAction(state: ResearchMissionState) {
  switch (state) {
    case "DISCOVERED":
      return "Build a governed research mission plan."
    case "PLANNED":
      return "Begin source-grounded research collection when approved by operator policy."
    case "RESEARCHING":
      return "Collect candidate sources through the existing research pipeline."
    case "COLLECTING":
      return "Register evidence and preserve source links."
    case "VERIFYING":
      return "Verify extracted claims against collected evidence."
    case "EXTRACTING":
      return "Extract structured facts and semantic claims."
    case "CONSENSUS":
      return "Build consensus groups and publication recommendation."
    case "ONTOLOGY":
      return "Map verified knowledge into the universal ontology contract."
    case "ENTITY_RESOLUTION":
      return "Run duplicate-safe entity resolution dry-run."
    case "REVIEW_READY":
      return "Create or inspect human review packages; do not auto-approve."
    case "APPROVED":
      return "Prepare draft generation and transaction preview; do not publish or write graph automatically."
    case "DRAFT_READY":
      return "Send draft to human editorial review."
    case "COMPLETED":
      return "Archive mission outputs and wait for explicit next task."
    case "FAILED":
      return "Review failure reason and decide whether to rediscover."
    case "BLOCKED":
      return "Resolve governance, evidence, duplicate, or approval blocker."
  }
}
