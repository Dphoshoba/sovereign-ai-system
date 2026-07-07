import type { GammaCreateCommand } from "./types"

export const GAMMA_CREATE_COMMANDS: ReadonlyArray<GammaCreateCommand> = [
  { command: "gamma:create womanhood", template: "research-template", workspaceGenerationScore: 88 },
  { command: "gamma:create fatherhood", template: "research-template", workspaceGenerationScore: 85 },
  { command: "gamma:create leadership", template: "executive-template", workspaceGenerationScore: 84 },
  { command: "gamma:create discipleship", template: "ministry-template", workspaceGenerationScore: 87 },
  { command: "gamma:create ai", template: "creator-template", workspaceGenerationScore: 80 },
  { command: "gamma:create business", template: "agency-template", workspaceGenerationScore: 86 },
  { command: "gamma:create kingdom", template: "shared-template", workspaceGenerationScore: 89 },
]
