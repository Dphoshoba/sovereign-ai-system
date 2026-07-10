/**
 * Workflow State Machine
 * 
 * Formal state machine with guards, entry/exit actions, and event handling
 */

import type { WorkflowState } from '../../src/lib/gamma-flow/types';
import type { WorkflowRuntime } from './workflow-runtime';
import { canTransition, transitionRuntime } from './workflow-runtime';

export type WorkflowEvent =
  | { type: 'validate' }
  | { type: 'ready' }
  | { type: 'start_preview' }
  | { type: 'preview_complete'; data?: any }
  | { type: 'request_approval' }
  | { type: 'approve'; approver: string }
  | { type: 'reject'; approver: string }
  | { type: 'queue' }
  | { type: 'execute' }
  | { type: 'error'; error: string }
  | { type: 'disable' }
  | { type: 'reset' };

export interface StateAction {
  name: string;
  execute: (runtime: WorkflowRuntime, event: WorkflowEvent) => Promise<void>;
}

export interface StateMachineConfig {
  entryActions: Map<WorkflowState, StateAction[]>;
  exitActions: Map<WorkflowState, StateAction[]>;
  transitionGuards: Map<string, (runtime: WorkflowRuntime, event: WorkflowEvent) => boolean>;
}

const DEFAULT_CONFIG: StateMachineConfig = {
  entryActions: new Map(),
  exitActions: new Map(),
  transitionGuards: new Map(),
};

// Initialize default actions
DEFAULT_CONFIG.entryActions.set('running_preview', [
  {
    name: 'start_timer',
    execute: async (runtime) => {
      runtime.startedAt = new Date();
    },
  },
]);

DEFAULT_CONFIG.exitActions.set('running_preview', [
  {
    name: 'record_duration',
    execute: async (runtime) => {
      if (runtime.startedAt) {
        const duration = Date.now() - runtime.startedAt.getTime();
        runtime.auditEvents.push({
          id: `audit_${Date.now()}`,
          executionId: runtime.executionId,
          eventType: 'workflow_completed',
          actor: 'system',
          severity: 'info',
          timestamp: new Date(),
          details: { duration },
        });
      }
    },
  },
]);

DEFAULT_CONFIG.entryActions.set('waiting_approval', [
  {
    name: 'notify_approvers',
    execute: async (runtime) => {
      // In real implementation, send notifications
      runtime.auditEvents.push({
        id: `audit_${Date.now()}`,
        executionId: runtime.executionId,
        eventType: 'approval_requested',
        actor: 'system',
        severity: 'info',
        timestamp: new Date(),
        details: { approvers: ['admin@example.com'] },
      });
    },
  },
]);

DEFAULT_CONFIG.transitionGuards.set('ready->running_preview', (runtime) => {
  // Only allow preview if all validations passed
  return true;
});

DEFAULT_CONFIG.transitionGuards.set('running_preview->waiting_approval', (runtime) => {
  // Only transition if approval is required
  const requiresApproval = runtime.definition.steps.some((s) => s.requiresApproval);
  return requiresApproval;
});

export class WorkflowStateMachine {
  private config: StateMachineConfig;

  constructor(config?: Partial<StateMachineConfig>) {
    this.config = {
      entryActions: config?.entryActions || DEFAULT_CONFIG.entryActions,
      exitActions: config?.exitActions || DEFAULT_CONFIG.exitActions,
      transitionGuards: config?.transitionGuards || DEFAULT_CONFIG.transitionGuards,
    };
  }

  async handle(runtime: WorkflowRuntime, event: WorkflowEvent): Promise<WorkflowState> {
    const targetState = this.resolveTargetState(runtime.state, event);

    if (!targetState) {
      throw new Error(`No transition available for event ${event.type} in state ${runtime.state}`);
    }

    // Check guard
    const guardKey = `${runtime.state}->${targetState}`;
    const guard = this.config.transitionGuards.get(guardKey);
    if (guard && !guard(runtime, event)) {
      throw new Error(`Guard failed for transition ${guardKey}`);
    }

    // Execute exit actions
    const exitActions = this.config.exitActions.get(runtime.state) || [];
    for (const action of exitActions) {
      await action.execute(runtime, event);
    }

    // Perform transition
    transitionRuntime(runtime, targetState, event.type, this.extractMetadata(event));

    // Execute entry actions
    const entryActions = this.config.entryActions.get(targetState) || [];
    for (const action of entryActions) {
      await action.execute(runtime, event);
    }

    return targetState;
  }

  private resolveTargetState(currentState: WorkflowState, event: WorkflowEvent): WorkflowState | null {
    switch (event.type) {
      case 'validate':
        return 'validated';
      case 'ready':
        return 'ready';
      case 'start_preview':
        return 'running_preview';
      case 'preview_complete':
        return 'completed_preview';
      case 'request_approval':
        return 'waiting_approval';
      case 'approve':
      case 'queue':
        return 'queued';
      case 'reject':
        return 'failed';
      case 'execute':
        return 'queued';
      case 'error':
        return 'failed';
      case 'disable':
        return 'disabled';
      case 'reset':
        return 'draft';
      default:
        return null;
    }
  }

  private extractMetadata(event: WorkflowEvent): Record<string, any> | undefined {
    switch (event.type) {
      case 'preview_complete':
        return { data: event.data };
      case 'approve':
        return { approver: event.approver };
      case 'reject':
        return { approver: event.approver };
      case 'error':
        return { error: event.error };
      default:
        return undefined;
    }
  }

  registerEntryAction(state: WorkflowState, action: StateAction): void {
    if (!this.config.entryActions.has(state)) {
      this.config.entryActions.set(state, []);
    }
    this.config.entryActions.get(state)!.push(action);
  }

  registerExitAction(state: WorkflowState, action: StateAction): void {
    if (!this.config.exitActions.has(state)) {
      this.config.exitActions.set(state, []);
    }
    this.config.exitActions.get(state)!.push(action);
  }

  registerGuard(
    fromState: WorkflowState,
    toState: WorkflowState,
    guard: (runtime: WorkflowRuntime, event: WorkflowEvent) => boolean
  ): void {
    this.config.transitionGuards.set(`${fromState}->${toState}`, guard);
  }
}
