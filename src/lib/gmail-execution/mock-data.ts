/**
 * Gmail Execution Mock Data
 * Deterministic test data with fixed timestamps
 */

import {
  ExecutionContext,
  IdempotencyRecord,
  DeadLetterEntry,
  ExecutionAuditEvent,
  SafetyCheckResult,
  DEFAULT_SAFETY_POLICY,
} from './types';

const BASE_TIME = new Date('2026-07-01T10:00:00Z');

/**
 * Mock execution contexts for different states
 */
export const MOCK_EXECUTION_CONTEXTS: Record<string, ExecutionContext> = {
  waiting: {
    id: 'exec_waiting_001',
    queuedId: 'queued_001',
    draftId: 'draft_001',
    previewId: 'preview_001',
    approvalId: 'approval_001',
    idempotencyKey: 'idempotent_waiting_001',
    operator: 'executor@example.com',
    executeAction: 'create_draft',
    executionState: 'waiting',
    attemptNumber: 0,
    maxRetries: 3,
    createdAt: new Date(BASE_TIME.getTime()),
    safetyChecksPassed: false,
    safetyCheckDetails: {
      approvalExists: true,
      approvalValid: true,
      approvalNotExpired: true,
      draftCompositionValid: true,
      previewValid: true,
      oauthConnected: true,
      oauthValid: true,
      idempotencyNotDuplicate: true,
      allChecksPassed: true,
      checkedAt: new Date(BASE_TIME.getTime()),
    },
  },

  running: {
    id: 'exec_running_001',
    queuedId: 'queued_002',
    draftId: 'draft_002',
    previewId: 'preview_002',
    approvalId: 'approval_002',
    idempotencyKey: 'idempotent_running_001',
    operator: 'executor@example.com',
    executeAction: 'send',
    executionState: 'running',
    attemptNumber: 1,
    maxRetries: 3,
    createdAt: new Date(BASE_TIME.getTime() - 30000),
    startedAt: new Date(BASE_TIME.getTime() - 10000),
    safetyChecksPassed: true,
    safetyCheckDetails: {
      approvalExists: true,
      approvalValid: true,
      approvalNotExpired: true,
      draftCompositionValid: true,
      previewValid: true,
      oauthConnected: true,
      oauthValid: true,
      idempotencyNotDuplicate: true,
      allChecksPassed: true,
      checkedAt: new Date(BASE_TIME.getTime() - 15000),
    },
  },

  completed: {
    id: 'exec_completed_001',
    queuedId: 'queued_003',
    draftId: 'draft_003',
    previewId: 'preview_003',
    approvalId: 'approval_003',
    idempotencyKey: 'idempotent_completed_001',
    operator: 'executor@example.com',
    executeAction: 'send',
    executionState: 'completed',
    attemptNumber: 1,
    maxRetries: 3,
    createdAt: new Date(BASE_TIME.getTime() - 120000),
    startedAt: new Date(BASE_TIME.getTime() - 110000),
    completedAt: new Date(BASE_TIME.getTime() - 90000),
    gmailMessageId: 'msg_abc123def456',
    safetyChecksPassed: true,
    safetyCheckDetails: {
      approvalExists: true,
      approvalValid: true,
      approvalNotExpired: true,
      draftCompositionValid: true,
      previewValid: true,
      oauthConnected: true,
      oauthValid: true,
      idempotencyNotDuplicate: true,
      allChecksPassed: true,
      checkedAt: new Date(BASE_TIME.getTime() - 100000),
    },
  },

  failed: {
    id: 'exec_failed_001',
    queuedId: 'queued_004',
    draftId: 'draft_004',
    previewId: 'preview_004',
    approvalId: 'approval_004',
    idempotencyKey: 'idempotent_failed_001',
    operator: 'executor@example.com',
    executeAction: 'send',
    executionState: 'failed',
    attemptNumber: 2,
    maxRetries: 3,
    createdAt: new Date(BASE_TIME.getTime() - 180000),
    startedAt: new Date(BASE_TIME.getTime() - 170000),
    completedAt: new Date(BASE_TIME.getTime() - 160000),
    error: 'Gmail API: authentication_failed',
    safetyChecksPassed: true,
    safetyCheckDetails: {
      approvalExists: true,
      approvalValid: true,
      approvalNotExpired: true,
      draftCompositionValid: true,
      previewValid: true,
      oauthConnected: true,
      oauthValid: false,
      idempotencyNotDuplicate: true,
      allChecksPassed: false,
      failureReason: 'OAuth token expired',
      checkedAt: new Date(BASE_TIME.getTime() - 165000),
    },
    retryScheduledAt: new Date(BASE_TIME.getTime() + 20000),
  },

  cancelled: {
    id: 'exec_cancelled_001',
    queuedId: 'queued_005',
    draftId: 'draft_005',
    previewId: 'preview_005',
    approvalId: 'approval_005',
    idempotencyKey: 'idempotent_cancelled_001',
    operator: 'executor@example.com',
    executeAction: 'send',
    executionState: 'cancelled',
    attemptNumber: 0,
    maxRetries: 3,
    createdAt: new Date(BASE_TIME.getTime() - 60000),
    safetyChecksPassed: false,
    safetyCheckDetails: {
      approvalExists: true,
      approvalValid: true,
      approvalNotExpired: true,
      draftCompositionValid: true,
      previewValid: true,
      oauthConnected: true,
      oauthValid: true,
      idempotencyNotDuplicate: true,
      allChecksPassed: true,
      checkedAt: new Date(BASE_TIME.getTime() - 55000),
    },
  },

  dead_lettered: {
    id: 'exec_deadletter_001',
    queuedId: 'queued_006',
    draftId: 'draft_006',
    previewId: 'preview_006',
    approvalId: 'approval_006',
    idempotencyKey: 'idempotent_deadletter_001',
    operator: 'executor@example.com',
    executeAction: 'send',
    executionState: 'dead_lettered',
    attemptNumber: 3,
    maxRetries: 3,
    createdAt: new Date(BASE_TIME.getTime() - 300000),
    startedAt: new Date(BASE_TIME.getTime() - 290000),
    completedAt: new Date(BASE_TIME.getTime() - 260000),
    error: 'Gmail API: permanent_failure - Invalid recipient',
    safetyChecksPassed: true,
    safetyCheckDetails: {
      approvalExists: true,
      approvalValid: true,
      approvalNotExpired: true,
      draftCompositionValid: false,
      previewValid: false,
      oauthConnected: true,
      oauthValid: true,
      idempotencyNotDuplicate: true,
      allChecksPassed: false,
      failureReason: 'Draft validation failed',
      checkedAt: new Date(BASE_TIME.getTime() - 285000),
    },
  },
};

