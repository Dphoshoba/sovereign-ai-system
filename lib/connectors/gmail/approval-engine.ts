/**
 * Approval Engine
 * Manages draft approval decisions and workflow
 */

import {
  ApprovalRequest,
  ApprovalResponse,
  ApprovalDecision,
  ApprovalStatus,
} from '../../../src/lib/draft-preview/types';
import { DraftPreview } from '../../../src/lib/draft-preview/types';

export class ApprovalEngine {
  private decisionHistory: Map<string, ApprovalDecision[]> = new Map();

  /**
   * Process approval request
   */
  processApproval(request: ApprovalRequest): ApprovalResponse {
    try {
      // Validate request
      if (!request.previewId || !request.draftId || !request.operator) {
        return {
          success: false,
          error: 'Invalid approval request: missing required fields',
        };
      }

      // Determine status from decision
      const status = this.determineStatus(request.decision);

      // Create decision record
      const decision: ApprovalDecision = {
        id: `approval_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        previewId: request.previewId,
        draftId: request.draftId,
        status,
        operator: request.operator,
        timestamp: new Date(),
        reason: request.reason,
        comments: request.comments,
      };

      // Record decision
      this.recordDecision(request.draftId, decision);

      return {
        success: true,
        decision,
        message: `Draft ${status}`,
      };
    } catch (error) {
      return {
        success: false,
        error: `Approval processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Approve draft for queue
   */
  approve(previewId: string, draftId: string, operator: string, reason?: string): ApprovalResponse {
    return this.processApproval({
      previewId,
      draftId,
      operator,
      decision: 'approve',
      reason: reason || 'Approved for execution',
    });
  }

  /**
   * Reject draft
   */
  reject(previewId: string, draftId: string, operator: string, reason: string, comments?: string): ApprovalResponse {
    return this.processApproval({
      previewId,
      draftId,
      operator,
      decision: 'reject',
      reason: reason || 'Draft rejected',
      comments,
    });
  }

  /**
   * Request changes to draft
   */
  requestChanges(previewId: string, draftId: string, operator: string, comments: string): ApprovalResponse {
    return this.processApproval({
      previewId,
      draftId,
      operator,
      decision: 'needs_changes',
      reason: 'Changes required before approval',
      comments,
    });
  }

  /**
   * Get decision history for draft
   */
  getDecisionHistory(draftId: string): ApprovalDecision[] {
    return this.decisionHistory.get(draftId) || [];
  }

  /**
   * Get latest decision for draft
   */
  getLatestDecision(draftId: string): ApprovalDecision | undefined {
    const history = this.decisionHistory.get(draftId);
    return history?.[history.length - 1];
  }

  /**
   * Check if draft can be queued
   */
  canQueue(draftId: string): boolean {
    const latest = this.getLatestDecision(draftId);
    return latest?.status === 'approved' && !this.isExpired(latest);
  }

  /**
   * Check if decision is expired
   */
  private isExpired(decision: ApprovalDecision): boolean {
    // Approval valid for 7 days
    const expirationTime = 7 * 24 * 60 * 60 * 1000;
    return Date.now() - decision.timestamp.getTime() > expirationTime;
  }

  /**
   * Determine approval status from decision
   */
  private determineStatus(decision: 'approve' | 'reject' | 'needs_changes'): ApprovalStatus {
    switch (decision) {
      case 'approve':
        return 'approved';
      case 'reject':
        return 'rejected';
      case 'needs_changes':
        return 'needs_changes';
      default:
        return 'pending';
    }
  }

  /**
   * Record decision in history
   */
  private recordDecision(draftId: string, decision: ApprovalDecision): void {
    if (!this.decisionHistory.has(draftId)) {
      this.decisionHistory.set(draftId, []);
    }
    const history = this.decisionHistory.get(draftId)!;
    history.push(decision);
  }

  /**
   * Get approval statistics
   */
  getApprovalStats(): {
    total: number;
    approved: number;
    rejected: number;
    needsChanges: number;
    approvalRate: number;
  } {
    const all: ApprovalDecision[] = [];
    this.decisionHistory.forEach(history => all.push(...history));

    const approved = all.filter(d => d.status === 'approved').length;
    const rejected = all.filter(d => d.status === 'rejected').length;
    const needsChanges = all.filter(d => d.status === 'needs_changes').length;

    return {
      total: all.length,
      approved,
      rejected,
      needsChanges,
      approvalRate: all.length > 0 ? (approved / all.length) * 100 : 0,
    };
  }

  /**
   * Validate preview before queuing
   */
  validateForQueue(preview: DraftPreview): { valid: boolean; reason?: string } {
    // Check if approved
    if (preview.riskLevel === 'critical') {
      return {
        valid: false,
        reason: 'Critical risk level requires escalation',
      };
    }

    // Check for unresolved warnings
    const errors = preview.validationWarnings.filter(w => w.severity === 'error');
    if (errors.length > 0) {
      return {
        valid: false,
        reason: `Validation errors present: ${errors[0].message}`,
      };
    }

    return { valid: true };
  }

  /**
   * Clear history (for testing)
   */
  clearHistory(): void {
    this.decisionHistory.clear();
  }
}
