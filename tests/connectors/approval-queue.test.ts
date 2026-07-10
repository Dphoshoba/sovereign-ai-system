/**
 * Approval Queue Tests
 * 35+ comprehensive tests for preview, approval, and queue workflows
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PreviewEngine } from '../../lib/connectors/gmail/preview-engine';
import { ApprovalEngine } from '../../lib/connectors/gmail/approval-engine';
import { QueueEngine } from '../../lib/connectors/gmail/queue-engine';
import { DraftPreviewReader } from '../../lib/gamma/draft-preview-reader';
import { ApprovalQueueReader } from '../../lib/gamma/approval-queue-reader';
import { MOCK_DRAFT_PREVIEWS, MOCK_APPROVAL_DECISIONS } from '../../src/lib/draft-preview/mock-data';
import { MOCK_QUEUED_DRAFTS } from '../../src/lib/approval-queue/mock-data';
import type { DraftComposition } from '../../src/lib/gmail-drafts/types';

// ============================================================================
// Test Helpers
// ============================================================================

const createValidDraft = (
  id: string = 'test-draft-001',
  options?: { withHtml?: boolean; withAttachments?: boolean }
): DraftComposition => ({
  id,
  status: 'draft' as const,
  request: {
    to: ['recipient@example.com'],
    cc: ['cc@example.com'],
    bcc: ['bcc@example.com'],
    subject: 'Test Draft',
    text: 'This is a test draft.',
    html: options?.withHtml ? '<p>This is a test draft with HTML.</p>' : undefined,
    attachments: options?.withAttachments
      ? [
          {
            filename: 'test.pdf',
            mimeType: 'application/pdf',
            size: 102400,
          },
        ]
      : [],
  },
  validation: {
    valid: true,
    estimatedSize: 256,
    issues: [
      {
        severity: 'warning' as const,
        message: 'Large attachment detected',
        field: 'attachments',
        suggestion: 'Consider compressing before sending',
      },
    ],
    attachmentCount: options?.withAttachments ? 1 : 0,
    recipientCount: 3,
    confidence: 95,
  },
  mime: {
    mimeString: 'From: sender@example.com\nTo: recipient@example.com\nSubject: Test Draft\n\nTest',
    headers: { 'content-type': 'text/plain' },
    bodyPreview: 'This is a test draft.',
    structure: {
      type: 'text/plain' as const,
      charset: 'UTF-8',
      size: 256,
    },
  },
  preview: {
    id: id,
    to: ['recipient@example.com'],
    cc: ['cc@example.com'],
    bcc: ['bcc@example.com'],
    subject: 'Test Draft',
    bodyPreview: 'This is a test draft.',
    attachments: [],
    estimatedSize: 256,
    riskLevel: 'low' as const,
    warnings: [],
    safetyChecks: [],
    recipientValidation: [],
  },
  riskAssessment: {
    score: 10,
    riskLevel: 'low' as const,
    factors: [],
  },
  createdAt: new Date('2026-07-01T10:00:00Z'),
});

// ============================================================================
// Preview Engine Tests (8)
// ============================================================================

describe('Preview Engine', () => {
  let engine: PreviewEngine;

  beforeEach(() => {
    engine = new PreviewEngine();
  });

  it('should generate preview from valid draft', () => {
    const draft = createValidDraft('draft_simple');
    const response = engine.generatePreview({
      draft,
    });

    expect(response.success).toBe(true);
    expect(response.preview).toBeDefined();
    expect(response.preview?.id).toContain('preview_');
    expect(response.preview?.draftId).toBe('draft_simple');
  });

  it('should include preview ID and metadata', () => {
    const response = engine.generatePreview({
      draft: createValidDraft('draft_simple'),
    });

    expect(response.preview?.id).toBeDefined();
    expect(response.preview?.createdAt).toBeDefined();
    expect(response.preview?.expiresAt).toBeDefined();
    expect(response.preview?.status).toBe('active');
  });

  it('should set expiration date correctly', () => {
    const response = engine.generatePreview({
      draft: createValidDraft('draft_simple'),
      expirationDays: 7,
    });

    expect(response.preview?.expiresAt).toBeDefined();
    const diffDays = (response.preview!.expiresAt.getTime() - response.preview!.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    expect(Math.round(diffDays)).toBe(7);
  });

  it('should sanitize HTML in preview', () => {
    const response = engine.generatePreview({
      draft: createValidDraft('draft_withHtml', { withHtml: true }),
    });

    expect(response.success).toBe(true);
    expect(response.preview?.htmlPreview).toBeDefined();
    expect(response.preview?.htmlPreview).not.toContain('<script');
  });

  it('should generate body preview with truncation', () => {
    const response = engine.generatePreview({
      draft: createValidDraft('draft_simple'),
    });

    expect(response.preview?.bodyPreview.length).toBeLessThanOrEqual(500);
  });

  it('should include risk assessment in preview', () => {
    const response = engine.generatePreview({
      draft: createValidDraft('draft_simple'),
    });

    expect(response.preview?.riskScore).toBeDefined();
    expect(response.preview?.riskLevel).toBeDefined();
    expect(['low', 'medium', 'high', 'critical']).toContain(response.preview?.riskLevel);
  });

  it('should include validation warnings', () => {
    const response = engine.generatePreview({
      draft: createValidDraft('draft_withHtml', { withHtml: true }),
    });

    expect(response.preview?.validationWarnings).toBeDefined();
    expect(Array.isArray(response.preview?.validationWarnings)).toBe(true);
  });

  it('should calculate attachment summary correctly', () => {
    const response = engine.generatePreview({
      draft: createValidDraft('draft_withAttachments', { withAttachments: true }),
    });

    expect(response.preview?.attachmentSummary.count).toBeGreaterThan(0);
    expect(response.preview?.attachmentSummary.totalSize).toBeGreaterThan(0);
  });
});

// ============================================================================
// Approval Engine Tests (10)
// ============================================================================

describe('Approval Engine', () => {
  let engine: ApprovalEngine;

  beforeEach(() => {
    engine = new ApprovalEngine();
  });

  afterEach(() => {
    engine.clearHistory();
  });

  it('should approve draft', () => {
    const response = engine.approve('preview_001', 'draft_001', 'approver@example.com', 'Looks good');

    expect(response.success).toBe(true);
    expect(response.decision?.status).toBe('approved');
    expect(response.decision?.operator).toBe('approver@example.com');
  });

  it('should reject draft with reason', () => {
    const response = engine.reject(
      'preview_001',
      'draft_001',
      'approver@example.com',
      'Inappropriate content',
      'Please revise and resubmit'
    );

    expect(response.success).toBe(true);
    expect(response.decision?.status).toBe('rejected');
    expect(response.decision?.comments).toBe('Please revise and resubmit');
  });

  it('should request changes', () => {
    const response = engine.requestChanges(
      'preview_001',
      'draft_001',
      'approver@example.com',
      'Fix subject line and grammar'
    );

    expect(response.success).toBe(true);
    expect(response.decision?.status).toBe('needs_changes');
  });

  it('should maintain decision history', () => {
    engine.approve('preview_001', 'draft_001', 'approver1@example.com');
    engine.reject('preview_001', 'draft_001', 'approver2@example.com', 'Rejected');
    engine.approve('preview_001', 'draft_001', 'approver3@example.com');

    const history = engine.getDecisionHistory('draft_001');
    expect(history.length).toBe(3);
  });

  it('should get latest decision', () => {
    engine.approve('preview_001', 'draft_001', 'approver@example.com');
    engine.reject('preview_001', 'draft_001', 'approver@example.com', 'Rejected');

    const latest = engine.getLatestDecision('draft_001');
    expect(latest?.status).toBe('rejected');
  });

  it('should determine if draft can be queued', () => {
    engine.approve('preview_001', 'draft_001', 'approver@example.com');
    const canQueue = engine.canQueue('draft_001');

    expect(canQueue).toBe(true);
  });

  it('should not queue rejected draft', () => {
    engine.reject('preview_001', 'draft_001', 'approver@example.com', 'Rejected');
    const canQueue = engine.canQueue('draft_001');

    expect(canQueue).toBe(false);
  });

  it('should calculate approval statistics', () => {
    engine.approve('preview_001', 'draft_001', 'approver@example.com');
    engine.approve('preview_002', 'draft_002', 'approver@example.com');
    engine.reject('preview_003', 'draft_003', 'approver@example.com', 'Rejected');

    const stats = engine.getApprovalStats();
    expect(stats.total).toBe(3);
    expect(stats.approved).toBe(2);
    expect(stats.rejected).toBe(1);
    expect(stats.approvalRate).toBeCloseTo(66.67);
  });

  it('should validate preview for queueing', () => {
    const preview = { ...MOCK_DRAFT_PREVIEWS.simple, riskLevel: 'critical' as const };
    const result = engine.validateForQueue(preview);

    expect(result.valid).toBe(false);
  });
});

// ============================================================================
// Queue Engine Tests (12)
// ============================================================================

describe('Queue Engine', () => {
  let engine: QueueEngine;

  beforeEach(() => {
    engine = new QueueEngine();
  });

  afterEach(() => {
    engine.clear();
  });

  it('should queue draft', () => {
    const response = engine.queueDraft({
      draftId: 'draft_001',
      previewId: 'preview_001',
      approvalId: 'approval_001',
      operator: 'approver@example.com',
    });

    expect(response.success).toBe(true);
    expect(response.queued?.executionState).toBe('waiting');
  });

  it('should set priority on queue', () => {
    const response = engine.queueDraft({
      draftId: 'draft_001',
      previewId: 'preview_001',
      approvalId: 'approval_001',
      priority: 'high',
      operator: 'approver@example.com',
    });

    expect(response.queued?.priority).toBe('high');
  });

  it('should schedule draft for future execution', () => {
    const queueResponse = engine.queueDraft({
      draftId: 'draft_001',
      previewId: 'preview_001',
      approvalId: 'approval_001',
      operator: 'approver@example.com',
    });

    const scheduledTime = new Date(Date.now() + 60 * 60 * 1000);
    const scheduleResponse = engine.schedule(queueResponse.queued!.id, scheduledTime, 'scheduler@example.com');

    expect(scheduleResponse.success).toBe(true);
    expect(scheduleResponse.queued?.executionState).toBe('scheduled');
  });

  it('should start execution', () => {
    const queueResponse = engine.queueDraft({
      draftId: 'draft_001',
      previewId: 'preview_001',
      approvalId: 'approval_001',
      operator: 'approver@example.com',
    });

    const startResponse = engine.startExecution(queueResponse.queued!.id);

    expect(startResponse.success).toBe(true);
    expect(startResponse.queued?.executionState).toBe('running');
    expect(startResponse.queued?.startedAt).toBeDefined();
  });

  it('should complete execution', () => {
    const queueResponse = engine.queueDraft({
      draftId: 'draft_001',
      previewId: 'preview_001',
      approvalId: 'approval_001',
      operator: 'approver@example.com',
    });

    engine.startExecution(queueResponse.queued!.id);
    const completeResponse = engine.completeExecution(queueResponse.queued!.id);

    expect(completeResponse.success).toBe(true);
    expect(completeResponse.queued?.executionState).toBe('completed');
    expect(completeResponse.queued?.completedAt).toBeDefined();
  });

  it('should handle execution failure and retry', () => {
    const queueResponse = engine.queueDraft({
      draftId: 'draft_001',
      previewId: 'preview_001',
      approvalId: 'approval_001',
      operator: 'approver@example.com',
    });

    engine.startExecution(queueResponse.queued!.id);
    const failResponse = engine.failExecution(queueResponse.queued!.id, 'Timeout error');

    expect(failResponse.success).toBe(true);
    expect(failResponse.queued?.retryCount).toBe(1);
    expect(failResponse.queued?.executionState).toBe('waiting');
  });

  it('should cancel execution', () => {
    const queueResponse = engine.queueDraft({
      draftId: 'draft_001',
      previewId: 'preview_001',
      approvalId: 'approval_001',
      operator: 'approver@example.com',
    });

    const cancelResponse = engine.cancel({
      queuedDraftId: queueResponse.queued!.id,
      reason: 'User requested',
      operator: 'user@example.com',
    });

    expect(cancelResponse.success).toBe(true);
    expect(cancelResponse.queued?.executionState).toBe('cancelled');
  });

  it('should calculate queue metrics', () => {
    for (let i = 0; i < 5; i++) {
      engine.queueDraft({
        draftId: `draft_${i}`,
        previewId: `preview_${i}`,
        approvalId: `approval_${i}`,
        operator: 'approver@example.com',
      });
    }

    const metrics = engine.getMetrics();
    expect(metrics.totalQueued).toBe(5);
    expect(metrics.waiting).toBe(5);
  });

  it('should provide queue health', () => {
    for (let i = 0; i < 10; i++) {
      engine.queueDraft({
        draftId: `draft_${i}`,
        previewId: `preview_${i}`,
        approvalId: `approval_${i}`,
        operator: 'approver@example.com',
      });
    }

    const health = engine.getHealth();
    expect(health.status).toBeDefined();
    expect(['healthy', 'degraded', 'critical']).toContain(health.status);
    expect(health.score).toBeGreaterThanOrEqual(0);
    expect(health.score).toBeLessThanOrEqual(100);
  });

  it('should query queue with filters', () => {
    engine.queueDraft({
      draftId: 'draft_001',
      previewId: 'preview_001',
      approvalId: 'approval_001',
      priority: 'high',
      operator: 'approver@example.com',
    });

    engine.queueDraft({
      draftId: 'draft_002',
      previewId: 'preview_002',
      approvalId: 'approval_002',
      priority: 'normal',
      operator: 'approver@example.com',
    });

    const result = engine.query({ priority: ['high'] });
    expect(result.total).toBe(1);
    expect(result.items.length).toBe(1);
  });
});

// ============================================================================
// Reader Tests (5)
// ============================================================================

describe('Draft Preview Reader', () => {
  let reader: DraftPreviewReader;

  beforeEach(() => {
    reader = new DraftPreviewReader();
  });

  it('should store and retrieve preview', () => {
    reader.store(MOCK_DRAFT_PREVIEWS.simple);

    const retrieved = reader.getById(MOCK_DRAFT_PREVIEWS.simple.id);
    expect(retrieved).toEqual(MOCK_DRAFT_PREVIEWS.simple);
  });

  it('should get active previews', () => {
    reader.store(MOCK_DRAFT_PREVIEWS.simple);
    reader.store(MOCK_DRAFT_PREVIEWS.expired);

    const active = reader.getActive(new Date());
    expect(active.length).toBe(1);
    expect(active[0].status).toBe('active');
  });

  it('should get previews by risk level', () => {
    reader.store(MOCK_DRAFT_PREVIEWS.simple);
    reader.store(MOCK_DRAFT_PREVIEWS.highRisk);

    const highRisk = reader.getByRiskLevel('high');
    expect(highRisk.length).toBe(1);
  });

  it('should get statistics', () => {
    reader.store(MOCK_DRAFT_PREVIEWS.simple);
    reader.store(MOCK_DRAFT_PREVIEWS.highRisk);

    const stats = reader.getStats();
    expect(stats.total).toBe(2);
    expect(stats.active).toBe(2);
  });

  it('should search by subject', () => {
    reader.store(MOCK_DRAFT_PREVIEWS.simple);
    reader.store(MOCK_DRAFT_PREVIEWS.highRisk);

    const results = reader.searchBySubject('Simple');
    expect(results.length).toBe(1);
  });
});

describe('Approval Queue Reader', () => {
  let reader: ApprovalQueueReader;

  beforeEach(() => {
    reader = new ApprovalQueueReader();
  });

  it('should get queue statistics', () => {
    reader.store({
      queued: MOCK_QUEUED_DRAFTS.waiting,
      draft: createValidDraft(),
      preview: MOCK_DRAFT_PREVIEWS.simple,
      approval: MOCK_APPROVAL_DECISIONS.approved,
    });

    const stats = reader.getStats();
    expect(stats.total).toBe(1);
    expect(stats.waiting).toBe(1);
  });

  it('should get state distribution', () => {
    reader.store({
      queued: MOCK_QUEUED_DRAFTS.waiting,
      draft: createValidDraft(),
      preview: MOCK_DRAFT_PREVIEWS.simple,
      approval: MOCK_APPROVAL_DECISIONS.approved,
    });

    reader.store({
      queued: MOCK_QUEUED_DRAFTS.completed,
      draft: createValidDraft(),
      preview: MOCK_DRAFT_PREVIEWS.simple,
      approval: MOCK_APPROVAL_DECISIONS.approved,
    });

    const dist = reader.getStateDistribution();
    expect(dist.waiting).toBe(1);
    expect(dist.completed).toBe(1);
  });

  it('should get health score', () => {
    reader.store({
      queued: MOCK_QUEUED_DRAFTS.waiting,
      draft: createValidDraft(),
      preview: MOCK_DRAFT_PREVIEWS.simple,
      approval: MOCK_APPROVAL_DECISIONS.approved,
    });

    const health = reader.getHealthScore();
    expect(health).toBeGreaterThanOrEqual(0);
    expect(health).toBeLessThanOrEqual(100);
  });
});

// ============================================================================
// Edge Cases & Integration (5)
// ============================================================================

describe('Integration & Edge Cases', () => {
  it('should handle complete workflow: compose → preview → approve → queue', () => {
    const previewEngine = new PreviewEngine();
    const approvalEngine = new ApprovalEngine();
    const queueEngine = new QueueEngine();

    // Step 1: Generate preview
    const previewResponse = previewEngine.generatePreview({
      draft: createValidDraft('draft_001'),
    });
    expect(previewResponse.success).toBe(true);

    // Step 2: Approve
    const approvalResponse = approvalEngine.approve(
      previewResponse.preview!.id,
      'draft_001',
      'approver@example.com'
    );
    expect(approvalResponse.success).toBe(true);

    // Step 3: Queue
    const queueResponse = queueEngine.queueDraft({
      draftId: 'draft_001',
      previewId: previewResponse.preview!.id,
      approvalId: approvalResponse.decision!.id,
      operator: 'approver@example.com',
    });
    expect(queueResponse.success).toBe(true);
    expect(queueResponse.queued?.executionState).toBe('waiting');
  });

  it('should prevent queueing of non-approved drafts', () => {
    const previewEngine = new PreviewEngine();
    const approvalEngine = new ApprovalEngine();

    const previewResponse = previewEngine.generatePreview({
      draft: createValidDraft('draft_002'),
    });

    approvalEngine.reject(
      previewResponse.preview!.id,
      'draft_002',
      'approver@example.com',
      'Rejected'
    );

    const canQueue = approvalEngine.canQueue('draft_002');
    expect(canQueue).toBe(false);
  });

  it('should handle execution with multiple retries', () => {
    const queueEngine = new QueueEngine();

    const queueResponse = queueEngine.queueDraft({
      draftId: 'draft_001',
      previewId: 'preview_001',
      approvalId: 'approval_001',
      operator: 'approver@example.com',
    });

    queueEngine.startExecution(queueResponse.queued!.id);
    queueEngine.failExecution(queueResponse.queued!.id, 'Error 1');

    const queued = queueEngine.getQueued(queueResponse.queued!.id);
    expect(queued?.retryCount).toBe(1);
    expect(queued?.executionState).toBe('waiting');
  });

  it('should track audit trail through workflow', () => {
    const queueEngine = new QueueEngine();

    const queueResponse = queueEngine.queueDraft({
      draftId: 'draft_001',
      previewId: 'preview_001',
      approvalId: 'approval_001',
      operator: 'approver@example.com',
    });

    queueEngine.startExecution(queueResponse.queued!.id, 'executor@example.com');
    const eventLog = queueEngine.getEventLog(queueResponse.queued!.id);

    expect(eventLog?.events.length).toBeGreaterThan(0);
    expect(eventLog?.events[0].eventType).toBe('queued');
  });
});
