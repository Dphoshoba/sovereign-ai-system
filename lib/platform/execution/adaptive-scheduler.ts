// ── Queue State ──

export type QueueState = 'ready' | 'blocked' | 'running' | 'completed';

// ── Scheduling Policy ──

export type SchedulingPolicy = 'fifo' | 'priority_first' | 'weighted_fair' | 'deadline_aware';

// ── Workflow Scheduling Input ──

export interface WorkflowSchedulingInput {
  readonly workflowId: string;
  readonly executionId: string;
  readonly priority: number;
  readonly deadlineMs: number | null;
  readonly serviceClass: string;
  readonly businessImportance: number;
  readonly estimatedDurationMs: number;
  readonly dependsOn: readonly string[];
  readonly submittedAt: number;
}

// ── Scheduling Options ──

export interface SchedulingOptions {
  readonly policy: SchedulingPolicy;
  readonly maxConcurrentWorkflows: number;
  readonly weights: Readonly<Record<string, number>> | null;
}

// ── Queue Entry ──

export interface QueueEntry {
  readonly executionId: string;
  readonly workflowId: string;
  readonly priority: number;
  readonly serviceClass: string;
  readonly businessImportance: number;
  readonly deadlineMs: number | null;
  readonly state: QueueState;
  readonly submittedAt: number;
  readonly estimatedDurationMs: number;
  readonly dependsOn: readonly string[];
}

// ── Scheduling Decision ──

export interface SchedulingDecision {
  readonly executionId: string;
  readonly workflowId: string;
  readonly fromState: QueueState;
  readonly toState: QueueState;
  readonly policy: SchedulingPolicy;
  readonly reason: string;
}

// ── Resource Utilization ──

export interface ResourceUtilization {
  readonly totalSlots: number;
  readonly usedSlots: number;
  readonly availableSlots: number;
}

// ── Scheduler Queue ──

export interface SchedulerQueue {
  readonly ready: readonly QueueEntry[];
  readonly blocked: readonly QueueEntry[];
  readonly running: readonly QueueEntry[];
  readonly completed: readonly QueueEntry[];
  readonly utilization: ResourceUtilization;
}

// ── Scheduling Result ──

export interface SchedulingResult {
  readonly executionOrder: readonly string[];
  readonly decisions: readonly SchedulingDecision[];
  readonly queue: SchedulerQueue;
}

// ── Adaptive Scheduler ──

export interface AdaptiveScheduler {
  schedule(
    workflows: readonly WorkflowSchedulingInput[],
    options: SchedulingOptions,
  ): SchedulingResult;
}
