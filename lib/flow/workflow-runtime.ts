/**
 * Workflow Runtime
 * 
 * Manages execution lifecycle and state transitions for live workflows
 */

import type { WorkflowDefinition, WorkflowExecution, WorkflowState, WorkflowAuditEvent } from '../../src/lib/gamma-flow/types';
import { buildExecutionPlan, type ExecutionContext } from './execution-plan-builder';

export interface WorkflowRuntime {
  executionId: string;
  definition: WorkflowDefinition;
  state: WorkflowState;
  context: ExecutionContext;
  auditEvents: WorkflowAuditEvent[];
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface RuntimeTransition {
  fromState: WorkflowState;
  toState: WorkflowState;
  trigger: string;
  metadata?: Record<string, any>;
}

const VALID_TRANSITIONS: Record<WorkflowState, WorkflowState[]> = {
  draft: ['validated', 'disabled'],
  validated: ['ready', 'draft'],
  ready: ['running_preview', 'queued', 'disabled'],
  running_preview: ['completed_preview', 'failed', 'disabled'],
  waiting_approval: ['queued', 'failed', 'disabled'],
  queued: ['completed_preview', 'failed', 'disabled'],
  completed_preview: ['ready', 'queued', 'disabled'],
  failed: ['draft', 'disabled'],
  disabled: ['draft'],
};

export function createRuntime(
  definition: WorkflowDefinition,
  executionId: string,
  initialState: WorkflowState = 'ready'
): WorkflowRuntime {
  const plan = buildExecutionPlan(definition, executionId);

  return {
    executionId,
    definition,
    state: initialState,
    context: plan.context,
    auditEvents: [],
    createdAt: new Date(),
  };
}

export function canTransition(from: WorkflowState, to: WorkflowState): boolean {
  const allowed = VALID_TRANSITIONS[from] || [];
  return allowed.includes(to);
}

export function transitionRuntime(
  runtime: WorkflowRuntime,
  toState: WorkflowState,
  trigger: string,
  metadata?: Record<string, any>
): RuntimeTransition {
  if (!canTransition(runtime.state, toState)) {
    throw new Error(
      `Invalid transition: ${runtime.state} -> ${toState} (trigger: ${trigger})`
    );
  }

  const transition: RuntimeTransition = {
    fromState: runtime.state,
    toState,
    trigger,
    metadata,
  };

  // Update state
  runtime.state = toState;

  // Record transition in audit
  const auditEvent: WorkflowAuditEvent = {
    id: `audit_${Date.now()}`,
    executionId: runtime.executionId,
    eventType: 'workflow_started',
    actor: 'system',
    severity: 'info',
    timestamp: new Date(),
    details: {
      from: transition.fromState,
      to: transition.toState,
      trigger: transition.trigger,
      ...metadata,
    },
  };

  runtime.auditEvents.push(auditEvent);

  // Update timestamps
  if (toState === 'running_preview' && !runtime.startedAt) {
    runtime.startedAt = new Date();
  }

  if (
    (toState === 'completed_preview' || toState === 'failed') &&
    !runtime.completedAt
  ) {
    runtime.completedAt = new Date();
  }

  return transition;
}

export function recordStepExecution(
  runtime: WorkflowRuntime,
  stepId: string,
  result: {
    success: boolean;
    duration: number;
    output?: any;
    error?: string;
  }
): void {
  const auditEvent: WorkflowAuditEvent = {
    id: `audit_${Date.now()}`,
    executionId: runtime.executionId,
    eventType: result.success ? 'step_completed' : 'step_failed',
    stepId,
    actor: 'system',
    severity: result.success ? 'info' : 'error',
    timestamp: new Date(),
    details: {
      duration: result.duration,
      error: result.error,
    },
  };

  runtime.auditEvents.push(auditEvent);

  // Update context
  runtime.context.stepStates[stepId] = result.success ? 'completed' : 'failed';
  runtime.context.lastUpdate = new Date();
}

export function recordApprovalDecision(
  runtime: WorkflowRuntime,
  stepId: string,
  approved: boolean,
  approver: string
): void {
  runtime.context.approvalDecisions[stepId] = approved;

  const auditEvent: WorkflowAuditEvent = {
    id: `audit_${Date.now()}`,
    executionId: runtime.executionId,
    eventType: 'approval_decided',
    stepId,
    actor: approver,
    severity: 'info',
    timestamp: new Date(),
    details: {
      approved,
    },
  };

  runtime.auditEvents.push(auditEvent);

  // Transition to next state
  if (approved) {
    transitionRuntime(runtime, 'queued', 'approval_granted', { stepId, approver });
  } else {
    transitionRuntime(runtime, 'failed', 'approval_rejected', { stepId, approver });
  }
}

export function recordQueueEntry(
  runtime: WorkflowRuntime,
  queuedItems: string[]
): void {
  runtime.context.queuedItems = [...runtime.context.queuedItems, ...queuedItems];

  const auditEvent: WorkflowAuditEvent = {
    id: `audit_${Date.now()}`,
    executionId: runtime.executionId,
    eventType: 'queued',
    actor: 'system',
    severity: 'info',
    timestamp: new Date(),
    details: {
      queueSize: runtime.context.queuedItems.length,
      newItems: queuedItems.length,
    },
  };

  runtime.auditEvents.push(auditEvent);
}

export function getExecutionStats(runtime: WorkflowRuntime): {
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  pendingSteps: number;
  executionTime?: number;
} {
  const stepStates = runtime.context.stepStates;
  const states = Object.values(stepStates);

  const totalSteps = states.length;
  const completedSteps = states.filter(s => s === 'completed').length;
  const failedSteps = states.filter(s => s === 'failed').length;
  const pendingSteps = states.filter(s => s === 'pending').length;

  let executionTime: number | undefined;
  if (runtime.startedAt && runtime.completedAt) {
    executionTime = runtime.completedAt.getTime() - runtime.startedAt.getTime();
  }

  return {
    totalSteps,
    completedSteps,
    failedSteps,
    pendingSteps,
    executionTime,
  };
}
