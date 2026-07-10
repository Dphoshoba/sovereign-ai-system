/**
 * Gamma Flow 1.0 — Workflow Orchestration Domain Model
 * 
 * Core types for building deterministic, preview-first workflows
 * that orchestrate connectors while maintaining safety guarantees.
 */

export type WorkflowState =
  | 'draft'
  | 'validated'
  | 'ready'
  | 'running_preview'
  | 'waiting_approval'
  | 'queued'
  | 'completed_preview'
  | 'failed'
  | 'disabled';

export type NodeType =
  | 'trigger'
  | 'connector'
  | 'decision'
  | 'transform'
  | 'approval'
  | 'queue'
  | 'delay'
  | 'notification'
  | 'sink';

export type EdgeType =
  | 'always'
  | 'success'
  | 'failure'
  | 'approved'
  | 'rejected'
  | 'condition_true'
  | 'condition_false';

export type TriggerType =
  | 'manual'
  | 'scheduled'
  | 'connector_event'
  | 'webhook'
  | 'form_submission';

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'contains'
  | 'not_contains'
  | 'is_null'
  | 'is_not_null'
  | 'and'
  | 'or';

export interface WorkflowTrigger {
  id: string;
  type: TriggerType;
  connectorName?: string;
  eventType?: string;
  schedule?: string; // cron format
  description?: string;
}

export interface WorkflowCondition {
  id: string;
  operator: ConditionOperator;
  left: string; // path: $.step.field
  right?: string;
  conditions?: WorkflowCondition[]; // for and/or
}

export interface WorkflowTransform {
  id: string;
  type: 'map' | 'filter' | 'reduce' | 'template' | 'script';
  input: string; // JSONPath
  output: string; // variable name
  config?: Record<string, any>;
}

export interface WorkflowStep {
  id: string;
  type: NodeType;
  name: string;
  description?: string;
  
  // Connector binding
  connectorName?: string;
  actionId?: string;
  
  // Condition (for decision nodes)
  condition?: WorkflowCondition;
  
  // Transform
  transform?: WorkflowTransform;
  
  // Approval configuration
  approverId?: string;
  approvalRequired?: boolean;
  approvalTimeout?: number; // ms
  
  // Queue/delay
  delayMs?: number;
  
  // Inputs/outputs
  inputMapping?: Record<string, string>; // from previous step
  outputVariable?: string;
  
  // Safety
  runInPreview?: boolean; // default true
  requiresApproval?: boolean;
  requiresQueue?: boolean;
  riskLevel?: 'low' | 'medium' | 'high';
  
  metadata?: Record<string, any>;
}

export interface WorkflowEdge {
  id: string;
  from: string; // step ID
  to: string; // step ID
  type: EdgeType;
  condition?: WorkflowCondition;
  metadata?: Record<string, any>;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  
  // Structure
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  edges: WorkflowEdge[];
  
  // Metadata
  creator: string;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  
  // Safety
  requiresApprovalAtStart?: boolean;
  requiresApprovalBeforeExecution?: boolean;
  maxRetries?: number;
  timeoutMs?: number;
  
  // Configuration
  previewMode?: boolean; // default true
  enableAudit?: boolean; // default true
  enableNotifications?: boolean;
  
  metadata?: Record<string, any>;
}

export interface WorkflowVersion {
  id: string;
  workflowId: string;
  definition: WorkflowDefinition;
  versionNumber: number;
  status: 'draft' | 'published' | 'archived';
  createdAt: Date;
  createdBy: string;
  changelog?: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowVersionNumber: number;
  state: WorkflowState;
  
  // Trigger data
  triggerData: Record<string, any>;
  triggeredAt: Date;
  triggeredBy: string;
  
  // Execution
  startedAt?: Date;
  completedAt?: Date;
  currentStepId?: string;
  stepStates: Record<string, StepExecutionState>;
  
  // Preview
  isPreview: boolean;
  previewOutputs: Record<string, any>;
  
  // Approval
  pendingApprovals: ApprovalCheckpoint[];
  
  // Queue
  queuedItems: QueuedWorkflowItem[];
  
  // Results
  result?: Record<string, any>;
  error?: string;
  
  // Audit
  auditEvents: WorkflowAuditEvent[];
  
  metadata?: Record<string, any>;
}

export interface StepExecutionState {
  stepId: string;
  state: 'pending' | 'running' | 'waiting_approval' | 'approved' | 'rejected' | 'queued' | 'completed' | 'failed' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  output?: any;
  error?: string;
  approval?: ApprovalCheckpoint;
  queueItem?: QueuedWorkflowItem;
}

export interface ApprovalCheckpoint {
  id: string;
  executionId: string;
  stepId: string;
  requiredApprovalLevel: 'low' | 'medium' | 'high';
  approverId?: string;
  requestedAt: Date;
  decidedAt?: Date;
  decision?: 'approved' | 'rejected';
  reason?: string;
  timeoutAt?: Date;
  metadata?: Record<string, any>;
}

export interface QueuedWorkflowItem {
  id: string;
  executionId: string;
  stepId: string;
  connectorName: string;
  actionId: string;
  queuedAt: Date;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  maxRetries: number;
  retryCount: number;
  lastError?: string;
  executeAfter?: Date;
  metadata?: Record<string, any>;
}

export interface WorkflowAuditEvent {
  id: string;
  executionId: string;
  eventType:
    | 'workflow_started'
    | 'workflow_completed'
    | 'workflow_failed'
    | 'step_started'
    | 'step_completed'
    | 'step_failed'
    | 'approval_requested'
    | 'approval_decided'
    | 'queued'
    | 'executed'
    | 'error';
  stepId?: string;
  actor: string;
  timestamp: Date;
  details: Record<string, any>;
  severity: 'info' | 'warning' | 'error';
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  
  // Template definition
  baseWorkflow: WorkflowDefinition;
  
  // Customization points
  parameters?: TemplateParameter[];
  
  // Metadata
  createdAt: Date;
  createdBy: string;
  downloads: number;
  rating?: number;
  tags?: string[];
  
  // Documentation
  documentation?: string;
  exampleScenarios?: string[];
}

export interface TemplateParameter {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'connector_selector' | 'action_selector';
  description: string;
  required: boolean;
  defaultValue?: any;
  validation?: ParameterValidation;
}

export interface ParameterValidation {
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  allowedValues?: any[];
}

export interface WorkflowValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  safetyScore: number; // 0-100
  readinessScore: number; // 0-100
  connectorCoverage: number; // 0-100
  approvalCoverage: number; // 0-100
  metrics?: WorkflowMetrics;
}

export interface ValidationError {
  code: string;
  message: string;
  location?: string; // step ID or edge ID
  severity: 'critical' | 'error';
}

export interface ValidationWarning {
  code: string;
  message: string;
  location?: string;
  suggestion?: string;
}

export interface WorkflowMetrics {
  nodeCount: number;
  edgeCount: number;
  connectorCount: number;
  approvalPointCount: number;
  queuePointCount: number;
  estimatedExecutionTime?: number; // ms
  cycleCount: number;
  orphanNodeCount: number;
}
