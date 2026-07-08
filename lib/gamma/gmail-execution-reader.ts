/**
 * Gmail Execution Reader
 * GAMMA integration for querying execution data
 * Deterministic reader - all time operations require explicit currentTime parameter
 */

import { ExecutionContext, ExecutionState } from '../../src/lib/gmail-execution/types';

export class GmailExecutionReader {
  private executions: Map<string, ExecutionContext> = new Map();

  /**
   * Store execution context
   */
  store(execution: ExecutionContext): void {
    this.executions.set(execution.id, execution);
  }

  /**
   * Get execution by ID
   */
  getById(id: string): ExecutionContext | undefined {
    return this.executions.get(id);
  }

  /**
   * Get all executions in a given state
   */
  getByState(state: ExecutionState): ExecutionContext[] {
    return Array.from(this.executions.values()).filter(e => e.executionState === state);
  }

  /**
   * Get running executions
   */
  getRunning(): ExecutionContext[] {
    return this.getByState('running');
  }

  /**
   * Get completed executions
   */
  getCompleted(): ExecutionContext[] {
    return this.getByState('completed');
  }

  /**
   * Get failed executions
   */
  getFailed(): ExecutionContext[] {
    return this.getByState('failed');
  }

  /**
   * Get dead-lettered executions
   */
  getDeadLettered(): ExecutionContext[] {
    return this.getByState('dead_lettered');
  }

  /**
   * Get cancelled executions
   */
  getCancelled(): ExecutionContext[] {
    return this.getByState('cancelled');
  }

  /**
   * Get executions for a specific draft
   */
  getByDraftId(draftId: string): ExecutionContext[] {
    return Array.from(this.executions.values()).filter(e => e.draftId === draftId);
  }

  /**
   * Get executions for a specific queued draft
   */
  getByQueuedId(queuedId: string): ExecutionContext[] {
    return Array.from(this.executions.values()).filter(e => e.queuedId === queuedId);
  }

  /**
   * Get executions by operator
   */
  getByOperator(operator: string): ExecutionContext[] {
    return Array.from(this.executions.values()).filter(e => e.operator === operator);
  }

  /**
   * Get executions by action type
   */
  getByAction(action: 'create_draft' | 'send'): ExecutionContext[] {
    return Array.from(this.executions.values()).filter(e => e.executeAction === action);
  }

  /**
   * Get overdue executions (waiting/running longer than threshold)
   * @param hoursThreshold Hours to consider overdue
   * @param currentTime Current time for deterministic comparison
   */
  getOverdue(hoursThreshold: number = 24, currentTime: number): ExecutionContext[] {
    const threshold = currentTime - hoursThreshold * 60 * 60 * 1000;
    return Array.from(this.executions.values()).filter(e => {
      if (e.executionState !== 'waiting' && e.executionState !== 'running') {
        return false;
      }
      return e.createdAt.getTime() < threshold;
    });
  }

  /**
   * Get executions with retry scheduled
   */
  getScheduledForRetry(): ExecutionContext[] {
    return Array.from(this.executions.values()).filter(e => e.retryScheduledAt !== undefined);
  }

  /**
   * Get executions by time range
   * @param startTime Start time for filtering
   * @param endTime End time for filtering
   */
  getByTimeRange(startTime: Date, endTime: Date): ExecutionContext[] {
    return Array.from(this.executions.values()).filter(e => e.createdAt >= startTime && e.createdAt <= endTime);
  }

  /**
   * Get metrics for executions
   */
  getMetrics() {
    const executions = Array.from(this.executions.values());
    const states = {
      waiting: executions.filter(e => e.executionState === 'waiting').length,
      running: executions.filter(e => e.executionState === 'running').length,
      completed: executions.filter(e => e.executionState === 'completed').length,
      failed: executions.filter(e => e.executionState === 'failed').length,
      cancelled: executions.filter(e => e.executionState === 'cancelled').length,
      dead_lettered: executions.filter(e => e.executionState === 'dead_lettered').length,
    };

    const successRate = executions.length > 0 ? (states.completed / executions.length) * 100 : 0;
    const failureRate = executions.length > 0 ? ((states.failed + states.dead_lettered) / executions.length) * 100 : 0;

    return {
      total: executions.length,
      ...states,
      successRate,
      failureRate,
    };
  }

  /**
   * Get state distribution
   */
  getStateDistribution() {
    const metrics = this.getMetrics();
    return {
      waiting: metrics.waiting,
      running: metrics.running,
      completed: metrics.completed,
      failed: metrics.failed,
      cancelled: metrics.cancelled,
      dead_lettered: metrics.dead_lettered,
    };
  }

  /**
   * Get health score (0-100)
   * @param currentTime Current time for age calculation
   */
  getHealthScore(currentTime: number): number {
    const metrics = this.getMetrics();
    const backlog = metrics.waiting + metrics.running;
    const failureRate = metrics.failureRate || 0;

    let score = 100;
    score -= Math.min(backlog * 5, 30); // Backlog penalty (max 30)
    score -= Math.min(failureRate * 1.5, 40); // Failure penalty (max 40)

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get success rate percentage
   */
  getSuccessRate(): number {
    const metrics = this.getMetrics();
    return metrics.total > 0 ? (metrics.completed / metrics.total) * 100 : 0;
  }

  /**
   * Get average execution time for completed executions
   */
  getAverageExecutionTime(): number {
    const completed = this.getCompleted();
    if (completed.length === 0) {
      return 0;
    }

    const totalTime = completed.reduce((sum, e) => {
      if (e.startedAt && e.completedAt) {
        return sum + (e.completedAt.getTime() - e.startedAt.getTime());
      }
      return sum;
    }, 0);

    return totalTime / completed.length / 1000; // Return in seconds
  }

  /**
   * Search executions by Gmail message ID
   */
  searchByGmailMessageId(messageId: string): ExecutionContext[] {
    return Array.from(this.executions.values()).filter(e => e.gmailMessageId === messageId);
  }

  /**
   * Get retry statistics
   */
  getRetryStats() {
    const executions = Array.from(this.executions.values());
    const withRetries = executions.filter(e => e.attemptNumber > 1);

    return {
      totalWithRetries: withRetries.length,
      totalRetryAttempts: withRetries.reduce((sum, e) => sum + (e.attemptNumber - 1), 0),
      avgRetriesPerExecution: executions.length > 0 ? withRetries.reduce((sum, e) => sum + (e.attemptNumber - 1), 0) / executions.length : 0,
      maxRetriesReached: withRetries.filter(e => e.attemptNumber >= e.maxRetries).length,
    };
  }

  /**
   * Get error distribution
   */
  getErrorDistribution() {
    const failed = this.getFailed();
    const errors: Record<string, number> = {};

    for (const execution of failed) {
      if (execution.error) {
        const errorType = execution.error.split(':')[0] || 'unknown';
        errors[errorType] = (errors[errorType] || 0) + 1;
      }
    }

    return errors;
  }

  /**
   * Get statistics
   */
  getStats() {
    const metrics = this.getMetrics();
    return {
      totalExecutions: metrics.total,
      completed: metrics.completed,
      failed: metrics.failed,
      cancelled: metrics.cancelled,
      deadLettered: metrics.dead_lettered,
      successRate: metrics.successRate,
      failureRate: metrics.failureRate,
      averageExecutionTime: this.getAverageExecutionTime(),
      retryStats: this.getRetryStats(),
      errorDistribution: this.getErrorDistribution(),
    };
  }
}
