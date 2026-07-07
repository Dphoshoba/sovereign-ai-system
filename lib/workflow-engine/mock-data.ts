import type { WorkflowEngineWorkspace } from "./types"

export const WORKFLOW_ENGINE_ASSETS: WorkflowEngineWorkspace = {
  executions: [
    {
      id: "wf-001",
      name: "Data Processing Pipeline",
      status: "completed",
      progress: 100,
      steps: [
        { id: "step-1", name: "Extract", status: "completed", duration: 1200 },
        { id: "step-2", name: "Transform", status: "completed", duration: 2400 },
        { id: "step-3", name: "Load", status: "completed", duration: 1800 },
      ],
    },
  ],
  metrics: {
    activeWorkflows: 1,
    completedWorkflows: 8,
    failedWorkflows: 0,
    avgDuration: 5000,
  },
}
