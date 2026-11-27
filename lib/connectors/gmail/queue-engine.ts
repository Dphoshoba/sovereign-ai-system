/**
 * Queue Engine
 * Manages execution queue for approved drafts
 */

import {
  QueuedDraft,
  QueueRequest,
  QueueResponse,
  CancelRequest,
  RetryRequest,
  QueueEvent,
  QueueEventLog,
  QueueMetrics,
  QueueHealth,
  QueueFilter,
  QueueQueryResult,
  QueueStats,
  AuditEvent,
  ExecutionState,
  QueuePriority,
  DEFAULT_QUEUE_CONFIG,
  QueueConfig,
} from '../../../src/lib/approval-queue/types';

export class QueueEngine {
  private queue: Map<string, QueuedDraft> = new Map();
  private events: Map<string, QueueEvent[]> = new Map();
  private auditLog: AuditEvent[] = [];
  private config: QueueConfig;

  constructor(config: Partial<QueueConfig> = {}) {
    this.config = { ...DEFAULT_QUEUE_CONFIG, ...config };
  }

  /**
   * Queue approved draft for execution
   */
  queueDraft(request: QueueRequest): QueueResponse {
    try {
      if (!request.draftId || !request.previewId || !request.approvalId) {
        return {
          success: false,
          error: 'Invalid queue request: missing required fields',
        };
      }

      const queuedDraftId = `queued_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const queued: QueuedDraft = {
        id: queuedDraftId,
        draftId: request.draftId,
        previewId: request.previewId,
        approvalId: request.approvalId,
        priority: request.priority || this.config.defaultPriority,
        executionState: 'waiting',
        createdAt: new Date(),
        scheduledTime: request.scheduledTime,
        retryCount: 0,
        maxRetries: this.config.maxRetries,
      };

      this.queue.set(queuedDraftId, queued);
      this.recordEvent(queuedDraftId, request.draftId, 'queued', 'waiting', request.operator);
      this.recordAudit('draft_queued', queuedDraftId, request.draftId, request.operator, 'waiting');

      return {
        success: true,
        queued,
        message: 'Draft queued for execution',
      };
    } catch (error) {
      return {
        success: false,
        error: `Queueing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Start execution of queued draft
   */
  startExecution(queuedDraftId: string, operator: string = 'system'): QueueResponse {
    const queued = this.queue.get(queuedDraftId);
    if (!queued) {
      return {
        success: false,
        error: 'Queued draft not found',
      };
    }

    if (queued.executionState !== 'scheduled' && queued.executionState !== 'waiting') {
      return {
        success: false,
        error: `Cannot start execution from state: ${queued.executionState}`,
      };
    }

    queued.executionState = 'running';
    queued.startedAt = new Date();

    this.recordEvent(queuedDraftId, queued.draftId, 'started', 'running', operator);
    this.recordAudit('queue_started', queuedDraftId, queued.draftId, operator, 'running', 'scheduled');

    return {
      success: true,
      queued,
      message: 'Execution started',
    };
  }

  /**
   * Mark queued draft as completed
   */
  completeExecution(queuedDraftId: string, operator: string = 'system'): QueueResponse {
    const queued = this.queue.get(queuedDraftId);
    if (!queued) {
      return {
        success: false,
        error: 'Queued draft not found',
      };
    }

    if (queued.executionState !== 'running') {
      return {
        success: false,
        error: 'Can only complete a running execution',
      };
    }

    queued.executionState = 'completed';
    queued.completedAt = new Date();

    this.recordEvent(queuedDraftId, queued.draftId, 'completed', 'completed', operator);
    this.recordAudit('queue_completed', queuedDraftId, queued.draftId, operator, 'completed', 'running');

    return {
      success: true,
      queued,
      message: 'Execution completed',
    };
  }

  /**
   * Mark execution as failed with retry logic
   */
  failExecution(queuedDraftId: string, error: string, operator: string = 'system'): QueueResponse {
    const queued = this.queue.get(queuedDraftId);
    if (!queued) {
      return {
        success: false,
        error: 'Queued draft not found',
      };
    }

    queued.lastError = error;
    queued.retryCount++;

    if (queued.retryCount <= queued.maxRetries) {
      queued.executionState = 'waiting'; // Will be retried
      this.recordEvent(queuedDraftId, queued.draftId, 'retry', 'waiting', operator, {
        error,
        retryAttempt: queued.retryCount,
      });
      this.recordAudit('queue_retried', queuedDraftId, queued.draftId, operator, 'waiting', 'failed', error);
      return {
        success: true,
        queued,
        message: `Execution failed, will retry (attempt ${queued.retryCount}/${queued.maxRetries})`,
      };
    } else {
      queued.executionState = 'failed';
      this.recordEvent(queuedDraftId, queued.draftId, 'failed', 'failed', operator, { error });
      this.recordAudit('queue_failed', queuedDraftId, queued.draftId, operator, 'failed', 'running', error);
      return {
        success: true,
        queued,
        message: `Execution failed after ${queued.maxRetries} retries`,
      };
    }
  }

  /**
   * Cancel queued draft
   */
  cancel(request: CancelRequest): QueueResponse {
    // Find the queued draft by draftId or search all
    let found: QueuedDraft | undefined;
    for (const queued of this.queue.values()) {
      if (queued.id === request.queuedDraftId) {
        found = queued;
        break;
      }
    }

    if (!found) {
      return {
        success: false,
        error: 'Queued draft not found',
      };
    }

    if (found.executionState === 'completed' || found.executionState === 'failed') {
      return {
        success: false,
        error: `Cannot cancel ${found.executionState} execution`,
      };
    }

    found.executionState = 'cancelled';
    found.cancelledAt = new Date();

    this.recordEvent(
      request.queuedDraftId,
      found.draftId,
      'cancelled',
      'cancelled',
      request.operator,
      { reason: request.reason }
    );
    this.recordAudit('queue_cancelled', request.queuedDraftId, found.draftId, request.operator, 'cancelled', undefined, request.reason);

    return {
      success: true,
      queued: found,
      message: 'Execution cancelled',
    };
  }

  /**
   * Schedule draft for future execution
   */
  schedule(queuedDraftId: string, scheduledTime: Date, operator: string = 'system'): QueueResponse {
    const queued = this.queue.get(queuedDraftId);
    if (!queued) {
      return {
        success: false,
        error: 'Queued draft not found',
      };
    }

    if (scheduledTime < new Date()) {
      return {
        success: false,
        error: 'Scheduled time must be in the future',
      };
    }

    queued.scheduledTime = scheduledTime;
    queued.executionState = 'scheduled';

    this.recordEvent(queuedDraftId, queued.draftId, 'scheduled', 'scheduled', operator, {
      scheduledTime: scheduledTime.toISOString(),
    });

    return {
      success: true,
      queued,
      message: 'Draft scheduled',
    };
  }

  /**
   * Get queued draft
   */
  getQueued(queuedDraftId: string): QueuedDraft | undefined {
    return this.queue.get(queuedDraftId);
  }

  /**
   * Query queue with filters
   */
  query(filter: QueueFilter): QueueQueryResult {
    let items = Array.from(this.queue.values());

    // Apply filters
    if (filter.executionState?.length) {
      items = items.filter(q => filter.executionState!.includes(q.executionState));
    }
    if (filter.priority?.length) {
      items = items.filter(q => filter.priority!.includes(q.priority));
    }
    if (filter.createdAfter) {
      items = items.filter(q => q.createdAt >= filter.createdAfter!);
    }
    if (filter.createdBefore) {
      items = items.filter(q => q.createdAt <= filter.createdBefore!);
    }

    // Pagination
    const offset = filter.offset || 0;
    const limit = filter.limit || 50;
    const paginated = items.slice(offset, offset + limit);

    return {
      items: paginated.map(queued => ({
        queued,
        draft: {} as any,
        preview: {} as any,
        approval: {} as any,
      })),
      total: items.length,
      limit,
      offset,
    };
  }

  /**
   * Get queue metrics
   */
  getMetrics(): QueueMetrics {
    const items = Array.from(this.queue.values());

    const waiting = items.filter(q => q.executionState === 'waiting').length;
    const scheduled = items.filter(q => q.executionState === 'scheduled').length;
    const running = items.filter(q => q.executionState === 'running').length;
    const completed = items.filter(q => q.executionState === 'completed').length;
    const failed = items.filter(q => q.executionState === 'failed').length;
    const cancelled = items.filter(q => q.executionState === 'cancelled').length;

    // Calculate average wait time
    const completedItems = items.filter(q => q.completedAt && q.createdAt);
    const avgWaitTime =
      completedItems.length > 0
        ? completedItems.reduce((sum, q) => sum + (q.completedAt!.getTime() - q.createdAt.getTime()), 0) / completedItems.length / 1000
        : 0;

    // Calculate average execution time
    const executedItems = completedItems.filter(q => q.startedAt);
    const avgExecutionTime =
      executedItems.length > 0
        ? executedItems.reduce((sum, q) => sum + (q.completedAt!.getTime() - q.startedAt!.getTime()), 0) / executedItems.length / 1000
        : 0;

    return {
      totalQueued: items.length,
      waiting,
      scheduled,
      running,
      completed,
      failed,
      cancelled,
      averageWaitTime: avgWaitTime,
      averageExecutionTime: avgExecutionTime,
      failureRate: items.length > 0 ? (failed / items.length) * 100 : 0,
      retryRate: items.length > 0 ? (items.filter(q => q.retryCount > 0).length / items.length) * 100 : 0,
      oldestItem: items.reduce((oldest, q) => (q.createdAt < oldest ? q.createdAt : oldest), new Date()),
      timestamp: new Date(),
    };
  }

  /**
   * Get queue health
   */
  getHealth(): QueueHealth {
    const metrics = this.getMetrics();
    let score = 100;
    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';

    // Deduct points for backlog
    const backlog = metrics.waiting + metrics.scheduled;
    score -= Math.min(30, backlog / 10);

    // Deduct points for failures
    if (metrics.failureRate > 10) score -= 20;
    if (metrics.failureRate > 25) score -= 30;

    // Deduct points for high retry rate
    if (metrics.retryRate > 15) score -= 15;

    // Determine status
    if (score >= 80) {
      status = 'healthy';
    } else if (score >= 50) {
      status = 'degraded';
    } else {
      status = 'critical';
    }

    return {
      status,
      score: Math.max(0, score),
      message: this.getHealthMessage(status, backlog, metrics.failureRate),
      backlog,
      avgProcessTime: metrics.averageExecutionTime,
      failureCount: metrics.failed,
      retryCount: metrics.waiting,
    };
  }

  /**
   * Get health message
   */
  private getHealthMessage(status: string, backlog: number, failureRate: number): string {
    if (status === 'healthy') return 'Queue operating normally';
    if (status === 'degraded') {
      if (backlog > 500) return 'High queue backlog detected';
      if (failureRate > 10) return 'Elevated failure rate detected';
      return 'Queue performance degraded';
    }
    return 'Critical queue issues - manual intervention required';
  }

  /**
   * Record queue event
   */
  private recordEvent(
    queuedDraftId: string,
    draftId: string,
    eventType: 'queued' | 'scheduled' | 'started' | 'completed' | 'failed' | 'cancelled' | 'retry',
    state: ExecutionState,
    operator?: string,
    details?: Record<string, any>
  ): void {
    const event: QueueEvent = {
      id: `event_${Date.now()}`,
      queuedDraftId,
      draftId,
      eventType,
      timestamp: new Date(),
      state,
      operator,
      details,
    };

    if (!this.events.has(queuedDraftId)) {
      this.events.set(queuedDraftId, []);
    }
    this.events.get(queuedDraftId)!.push(event);
  }

  /**
   * Record audit event
   */
  private recordAudit(
    eventType: 'draft_queued' | 'queue_started' | 'queue_completed' | 'queue_failed' | 'queue_cancelled' | 'queue_retried',
    queuedDraftId: string,
    draftId: string,
    operator: string,
    newState?: ExecutionState,
    oldState?: ExecutionState,
    reason?: string
  ): void {
    const event: AuditEvent = {
      id: `audit_${Date.now()}`,
      queuedDraftId,
      draftId,
      eventType,
      timestamp: new Date(),
      operator,
      newState,
      oldState,
      reason,
    };
    this.auditLog.push(event);
  }

  /**
   * Get event log
   */
  getEventLog(queuedDraftId: string): QueueEventLog | undefined {
    const events = this.events.get(queuedDraftId);
    if (!events) return undefined;
    return {
      queuedDraftId,
      events,
      lastEvent: events[events.length - 1],
    };
  }

  /**
   * Clear queue (for testing)
   */
  clear(): void {
    this.queue.clear();
    this.events.clear();
    this.auditLog = [];
  }
}
