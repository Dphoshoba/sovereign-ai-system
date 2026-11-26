import {
  AdaptiveScheduler,
  QueueEntry,
  QueueState,
  SchedulingDecision,
  SchedulingOptions,
  SchedulingPolicy,
  SchedulingResult,
  WorkflowSchedulingInput,
} from "./adaptive-scheduler";

export class AdaptiveSchedulerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AdaptiveSchedulerError';
  }
}

// ── Mutable state for the scheduling cycle ──

interface SchedulingCycleState {
  entries: MutableQueueEntry[];
  decisions: SchedulingDecision[];
  executionOrder: string[];
  maxConcurrent: number;
  policy: SchedulingPolicy;
  weights: Readonly<Record<string, number>> | null;
}

interface MutableQueueEntry {
  executionId: string;
  workflowId: string;
  priority: number;
  deadlineMs: number | null;
  serviceClass: string;
  businessImportance: number;
  estimatedDurationMs: number;
  dependsOn: readonly string[];
  submittedAt: number;
  state: QueueState;
}

// ── Implementation ──

export class AdaptiveSchedulerImpl implements AdaptiveScheduler {
  schedule(
    workflows: readonly WorkflowSchedulingInput[],
    options: SchedulingOptions,
  ): SchedulingResult {
    if (workflows.length === 0) {
      throw new AdaptiveSchedulerError('Cannot schedule empty workflow set');
    }

    if (options.maxConcurrentWorkflows < 1) {
      throw new AdaptiveSchedulerError('maxConcurrentWorkflows must be at least 1');
    }

    if (options.policy === 'weighted_fair' && !options.weights) {
      throw new AdaptiveSchedulerError('weighted_fair policy requires weights');
    }

    const state: SchedulingCycleState = {
      entries: workflows.map((w) => ({
        executionId: w.executionId,
        workflowId: w.workflowId,
        priority: w.priority,
        deadlineMs: w.deadlineMs,
        serviceClass: w.serviceClass,
        businessImportance: w.businessImportance,
        estimatedDurationMs: w.estimatedDurationMs,
        dependsOn: w.dependsOn,
        submittedAt: w.submittedAt,
        state: w.dependsOn.length > 0 ? 'blocked' : 'ready' as QueueState,
      })),
      decisions: [],
      executionOrder: [],
      maxConcurrent: options.maxConcurrentWorkflows,
      policy: options.policy,
      weights: options.weights,
    };

    // Initial decisions for initial queue states
    for (const entry of state.entries) {
      state.decisions.push({
        executionId: entry.executionId,
        workflowId: entry.workflowId,
        fromState: 'ready' as QueueState,
        toState: entry.state,
        policy: options.policy,
        reason: entry.state === 'blocked'
          ? `Blocked by dependencies: ${entry.dependsOn.join(', ')}`
          : 'Ready for scheduling',
      });
    }

    // Scheduling loop
    while (!allCompleted(state.entries)) {
      // Move blocked -> ready if dependencies completed
      this.processBlockedWorkflows(state);

      // Move ready -> running based on policy and resource limits
      this.scheduleReadyWorkflows(state);

      // Complete one running workflow
      if (this.hasRunningWorkflows(state)) {
        this.completeNextWorkflow(state);
      } else if (!allCompleted(state.entries)) {
        // Deadlock: all remaining are blocked but no running workflows
        throw new AdaptiveSchedulerError(
          'Scheduling deadlock: all remaining workflows are blocked',
        );
      }
    }

    return {
      executionOrder: [...state.executionOrder],
      decisions: [...state.decisions],
      queue: this.buildQueue(state),
    };
  }

  // ── Blocked → Ready ──

  private processBlockedWorkflows(state: SchedulingCycleState): void {
    for (const entry of state.entries) {
      if (entry.state !== 'blocked') continue;

      const allDepsCompleted = entry.dependsOn.every((depId) =>
        state.executionOrder.includes(depId),
      );

      if (allDepsCompleted) {
        entry.state = 'ready';
        state.decisions.push({
          executionId: entry.executionId,
          workflowId: entry.workflowId,
          fromState: 'blocked',
          toState: 'ready',
          policy: state.policy,
          reason: 'Dependencies satisfied',
        });
      }
    }
  }

  // ── Ready → Running ──

