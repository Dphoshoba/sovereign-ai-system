/**
 * Dead-Letter Queue (DLQ)
 * Failed executions that have exhausted retries
 */

import { DeadLetterEntry, ExecutionRequest } from '../../../src/lib/gmail-execution/types';

export class DeadLetterQueue {
  private entries: Map<string, DeadLetterEntry> = new Map();
  private retentionTimeMs: number = 30 * 24 * 60 * 60 * 1000; // 30 days

  /**
   * Add entry to dead-letter queue
   */
  add(
    executionId: string,
    queuedId: string,
    draftId: string,
    originalRequest: ExecutionRequest,
    attempts: number,
    maxRetries: number,
    finalError: string,
    failedAt: Date,
    retriable: boolean = false
  ): DeadLetterEntry {
    const dlqId = `dlq_${executionId}`;
    const entry: DeadLetterEntry = {
      id: dlqId,
      executionId,
      queuedId,
      draftId,
      originalRequest,
      attempts,
      maxRetries,
      finalError,
      failedAt,
      movedAt: new Date(),
      retriable,
    };

    this.entries.set(dlqId, entry);
    return entry;
  }

  /**
   * Get entry by ID
   */
  getEntry(id: string): DeadLetterEntry | undefined {
    return this.entries.get(id);
  }

  /**
   * Get all entries in DLQ
   */
  getAllEntries(): DeadLetterEntry[] {
    return Array.from(this.entries.values());
  }

  /**
   * Get entries for specific draft
   */
  getForDraft(draftId: string): DeadLetterEntry[] {
    return Array.from(this.entries.values()).filter(e => e.draftId === draftId);
  }

  /**
   * Get retriable entries (can be retried manually)
   */
  getRetriable(): DeadLetterEntry[] {
    return Array.from(this.entries.values()).filter(e => e.retriable);
  }

  /**
   * Get permanent failures (cannot be retried)
   */
  getPermanentFailures(): DeadLetterEntry[] {
    return Array.from(this.entries.values()).filter(e => !e.retriable);
  }

  /**
   * Remove entry from DLQ (after manual review or resolution)
   */
  remove(id: string): boolean {
    return this.entries.delete(id);
  }

  /**
   * Move entry back to execution queue for retry (only if retriable)
   */
  moveToRetryQueue(id: string): ExecutionRequest | undefined {
    const entry = this.entries.get(id);
    if (!entry || !entry.retriable) {
      return undefined;
    }

    this.entries.delete(id);
    return entry.originalRequest;
  }

  /**
   * Clean up expired entries
   */
  cleanupExpired(currentTime: Date): number {
    let cleaned = 0;

    for (const [id, entry] of this.entries) {
      const ageMs = currentTime.getTime() - entry.movedAt.getTime();
      if (ageMs > this.retentionTimeMs) {
        this.entries.delete(id);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get DLQ metrics
   */
  getMetrics() {
    const entries = Array.from(this.entries.values());
    const retriable = entries.filter(e => e.retriable).length;
    const permanent = entries.filter(e => !e.retriable).length;

    // Categorize errors
    const errorCategories: Record<string, number> = {};
    entries.forEach(e => {
      const errorType = e.finalError.split(':')[0] || 'unknown';
      errorCategories[errorType] = (errorCategories[errorType] || 0) + 1;
    });

    return {
      totalInDLQ: entries.length,
      retriable,
      permanent,
      errorCategories,
      oldestEntryAge: entries.length > 0 ? Math.max(...entries.map(e => new Date().getTime() - e.movedAt.getTime())) : 0,
    };
  }

  /**
   * Get health score for DLQ
   * High DLQ size indicates systemic issues
   */
  getHealth() {
    const metrics = this.getMetrics();
    const dlqSize = metrics.totalInDLQ;

    // Score based on DLQ size
    let score = 100;
    score -= Math.min(dlqSize * 10, 50); // Size penalty (max 50)

    // Bonus if retriable entries exist (indicates some hope for recovery)
    if (metrics.retriable > 0) {
      score += 10;
    }

    const status = score >= 80 ? 'healthy' : score >= 60 ? 'degraded' : 'critical';

    return {
      score: Math.max(0, Math.min(100, score)),
      status,
      dlqSize,
      permanentFailures: metrics.permanent,
    };
  }

  /**
   * Classify error as retriable or permanent
   */
  static classifyError(errorMessage: string): boolean {
    // Retriable: temporary network, rate limits, service unavailable
    const retriablePatterns = [
      'timeout',
      'temporarily unavailable',
      'rate_limit',
      'connection_reset',
      'temporary',
      'ETIMEDOUT',
      'ECONNREFUSED',
      '429', // Rate limit
      '503', // Service unavailable
      '502', // Bad gateway
      '504', // Gateway timeout
    ];

    const isRetriable = retriablePatterns.some(pattern => errorMessage.toLowerCase().includes(pattern.toLowerCase()));

    // Permanent: validation, auth, malformed
    const permanentPatterns = [
      'invalid',
      'malformed',
      'unauthorized',
      'authentication',
      'forbidden',
      '400', // Bad request
      '401', // Unauthorized
      '403', // Forbidden
    ];

    const isPermanent = permanentPatterns.some(pattern => errorMessage.toLowerCase().includes(pattern.toLowerCase()));

    return isRetriable && !isPermanent;
  }
}
