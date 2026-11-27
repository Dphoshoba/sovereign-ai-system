/**
 * Receipt Verifier
 * 
 * Validates Gmail draft receipts to ensure they contain all required fields
 * and meet safety and audit requirements.
 */

import type { ReceiptVerification } from '../../../src/lib/gmail-resilience/types';
import type { DraftReceipt } from '../../../src/lib/gmail-api/types';

export class ReceiptVerifier {
  /**
   * Required fields for valid receipt
   */
  private readonly requiredFields = [
    'id',
    'draftId',
    'gmailAccount',
    'executionId',
    'idempotencyKey',
    'createdAt',
    'mimeHash',
    'auditId',
    'mode',
  ];

  /**
   * Verify a draft receipt
   */
  public verify(receipt: any): ReceiptVerification {
    if (!receipt) {
      return {
        valid: false,
        errors: ['Receipt is null or undefined'],
      };
    }

    const missingFields: string[] = [];
    const errors: string[] = [];

    // Check required fields
    for (const field of this.requiredFields) {
      if (!receipt[field]) {
        missingFields.push(field);
      }
    }

    // Validate field types and values
    if (receipt.id && typeof receipt.id !== 'string') {
      errors.push('Receipt ID must be string');
    }

    if (receipt.draftId && typeof receipt.draftId !== 'string') {
      errors.push('Draft ID must be string');
    }

    if (receipt.gmailAccount && typeof receipt.gmailAccount !== 'string') {
      errors.push('Gmail account must be string');
    }

    if (receipt.executionId && typeof receipt.executionId !== 'string') {
      errors.push('Execution ID must be string');
    }

    if (receipt.idempotencyKey && typeof receipt.idempotencyKey !== 'string') {
      errors.push('Idempotency key must be string');
    }

    if (receipt.createdAt && !(receipt.createdAt instanceof Date)) {
      errors.push('Created at must be Date');
    }

    if (receipt.mimeHash && typeof receipt.mimeHash !== 'string') {
      errors.push('MIME hash must be string');
    }

    if (receipt.auditId && typeof receipt.auditId !== 'string') {
      errors.push('Audit ID must be string');
    }

    if (receipt.mode && !['simulation', 'live'].includes(receipt.mode)) {
      errors.push("Mode must be 'simulation' or 'live'");
    }

    if (receipt.status) {
      const validStatuses = ['pending', 'created', 'failed', 'verified'];
      if (!validStatuses.includes(receipt.status)) {
        errors.push(`Invalid status: ${receipt.status}`);
      }
    }

    // Build verification result
    if (missingFields.length > 0 || errors.length > 0) {
      return {
        valid: false,
        missingFields: missingFields.length > 0 ? missingFields : undefined,
        errors: errors.length > 0 ? errors : undefined,
      };
    }

    return {
      valid: true,
      draftId: receipt.draftId,
      threadId: receipt.threadId,
      gmailAccount: receipt.gmailAccount,
      executionId: receipt.executionId,
      idempotencyKey: receipt.idempotencyKey,
      createdAt: receipt.createdAt,
      mimeHash: receipt.mimeHash,
      auditId: receipt.auditId,
      mode: receipt.mode,
    };
  }

  /**
   * Verify multiple receipts
   */
  public verifyBatch(receipts: any[]): ReceiptVerification[] {
    return receipts.map(receipt => this.verify(receipt));
  }

  /**
   * Get validation score (0-100)
   */
  public getValidationScore(receipts: any[]): number {
    if (receipts.length === 0) return 100;

    const verifications = this.verifyBatch(receipts);
    const validCount = verifications.filter(v => v.valid).length;
    return Math.round((validCount / receipts.length) * 100);
  }
}
