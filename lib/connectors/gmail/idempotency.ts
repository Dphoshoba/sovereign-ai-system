/**
 * Idempotency Management
 * Prevent duplicate executions using idempotency keys
 */

import { IdempotencyRecord } from '../../../src/lib/gmail-execution/types';

export class IdempotencyManager {
  private records: Map<string, IdempotencyRecord> = new Map();
  private expirationTimeMs: number = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Register an idempotency key
   */
  register(key: string, queuedId: string, draftId: string, executionId: string, currentTime: Date): IdempotencyRecord {
    const expiresAt = new Date(currentTime.getTime() + this.expirationTimeMs);

    const record: IdempotencyRecord = {
      key,
      queuedId,
      draftId,
      executionId,
      status: 'pending',
      createdAt: currentTime,
      expiresAt,
    };

    this.records.set(key, record);
    return record;
  }

  /**
   * Check if key already exists and is not expired
   */
  exists(key: string, currentTime: Date): boolean {
    const record = this.records.get(key);
    if (!record) {
      return false;
    }

    // Check if expired
    if (currentTime > record.expiresAt) {
      this.records.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Mark execution as completed
   */
  markCompleted(key: string, gmailMessageId: string, result?: any): IdempotencyRecord | undefined {
    const record = this.records.get(key);
    if (!record) {
      return undefined;
    }

    record.status = 'completed';
    record.gmailMessageId = gmailMessageId;
    record.result = result;
    return record;
  }

  /**
   * Mark execution as failed
   */
  markFailed(key: string, error: string): IdempotencyRecord | undefined {
    const record = this.records.get(key);
    if (!record) {
      return undefined;
    }

    record.status = 'failed';
    record.result = { error };
    return record;
  }

  /**
   * Get record by key
   */
  getRecord(key: string): IdempotencyRecord | undefined {
    return this.records.get(key);
  }

  /**
   * Get all records for a draft
   */
  getForDraft(draftId: string): IdempotencyRecord[] {
    return Array.from(this.records.values()).filter(r => r.draftId === draftId);
  }

  /**
   * Get all records for a queued draft
   */
  getForQueued(queuedId: string): IdempotencyRecord[] {
    return Array.from(this.records.values()).filter(r => r.queuedId === queuedId);
  }

  /**
   * Clean up expired records
   */
  cleanupExpired(currentTime: Date): number {
    let cleaned = 0;

    for (const [key, record] of this.records) {
      if (currentTime > record.expiresAt) {
        this.records.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get statistics
   */
  getStats() {
    const records = Array.from(this.records.values());
    const pending = records.filter(r => r.status === 'pending').length;
    const completed = records.filter(r => r.status === 'completed').length;
    const failed = records.filter(r => r.status === 'failed').length;

    return {
      totalRecords: records.length,
      pending,
      completed,
      failed,
      completionRate: records.length > 0 ? (completed / records.length) * 100 : 0,
    };
  }

  /**
   * Validate idempotency key format
   */
  static validateKeyFormat(key: string): boolean {
    // Key should be non-empty and alphanumeric with underscores/hyphens
    return /^[a-zA-Z0-9_-]+$/.test(key) && key.length >= 8 && key.length <= 256;
  }

  /**
   * Generate idempotency key deterministically
   */
  static generateKey(draftId: string, operator: string, timestamp: Date): string {
    // Format: draft_{id}_{operator_hash}_{timestamp_hex}
    // No Math.random() used
    const operatorHash = operator.split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0).toString(16);
    const timestampHex = timestamp.getTime().toString(16);
    return `idempotent_${draftId}_${operatorHash}_${timestampHex}`;
  }
}
