export interface WorkflowStep {
  readonly stepId: string;
  readonly providerId: string;
  readonly operation: string;
  readonly input: Readonly<Record<string, unknown>>;
  readonly dependsOn: readonly string[];
  readonly timeoutMs: number;
}

export interface WorkflowDefinition {
  readonly workflowId: string;
  readonly name: string;
  readonly version: string;
  readonly steps: readonly WorkflowStep[];
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface DAGValidationResult {
  readonly valid: boolean;
  readonly cycles: readonly string[][];
  readonly missingDependencies: readonly string[];
  readonly duplicateSteps: readonly string[];
  readonly emptyWorkflow: boolean;
}

export interface ExecutionPlanStep {
  readonly stepId: string;
  readonly providerId: string;
  readonly operation: string;
  readonly input: Readonly<Record<string, unknown>>;
  readonly dependsOn: readonly string[];
  readonly level: number;
  readonly timeoutMs: number;
}

export interface ExecutionPlan {
  readonly workflowId: string;
  readonly orderedSteps: readonly ExecutionPlanStep[];
  readonly totalSteps: number;
  readonly levels: number;
}

export const MAX_CYCLES_REPORTED = 5;

export interface WorkflowGraphEngine {
  validate(definition: WorkflowDefinition): DAGValidationResult;
  plan(definition: WorkflowDefinition): ExecutionPlan;
}
