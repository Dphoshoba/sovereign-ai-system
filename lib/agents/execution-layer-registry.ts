import { researchPipelineArchitecture } from "../research/pipeline-registry"

export const executionLayerRegistry = {
  name: "Execution Layer",
  status: "active",
  purpose:
    "Connect the sovereign recursive architecture to real-world research, content creation, publishing, analytics and monetization workflows.",

  architecture: researchPipelineArchitecture,

  workflow: researchPipelineArchitecture.flow.map((stage) => ({
    step: stage.step,
    agent: stage.stage,
    module: stage.module,
    purpose: stage.purpose,
    status:
      stage.step <= 9 ? "complete" : stage.step === 10 ? "complete" : "pending",
  })),

  firstWorkflow:
    "AI + Faith Blog Automation Workflow",

  executionConstraint:
    "Execution workflows must prioritize verified information, source-grounded claims, human dignity, wisdom, trust and practical usefulness.",

  phase1Rules: researchPipelineArchitecture.phase1Rules,
}
