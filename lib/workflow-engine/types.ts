export interface WorkflowStep {
  id: string
  name: string
  status: "pending" | "executing" | "completed" | "failed"
  duration: number
}

export interface WorkflowExecution {
  id: string
  name: string
  status: "running" | "completed" | "failed"
  progress: number
  steps: WorkflowStep[]
}

export interface WorkflowEngineMetrics {
  activeWorkflows: number
  completedWorkflows: number
  failedWorkflows: number
  avgDuration: number
}

export interface WorkflowEngineWorkspace {
  executions: WorkflowExecution[]
  metrics: WorkflowEngineMetrics
}
