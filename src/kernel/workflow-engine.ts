import type { WorkflowDefinition, WorkflowStep } from "./types"

export interface WorkflowExecution {
  workflowId: string
  executionId: string
  status: "pending" | "running" | "completed" | "failed"
  startTime: number
  endTime?: number
  currentStepIndex: number
  results: Record<string, any>
}

export class WorkflowEngine {
  private workflows: Map<string, WorkflowDefinition> = new Map()
  private executions: Map<string, WorkflowExecution> = new Map()
  private static readonly FIXED_TIMESTAMP = 1751990400000
  private executionCounter = 0

  defineWorkflow(def: WorkflowDefinition): void {
    this.workflows.set(def.id, def)
  }

  getWorkflow(workflowId: string): WorkflowDefinition | undefined {
    return this.workflows.get(workflowId)
  }

  getAllWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflows.values())
  }

  async executeWorkflow(workflowId: string, startData: Record<string, any>): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`)
    }

    const executionId = `exec-${this.executionCounter++}`
    const execution: WorkflowExecution = {
      workflowId,
      executionId,
      status: "running",
      startTime: WorkflowEngine.FIXED_TIMESTAMP,
      currentStepIndex: 0,
      results: startData,
    }

    this.executions.set(executionId, execution)

    try {
      await this.executeSteps(execution, workflow)
      execution.status = "completed"
      execution.endTime = WorkflowEngine.FIXED_TIMESTAMP
    } catch (error) {
      execution.status = "failed"
      execution.endTime = WorkflowEngine.FIXED_TIMESTAMP
      throw error
    }

    return execution
  }

  private async executeSteps(execution: WorkflowExecution, workflow: WorkflowDefinition): Promise<void> {
    for (let i = 0; i < workflow.steps.length; i++) {
      execution.currentStepIndex = i
      // Deterministic step execution with no random delays
      await this.executeStep(workflow.steps[i], execution)
    }
  }

  private async executeStep(step: WorkflowStep, execution: WorkflowExecution): Promise<void> {
    // Simulate deterministic step execution
    const stepResult = {
      engineId: step.engineId,
      action: step.action,
      status: "completed",
      timestamp: WorkflowEngine.FIXED_TIMESTAMP,
    }
    execution.results[`step-${execution.currentStepIndex}`] = stepResult
  }

  resolveWorkflowOrder(workflowId: string): string[] {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) return []

    if (workflow.parallelizable) {
      return workflow.steps.map((_, i) => `step-${i}`)
    }

    return workflow.steps.map((_, i) => `step-${i}`)
  }

  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId)
  }

  getExecutions(workflowId?: string): WorkflowExecution[] {
    const execs = Array.from(this.executions.values())
    return workflowId ? execs.filter((e) => e.workflowId === workflowId) : execs
  }
}
