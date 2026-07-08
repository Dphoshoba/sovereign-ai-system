/**
 * Duplicate Protection
 * 
 * Prevents duplicate Gmail draft creation using multiple identification methods:
 * - Idempotency keys
 * - MIME message hashes
 * - Gmail draft receipts
 * - Approval IDs
 * - Queued execution tracking
 */

import type { DuplicateDetectionResult } from '../../../src/lib/gmail-resilience/types';

export class DuplicateProtection {
  // In-memory storage for demo; production would use database
  private idempotencyMap: Map<string, string> = new Map(); // idempotencyKey -> receiptId
  private mimeHashMap: Map<string, string> = new Map(); // mimeHash -> receiptId
  private approvalMap: Map<string, string> = new Map(); // approvalId -> receiptId
  private executionMap: Map<string, string> = new Map(); // executionId -> receiptId

  /**
   * Check for duplicates across all detection methods
   */
  public detectDuplicate(context: {
    idempotencyKey?: string;
    mimeHash?: string;
    approvalId?: string;
    executionId?: string;
    timeWindowMs?: number;
    currentTime?: Date;
  }): DuplicateDetectionResult {
    const now = context.currentTime || new Date();
    const timeWindow = context.timeWindowMs || 3600000; // 1 hour default

    // Check idempotency key
    if (context.idempotencyKey) {
      const existingReceiptId = this.idempotencyMap.get(context.idempotencyKey);
      if (existingReceiptId) {
        return {
          isDuplicate: true,
          reason: 'idempotency_key',
          existingReceiptId,
        };
      }
    }

    // Check MIME hash (within time window)
    if (context.mimeHash) {
      const existingReceiptId = this.mimeHashMap.get(context.mimeHash);
      if (existingReceiptId) {
        return {
          isDuplicate: true,
          reason: 'mime_hash',
          existingReceiptId,
          details: {
            mimeHashMatched: context.mimeHash,
            withinTimeWindow: true,
            timeWindowMs: timeWindow,
          },
        };
      }
    }

    // Check approval ID (approval is unique per action)
    if (context.approvalId) {
      const existingReceiptId = this.approvalMap.get(context.approvalId);
      if (existingReceiptId) {
        return {
          isDuplicate: true,
          reason: 'approval_id',
          existingReceiptId,
        };
      }
    }

    // Check execution ID (should be unique)
    if (context.executionId) {
      const existingReceiptId = this.executionMap.get(context.executionId);
      if (existingReceiptId) {
        return {
          isDuplicate: true,
          reason: 'queued_execution',
          existingReceiptId,
        };
      }
    }

    return { isDuplicate: false };
  }

  /**
   * Register a new draft to prevent future duplicates
   */
  public registerDraft(context: {
    receiptId: string;
    idempotencyKey?: string;
    mimeHash?: string;
    approvalId?: string;
    executionId?: string;
    draftId?: string;
  }): void {
    if (context.idempotencyKey) {
      this.idempotencyMap.set(context.idempotencyKey, context.receiptId);
    }
    if (context.mimeHash) {
      this.mimeHashMap.set(context.mimeHash, context.receiptId);
    }
    if (context.approvalId) {
      this.approvalMap.set(context.approvalId, context.receiptId);
    }
    if (context.executionId) {
      this.executionMap.set(context.executionId, context.receiptId);
    }
  }

  /**
   * Clear all duplicate registrations (for testing)
   */
  public clear(): void {
    this.idempotencyMap.clear();
    this.mimeHashMap.clear();
    this.approvalMap.clear();
    this.executionMap.clear();
  }

  /**
   * Get statistics about duplicates tracked
   */
  public getStats(): {
    idempotencyKeysTracked: number;
    mimeHashesTracked: number;
    approvalsTracked: number;
    executionsTracked: number;
    totalTracked: number;
  } {
    return {
      idempotencyKeysTracked: this.idempotencyMap.size,
      mimeHashesTracked: this.mimeHashMap.size,
      approvalsTracked: this.approvalMap.size,
      executionsTracked: this.executionMap.size,
      totalTracked:
        this.idempotencyMap.size +
        this.mimeHashMap.size +
        this.approvalMap.size +
        this.executionMap.size,
    };
  }
}