/**
 * Mock safety check results
 */
export const MOCK_SAFETY_CHECKS: Record<string, SafetyCheckResult> = {
  all_passed: {
    approvalExists: true,
    approvalValid: true,
    approvalNotExpired: true,
    draftCompositionValid: true,
    previewValid: true,
    oauthConnected: true,
    oauthValid: true,
    idempotencyNotDuplicate: true,
    allChecksPassed: true,
    checkedAt: BASE_TIME,
  },

  approval_expired: {
    approvalExists: true,
    approvalValid: true,
    approvalNotExpired: false,
    draftCompositionValid: true,
    previewValid: true,
    oauthConnected: true,
    oauthValid: true,
    idempotencyNotDuplicate: true,
    allChecksPassed: false,
    failureReason: 'Approval expired',
    checkedAt: BASE_TIME,
  },

  oauth_invalid: {
    approvalExists: true,
    approvalValid: true,
    approvalNotExpired: true,
    draftCompositionValid: true,
    previewValid: true,
    oauthConnected: true,
    oauthValid: false,
    idempotencyNotDuplicate: true,
    allChecksPassed: false,
    failureReason: 'OAuth token invalid',
    checkedAt: BASE_TIME,
  },

  duplicate_idempotency: {
    approvalExists: true,
    approvalValid: true,
    approvalNotExpired: true,
    draftCompositionValid: true,
    previewValid: true,
    oauthConnected: true,
    oauthValid: true,
    idempotencyNotDuplicate: false,
    allChecksPassed: false,
    failureReason: 'Duplicate idempotency key',
    checkedAt: BASE_TIME,
  },
};

/**
 * Mock idempotency records
 */
export const MOCK_IDEMPOTENCY_RECORDS: Record<string, IdempotencyRecord> = {
  pending: {
    key: 'idempotent_key_001',
    queuedId: 'queued_001',
    draftId: 'draft_001',
    executionId: 'exec_001',
    status: 'pending',
    createdAt: BASE_TIME,
    expiresAt: new Date(BASE_TIME.getTime() + 86400000), // 24 hours
  },

  completed: {
    key: 'idempotent_key_002',
    queuedId: 'queued_002',
    draftId: 'draft_002',
    executionId: 'exec_002',
    status: 'completed',
    gmailMessageId: 'msg_xyz789',
    createdAt: new Date(BASE_TIME.getTime() - 60000),
    expiresAt: new Date(BASE_TIME.getTime() + 86400000 - 60000),
    result: { success: true, sentAt: BASE_TIME },
  },

  failed: {
    key: 'idempotent_key_003',
    queuedId: 'queued_003',
    draftId: 'draft_003',
    executionId: 'exec_003',
    status: 'failed',
    createdAt: new Date(BASE_TIME.getTime() - 120000),
    expiresAt: new Date(BASE_TIME.getTime() + 86400000 - 120000),
    result: { error: 'Gmail API error', code: 'AUTH_FAILED' },
  },
};

