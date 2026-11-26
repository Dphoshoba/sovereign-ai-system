/**
 * Approval Queue Reader
 * GAMMA integration for reading and querying execution queue
 */

import { QueuedDraft, QueueEntry, ExecutionState, QueuePriority } from '../../src/lib/approval-queue/types';

export class ApprovalQueueReader {
  private entries: Map<string, QueueEntry> = new Map();

  /**
   * Store queue entry
   */
  store(entry: QueueEntry): void {
    this.entries.set(entry.queued.id, entry);
  }

  /**
   * Get entry by ID
   */
  getById(id: string): QueueEntry | undefined {
    return this.entries.get(id);
  }

  /**
   * Get all entries
   */
  getAll(): QueueEntry[] {
    return Array.from(this.entries.values());
  }

  /**
   * Get entries by state
   */
  getByState(state: ExecutionState): QueueEntry[] {
    return Array.from(this.entries.values()).filter(e => e.queued.executionState === state);
  }

  /**
   * Get all waiting entries
   */
  getWaiting(): QueueEntry[] {
    return this.getByState('waiting');
  }

  /**
   * Get all running entries
   */
  getRunning(): QueueEntry[] {
    return this.getByState('running');
  }

  /**
   * Get all scheduled entries
   */
  getScheduled(): QueueEntry[] {
    return this.getByState('scheduled');
  }

  /**
   * Get entries by priority
   */
  getByPriority(priority: QueuePriority): QueueEntry[] {
    return Array.from(this.entries.values()).filter(e => e.queued.priority === priority);
  }

  /**
   * Get high priority items
   */
  getHighPriority(): QueueEntry[] {
    return Array.from(this.entries.values()).filter(
      e => e.queued.priority === 'critical' || e.queued.priority === 'high'
    );
  }

  /**
   * Get failed entries
   */
  getFailed(): QueueEntry[] {
    return this.getByState('failed');
  }

  /**
   * Get completed entries
   */
  getCompleted(): QueueEntry[] {
    return this.getByState('completed');
  }

  /**
   * Get overdue items (older than X hours)
   * @param hoursThreshold Hours to consider overdue
   * @param currentTime Current time for deterministic comparison
   */
  getOverdue(hoursThreshold: number = 24, currentTime: number): QueueEntry[] {
    const threshold = currentTime - hoursThreshold * 60 * 60 * 1000;
    return Array.from(this.entries.values()).filter(
      e =>
        (e.queued.executionState === 'waiting' || e.queued.executionState === 'scheduled') &&
        e.queued.createdAt.getTime() < threshold
    );
  }

  /**
   * Get entries with retry needed
   */
  getNeedingRetry(): QueueEntry[] {
    return Array.from(this.entries.values()).filter(
      e => e.queued.executionState === 'failed' && e.queued.retryCount < e.queued.maxRetries
    );
  }

  /**
   * Get entries exhausted retries
   */
  getExhaustedRetries(): QueueEntry[] {
    return Array.from(this.entries.values()).filter(
      e => e.queued.executionState === 'failed' && e.queued.retryCount >= e.queued.maxRetries
    );
  }

  /**
   * Search by draft ID
   */
  findByDraftId(draftId: string): QueueEntry | undefined {
    return Array.from(this.entries.values()).find(e => e.queued.draftId === draftId);
  }

  /**
   * Search by recipient email
   */
  findByRecipient(email: string): QueueEntry[] {
    return Array.from(this.entries.values()).filter(e => e.preview.to.includes(email));
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    total: number;
    waiting: number;
    scheduled: number;
    running: number;
    completed: number;
    failed: number;
    cancelled: number;
    avgWaitTime: number;
  } {
    const all = this.getAll();
    const waiting = this.getWaiting().length;
    const scheduled = this.getScheduled().length;
    const running = this.getRunning().length;
    const completed = this.getCompleted().length;
    const failed = this.getFailed().length;
    const cancelled = all.filter(e => e.queued.executionState === 'cancelled').length;

    // Calculate average wait time
    const completedEntries = all.filter(e => e.queued.completedAt && e.queued.startedAt);
    const avgWaitTime =
      completedEntries.length > 0
        ? completedEntries.reduce(
            (sum, e) => sum + (e.queued.completedAt!.getTime() - e.queued.startedAt!.getTime()),
            0
          ) /
          completedEntries.length /
          1000
        : 0;

    return {
      total: all.length,
      waiting,
      scheduled,
      running,
      completed,
      failed,
      cancelled,
      avgWaitTime,
    };
  }

  /**
   * Get health score (0-100)
   */
  getHealthScore(): number {
    const stats = this.getStats();
    let score = 100;

    // Penalize for backlog
    const backlog = stats.waiting + stats.scheduled;
    score -= Math.min(30, backlog / 10);

    // Penalize for failures
    if (stats.total > 0) {
      const failureRate = (stats.failed / stats.total) * 100;
      if (failureRate > 10) score -= 20;
      if (failureRate > 25) score -= 30;
    }

    return Math.max(0, score);
  }

  /**
   * Get priority distribution
   */
  getPriorityDistribution(): Record<QueuePriority, number> {
    const dist: Record<QueuePriority, number> = {
      low: 0,
      normal: 0,
      high: 0,
      critical: 0,
    };

    for (const entry of this.entries.values()) {
      dist[entry.queued.priority]++;
    }

    return dist;
  }

  /**
   * Get state distribution
   */
  getStateDistribution(): Record<ExecutionState, number> {
    const dist: Record<ExecutionState, number> = {
      waiting: 0,
      scheduled: 0,
      running: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    };

    for (const entry of this.entries.values()) {
      dist[entry.queued.executionState]++;
    }

    return dist;
  }

  /**
   * Clear all entries (for testing)
   */
  clear(): void {
    this.entries.clear();
  }
}
