/**
 * Execution Receipt Manager
 * Tracks draft receipts and coordinates with execution engine
 * Part of Build 136: Gmail Draft API Integration
 */

import { DraftReceipt, DraftReceiptStatus } from '../../../src/lib/gmail-api/types';
import { ExecutionAuditLog } from './execution-audit';

export interface ReceiptQuery {
  executionId?: string;
  draftId?: string;
  gmailDraftId?: string;
  status?: DraftReceiptStatus;
  mode?: 'simulation' | 'real';
}

export class ExecutionReceiptManager {
  private receipts: Map<string, DraftReceipt> = new Map();
  private auditLog: ExecutionAuditLog;
  private receiptCount = 0;

  constructor() {
    this.auditLog = new ExecutionAuditLog();
  }

  /**
   * Store a new draft receipt
   */
  async store(receipt: DraftReceipt): Promise<string> {
    this.receipts.set(receipt.id, receipt);
    this.receiptCount++;

    // Record in audit log for tracking
    await this.auditLog.recordEvent({
      id: `audit_${Date.now()}`,
      type: receipt.mode === 'simulation' ? 'gmail_draft_simulated' : 'gmail_draft_created',
      executionId: receipt.executionId,
      draftReceiptId: receipt.id,
      operator: 'system',
      timestamp: new Date(),
      details: {
        status: receipt.status,
        mode: receipt.mode,
        gmailDraftId: receipt.gmailDraftId,
      },
      readonly: true,
    });

    return receipt.id;
  }

  /**
   * Get receipt by ID
   */
  getById(receiptId: string): DraftReceipt | undefined {
    return this.receipts.get(receiptId);
  }

  /**
   * Query receipts
   */
  query(query: ReceiptQuery): DraftReceipt[] {
    const results: DraftReceipt[] = [];

    for (const receipt of this.receipts.values()) {
      if (query.executionId && receipt.executionId !== query.executionId) continue;
      if (query.draftId && receipt.draftId !== query.draftId) continue;
      if (query.gmailDraftId && receipt.gmailDraftId !== query.gmailDraftId) continue;
      if (query.status && receipt.status !== query.status) continue;
      if (query.mode && receipt.mode !== query.mode) continue;

      results.push(receipt);
    }

    return results;
  }

  /**
   * Get all receipts for execution
   */
  getByExecutionId(executionId: string): DraftReceipt[] {
    return this.query({ executionId });
  }

  /**
   * Get all receipts by status
   */
  getByStatus(status: DraftReceiptStatus): DraftReceipt[] {
    return this.query({ status });
  }

  /**
   * Get all simulation mode receipts
   */
  getSimulated(): DraftReceipt[] {
    return this.query({ mode: 'simulation' });
  }

  /**
   * Get all real mode receipts
   */
  getReal(): DraftReceipt[] {
    return this.query({ mode: 'real' });
  }

  /**
   * Update receipt status
   */
  async updateStatus(
    receiptId: string,
    newStatus: DraftReceiptStatus,
    error?: string,
  ): Promise<boolean> {
    const receipt = this.receipts.get(receiptId);
    if (!receipt) return false;

    receipt.status = newStatus;
    if (error) {
      receipt.error = error;
    }

    await this.auditLog.recordEvent({
      id: `audit_${Date.now()}`,
      type: 'gmail_draft_created',
      executionId: receipt.executionId,
      draftReceiptId: receiptId,
      operator: 'system',
      timestamp: new Date(),
      details: {
        newStatus,
        previousStatus: receipt.status,
      },
      readonly: true,
    });

    return true;
  }

  /**
   * Delete receipt
   */
  async delete(receiptId: string): Promise<boolean> {
    const receipt = this.receipts.get(receiptId);
    if (!receipt) return false;

    this.receipts.delete(receiptId);

    await this.auditLog.recordEvent({
      id: `audit_${Date.now()}`,
      type: 'gmail_draft_deleted',
      executionId: receipt.executionId,
      draftReceiptId: receiptId,
      operator: 'system',
      timestamp: new Date(),
      details: {
        gmailDraftId: receipt.gmailDraftId,
      },
      readonly: true,
    });

    return true;
  }

  /**
   * Get statistics
   */
  getStats() {
    const byStatus = {
      pending: 0,
      created: 0,
      failed: 0,
      deleted: 0,
    };

    const byMode = {
      simulation: 0,
      real: 0,
    };

    for (const receipt of this.receipts.values()) {
      byStatus[receipt.status] = (byStatus[receipt.status] || 0) + 1;
      byMode[receipt.mode] = (byMode[receipt.mode] || 0) + 1;
    }

    return {
      totalReceipts: this.receiptCount,
      activeReceipts: this.receipts.size,
      pending: byStatus.pending,
      created: byStatus.created,
      failed: byStatus.failed,
      deleted: byStatus.deleted,
      simulation: byMode.simulation,
      real: byMode.real,
      byStatus,
      byMode,
      successRate: this.receiptCount > 0 ? byStatus.created / this.receiptCount : 0,
    };
  }

  /**
   * Clear all receipts (for testing)
   */
  clear(): void {
    this.receipts.clear();
    this.receiptCount = 0;
  }
}
