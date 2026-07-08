/**
 * Gmail Draft API Reader (GAMMA Integration)
 * Deterministic queries for Gmail draft data
 * CRITICAL: No temporal randomness, no current time access - ALL time operations accept currentTime parameter
 * Part of Build 136: Gmail Draft API Integration
 */

import { DraftReceipt } from '../../src/lib/gmail-api/types';

export interface DraftQueryOptions {
  status?: string;
  mode?: 'simulation' | 'real';
  limit?: number;
}

export class GmailDraftApiReader {
  private draftReceipts: DraftReceipt[] = [];

  /**
   * Store draft receipt
   */
  store(receipt: DraftReceipt): void {
    this.draftReceipts.push(receipt);
  }

  /**
   * Get draft receipt by ID
   */
  getById(receiptId: string): DraftReceipt | undefined {
    return this.draftReceipts.find((r) => r.id === receiptId);
  }

  /**
   * Get all active receipts (created status only)
   * Time-dependent but accepts currentTime parameter (deterministic)
   */
  getActive(status?: string): DraftReceipt[] {
    if (status) {
      return this.draftReceipts.filter((r) => r.status === status);
    }
    return this.draftReceipts.filter((r) => r.status === 'created');
  }

  /**
   * Get receipts by execution ID
   */
  getByExecutionId(executionId: string): DraftReceipt[] {
    return this.draftReceipts.filter((r) => r.executionId === executionId);
  }

  /**
   * Get receipts by mode
   */
  getByMode(mode: 'simulation' | 'real'): DraftReceipt[] {
    return this.draftReceipts.filter((r) => r.mode === mode);
  }

  /**
   * Get receipts by status
   */
  getByStatus(status: string): DraftReceipt[] {
    return this.draftReceipts.filter((r) => r.status === status);
  }

  /**
   * Query receipts with options
   */
  query(options: DraftQueryOptions = {}): DraftReceipt[] {
    let results = [...this.draftReceipts];

    if (options.status) {
      results = results.filter((r) => r.status === options.status);
    }

    if (options.mode) {
      results = results.filter((r) => r.mode === options.mode);
    }

    if (options.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  /**
   * Get created receipts count (success metric)
   */
  getCreatedCount(): number {
    return this.draftReceipts.filter((r) => r.status === 'created').length;
  }

  /**
   * Get failed receipts count (failure metric)
   */
  getFailedCount(): number {
    return this.draftReceipts.filter((r) => r.status === 'failed').length;
  }

  /**
   * Get simulation mode count
   */
  getSimulationCount(): number {
    return this.draftReceipts.filter((r) => r.mode === 'simulation').length;
  }

  /**
   * Get real mode count
   */
  getRealCount(): number {
    return this.draftReceipts.filter((r) => r.mode === 'real').length;
  }

  /**
   * Calculate success rate (0-1)
   */
  getSuccessRate(): number {
    if (this.draftReceipts.length === 0) return 0;
    const succeeded = this.getCreatedCount();
    return succeeded / this.draftReceipts.length;
  }

  /**
   * Calculate health score (0-100)
   * Deterministic: accepts currentTime parameter
   */
  getHealthScore(currentTime: Date): number {
    if (this.draftReceipts.length === 0) return 100;

    const successRate = this.getSuccessRate();
    const recentReceipts = this.draftReceipts.filter((r) => {
      const ageMs = currentTime.getTime() - r.createdTime.getTime();
      return ageMs < 3600000; // Last hour
    });

    const recentSuccessRate = recentReceipts.length > 0
      ? recentReceipts.filter((r) => r.status === 'created').length / recentReceipts.length
      : 1;

    // Health = 50% overall success + 50% recent success
    return Math.round(successRate * 50 + recentSuccessRate * 50);
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalReceipts: number;
    created: number;
    failed: number;
    pending: number;
    deleted: number;
    simulation: number;
    real: number;
    successRate: number;
  } {
    return {
      totalReceipts: this.draftReceipts.length,
      created: this.getCreatedCount(),
      failed: this.getFailedCount(),
      pending: this.draftReceipts.filter((r) => r.status === 'pending').length,
      deleted: this.draftReceipts.filter((r) => r.status === 'deleted').length,
      simulation: this.getSimulationCount(),
      real: this.getRealCount(),
      successRate: this.getSuccessRate(),
    };
  }

  /**
   * Archive expired receipts (keeping for audit trail)
   * Deterministic: accepts currentTime parameter
   */
  archiveExpired(currentTime: Date, retentionDays: number = 30): DraftReceipt[] {
    const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
    const archived: DraftReceipt[] = [];

    this.draftReceipts = this.draftReceipts.filter((receipt) => {
      const ageMs = currentTime.getTime() - receipt.createdTime.getTime();
      if (ageMs > retentionMs) {
        archived.push(receipt);
        return false; // Remove from active list
      }
      return true; // Keep in active list
    });

    return archived;
  }

  /**
   * Clear all receipts (testing)
   */
  clear(): void {
    this.draftReceipts = [];
  }
}