  private scheduleReadyWorkflows(state: SchedulingCycleState): void {
    const readyCount = state.entries.filter((e) => e.state === 'ready').length;
    const runningCount = state.entries.filter((e) => e.state === 'running').length;
    const availableSlots = state.maxConcurrent - runningCount;

    if (availableSlots <= 0 || readyCount === 0) return;

    const readyEntries = state.entries
      .filter((e) => e.state === 'ready')
      .sort((a, b) => this.compareByPolicy(a, b, state));

    const toRun = readyEntries.slice(0, Math.min(availableSlots, readyCount));

    for (const entry of toRun) {
      entry.state = 'running';
      state.decisions.push({
        executionId: entry.executionId,
        workflowId: entry.workflowId,
        fromState: 'ready',
        toState: 'running',
        policy: state.policy,
        reason: this.runningReason(entry, state),
      });
    }
  }

  // ── Running → Completed ──

  private completeNextWorkflow(state: SchedulingCycleState): void {
    const running = state.entries
      .filter((e) => e.state === 'running')
      .sort((a, b) => this.compareByPolicy(a, b, state));

    if (running.length === 0) return;

    const toComplete = running[0];
    toComplete.state = 'completed';
    state.executionOrder.push(toComplete.executionId);
    state.decisions.push({
      executionId: toComplete.executionId,
      workflowId: toComplete.workflowId,
      fromState: 'running',
      toState: 'completed',
      policy: state.policy,
      reason: 'Execution completed',
    });
  }

  // ── Policy Comparison ──

  private compareByPolicy(
    a: MutableQueueEntry,
    b: MutableQueueEntry,
    state: SchedulingCycleState,
  ): number {
    switch (state.policy) {
      case 'fifo':
        return a.submittedAt - b.submittedAt;

      case 'priority_first':
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.submittedAt - b.submittedAt;

      case 'deadline_aware': {
        const aUrgency = this.urgency(a);
        const bUrgency = this.urgency(b);
        if (aUrgency !== bUrgency) return aUrgency - bUrgency;
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.submittedAt - b.submittedAt;
      }

      case 'weighted_fair': {
        const aWeight = state.weights![a.serviceClass] ?? 1;
        const bWeight = state.weights![b.serviceClass] ?? 1;
        const aScore = a.businessImportance * aWeight;
        const bScore = b.businessImportance * bWeight;
        if (bScore !== aScore) return bScore - aScore; // higher score first
        return a.submittedAt - b.submittedAt;
      }
    }
  }

  private urgency(entry: MutableQueueEntry): number {
    if (entry.deadlineMs === null) return Infinity;
    return entry.deadlineMs - entry.submittedAt - entry.estimatedDurationMs;
  }

  // ── Helpers ──

  private runningReason(entry: MutableQueueEntry, state: SchedulingCycleState): string {
    return `Scheduled via ${state.policy} (priority=${entry.priority}, class=${entry.serviceClass})`;
  }

  private hasRunningWorkflows(state: SchedulingCycleState): boolean {
    return state.entries.some((e) => e.state === 'running');
  }

  private buildQueue(state: SchedulingCycleState): SchedulingResult['queue'] {
    const toQueueEntry = (e: MutableQueueEntry): QueueEntry => ({
      executionId: e.executionId,
      workflowId: e.workflowId,
      priority: e.priority,
      serviceClass: e.serviceClass,
      businessImportance: e.businessImportance,
      deadlineMs: e.deadlineMs,
      state: e.state,
      submittedAt: e.submittedAt,
      estimatedDurationMs: e.estimatedDurationMs,
      dependsOn: [...e.dependsOn],
    });

    const ready = state.entries.filter((e) => e.state === 'ready').map(toQueueEntry);
    const blocked = state.entries.filter((e) => e.state === 'blocked').map(toQueueEntry);
    const running = state.entries.filter((e) => e.state === 'running').map(toQueueEntry);
    const completed = state.entries.filter((e) => e.state === 'completed').map(toQueueEntry);

    return {
      ready,
      blocked,
      running,
      completed,
      utilization: {
        totalSlots: state.maxConcurrent,
        usedSlots: running.length,
        availableSlots: state.maxConcurrent - running.length,
      },
    };
  }
}

function allCompleted(entries: readonly MutableQueueEntry[]): boolean {
  return entries.every((e) => e.state === 'completed');
}