/**
 * Mock dead-letter entries
 */
export const MOCK_DEAD_LETTER_ENTRIES: Record<string, DeadLetterEntry> = {
  permanent_failure: {
    id: 'dlq_001',
    executionId: 'exec_failed_permanent',
    queuedId: 'queued_fail_001',
    draftId: 'draft_fail_001',
    originalRequest: {
      queuedId: 'queued_fail_001',
      draftId: 'draft_fail_001',
      previewId: 'preview_fail_001',
      approvalId: 'approval_fail_001',
      operator: 'executor@example.com',
      idempotencyKey: 'idempotent_fail_001',
      executeAction: 'send',
    },
    attempts: 3,
    maxRetries: 3,
    finalError: 'Gmail API: Invalid recipient email format',
    failedAt: new Date(BASE_TIME.getTime() - 100000),
    movedAt: new Date(BASE_TIME.getTime() - 50000),
    retriable: false,
  },

  retriable_failure: {
    id: 'dlq_002',
    executionId: 'exec_failed_retriable',
    queuedId: 'queued_fail_002',
    draftId: 'draft_fail_002',
    originalRequest: {
      queuedId: 'queued_fail_002',
      draftId: 'draft_fail_002',
      previewId: 'preview_fail_002',
      approvalId: 'approval_fail_002',
      operator: 'executor@example.com',
      idempotencyKey: 'idempotent_fail_002',
      executeAction: 'send',
    },
    attempts: 3,
    maxRetries: 3,
    finalError: 'Gmail API: Service temporarily unavailable',
    failedAt: new Date(BASE_TIME.getTime() - 200000),
    movedAt: new Date(BASE_TIME.getTime() - 150000),
    retriable: true,
  },
};

/**
 * Mock audit events
 */
export const MOCK_AUDIT_EVENTS: Record<string, ExecutionAuditEvent[]> = {
  execution_001: [
    {
      id: 'audit_001',
      executionId: 'exec_001',
      eventType: 'execution_started',
      operator: 'executor@example.com',
      timestamp: new Date(BASE_TIME.getTime()),
      details: {
        newState: 'running',
        attemptNumber: 1,
      },
      immutable: true,
    },
    {
      id: 'audit_002',
      executionId: 'exec_001',
      eventType: 'execution_safety_checked',
      operator: 'executor@example.com',
      timestamp: new Date(BASE_TIME.getTime() + 100),
      details: {
        reason: 'All safety checks passed',
      },
      immutable: true,
    },
    {
      id: 'audit_003',
      executionId: 'exec_001',
      eventType: 'gmail_send_completed',
      operator: 'executor@example.com',
      timestamp: new Date(BASE_TIME.getTime() + 2000),
      details: {
        newState: 'completed',
        gmailMessageId: 'msg_abc123',
      },
      immutable: true,
    },
  ],

  execution_failed: [
    {
      id: 'audit_004',
      executionId: 'exec_failed',
      eventType: 'execution_started',
      operator: 'executor@example.com',
      timestamp: new Date(BASE_TIME.getTime()),
      details: {
        newState: 'running',
        attemptNumber: 1,
      },
      immutable: true,
    },
    {
      id: 'audit_005',
      executionId: 'exec_failed',
      eventType: 'execution_failed',
      operator: 'executor@example.com',
      timestamp: new Date(BASE_TIME.getTime() + 500),
      details: {
        oldState: 'running',
        newState: 'failed',
        error: 'Gmail API error',
        attemptNumber: 1,
      },
      immutable: true,
    },
    {
      id: 'audit_006',
      executionId: 'exec_failed',
      eventType: 'execution_retried',
      operator: 'system',
      timestamp: new Date(BASE_TIME.getTime() + 5100),
      details: {
        newState: 'waiting',
        attemptNumber: 2,
      },
      immutable: true,
    },
  ],
};

/**
 * Mock execution metrics
 */
export const MOCK_EXECUTION_METRICS = {
  healthy: {
    totalExecuted: 156,
    completed: 148,
    failed: 4,
    cancelled: 2,
    deadLettered: 2,
    successRate: 94.9,
    avgRetries: 0.3,
    totalRetries: 8,
    avgExecutionTimeSeconds: 2.4,
    lastExecutedAt: BASE_TIME,
  },

  stressed: {
    totalExecuted: 250,
    completed: 210,
    failed: 28,
    cancelled: 8,
    deadLettered: 4,
    successRate: 84.0,
    avgRetries: 0.8,
    totalRetries: 48,
    avgExecutionTimeSeconds: 5.1,
    lastExecutedAt: BASE_TIME,
  },
};
