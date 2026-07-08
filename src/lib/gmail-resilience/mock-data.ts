/**
 * Gmail Resilience Mock Data
 * 
 * Deterministic test data with fixed BASE_TIME for reproducible resilience testing
 */

import type {
  FailureMetadata,
  ExecutionFailure,
  DeadLetterRecord,
  ReceiptVerification,
  DuplicateDetectionResult,
  OAuthRefreshStatus,
  ResilienceMetrics,
} from './types';

/**
 * Fixed base time for all mock data (2026-07-01 10:00:00Z)
 */
export const BASE_TIME = new Date('2026-07-01T10:00:00Z');

/**
 * Helper to generate relative timestamps
 */
export const relativeTime = (offsetMs: number): Date => {
  return new Date(BASE_TIME.getTime() + offsetMs);
};

/**
 * FAILURE CLASSIFICATIONS
 */

export const MOCK_FAILURE_CLASSIFICATIONS: Record<string, FailureMetadata> = {
  transient: {
    classification: 'transient',
    retryable: true,
    severity: 'low',
    recommendedAction: 'retry',
    auditEvent: 'gmail_transient_failure',
    operatorMessage: 'Temporary failure detected. Will retry automatically.',
  },
  rate_limited: {
    classification: 'rate_limited',
    retryable: true,
    severity: 'medium',
    recommendedAction: 'retry',
    auditEvent: 'gmail_rate_limited',
    operatorMessage: 'Rate limit reached. Backing off and retrying.',
  },
  auth_expired: {
    classification: 'auth_expired',
    retryable: true,
    severity: 'high',
    recommendedAction: 'refresh_oauth',
    auditEvent: 'gmail_auth_expired',
    operatorMessage: 'OAuth token expired. Refreshing credentials.',
  },
  auth_invalid: {
    classification: 'auth_invalid',
    retryable: false,
    severity: 'critical',
    recommendedAction: 'dead_letter',
    auditEvent: 'gmail_auth_invalid',
    operatorMessage: 'Invalid authentication. Manual intervention required.',
  },
  permission_denied: {
    classification: 'permission_denied',
    retryable: false,
    severity: 'critical',
    recommendedAction: 'escalate',
    auditEvent: 'gmail_permission_denied',
    operatorMessage: 'Permission denied. Check Gmail API permissions.',
  },
  quota_exceeded: {
    classification: 'quota_exceeded',
    retryable: true,
    severity: 'high',
    recommendedAction: 'check_quota',
    auditEvent: 'gmail_quota_exceeded',
    operatorMessage: 'API quota exceeded. Will retry after cooldown.',
  },
  validation_error: {
    classification: 'validation_error',
    retryable: false,
    severity: 'medium',
    recommendedAction: 'manual_review',
    auditEvent: 'gmail_validation_error',
    operatorMessage: 'Validation failed. Check draft composition.',
  },
  duplicate_detected: {
    classification: 'duplicate_detected',
    retryable: false,
    severity: 'low',
    recommendedAction: 'dead_letter',
    auditEvent: 'gmail_duplicate_blocked',
    operatorMessage: 'Duplicate draft blocked. Using existing receipt.',
  },
  network_error: {
    classification: 'network_error',
    retryable: true,
    severity: 'medium',
    recommendedAction: 'retry',
    auditEvent: 'gmail_network_error',
    operatorMessage: 'Network error detected. Retrying connection.',
  },
  gmail_unavailable: {
    classification: 'gmail_unavailable',
    retryable: true,
    severity: 'high',
    recommendedAction: 'retry',
    auditEvent: 'gmail_service_unavailable',
    operatorMessage: 'Gmail service temporarily unavailable. Will retry.',
  },
  permanent_failure: {
    classification: 'permanent_failure',
    retryable: false,
    severity: 'critical',
    recommendedAction: 'dead_letter',
    auditEvent: 'gmail_permanent_failure',
    operatorMessage: 'Permanent failure. Item dead-lettered.',
  },
  unknown_failure: {
    classification: 'unknown_failure',
    retryable: false,
    severity: 'high',
    recommendedAction: 'manual_review',
    auditEvent: 'gmail_unknown_failure',
    operatorMessage: 'Unknown failure. Manual review recommended.',
  },
};

/**
 * EXECUTION FAILURES
 */

export const MOCK_EXECUTION_FAILURE_TRANSIENT: ExecutionFailure = {
  id: `failure_${Date.now()}_transient`,
  executionId: 'exec_001_transient',
  draftReceiptId: 'receipt_001_transient',
  failureClassification: MOCK_FAILURE_CLASSIFICATIONS.transient,
  originalError: 'ETIMEDOUT: connection timeout',
  timestamp: BASE_TIME,
  attemptCount: 1,
  nextRetryScheduled: relativeTime(5000),
  retryAttempts: [
    {
      attemptNumber: 1,
      scheduledFor: relativeTime(5000),
      result: 'pending',
    },
  ],
  isDead: false,
  auditIds: ['audit_001'],
};

export const MOCK_EXECUTION_FAILURE_RATE_LIMITED: ExecutionFailure = {
  id: `failure_${Date.now()}_rate_limited`,
  executionId: 'exec_002_rate_limited',
  draftReceiptId: 'receipt_002_rate_limited',
  failureClassification: MOCK_FAILURE_CLASSIFICATIONS.rate_limited,
  originalError: 'Rate Limit Exceeded (429)',
  timestamp: relativeTime(1000),
  attemptCount: 1,
  nextRetryScheduled: relativeTime(11000),
  retryAttempts: [
    {
      attemptNumber: 1,
      scheduledFor: relativeTime(11000),
      result: 'pending',
    },
  ],
  isDead: false,
  auditIds: ['audit_002'],
};

export const MOCK_EXECUTION_FAILURE_AUTH_EXPIRED: ExecutionFailure = {
  id: `failure_${Date.now()}_auth_expired`,
  executionId: 'exec_003_auth_expired',
  draftReceiptId: 'receipt_003_auth_expired',
  failureClassification: MOCK_FAILURE_CLASSIFICATIONS.auth_expired,
  originalError: 'Invalid Credentials (401)',
  timestamp: relativeTime(2000),
  attemptCount: 1,
  nextRetryScheduled: relativeTime(7000),
  retryAttempts: [
    {
      attemptNumber: 1,
      scheduledFor: relativeTime(7000),
      result: 'pending',
    },
  ],
  isDead: false,
  auditIds: ['audit_003'],
};

export const MOCK_EXECUTION_FAILURE_DEAD_LETTER: ExecutionFailure = {
  id: `failure_${Date.now()}_dead_letter`,
  executionId: 'exec_004_dead_letter',
  draftReceiptId: 'receipt_004_dead_letter',
  failureClassification: MOCK_FAILURE_CLASSIFICATIONS.permission_denied,
  originalError: 'Permission Denied (403)',
  timestamp: relativeTime(3000),
  attemptCount: 1,
  isDead: true,
  deadLetterReason: 'Non-retryable failure: permission_denied',
  auditIds: ['audit_004'],
  retryAttempts: [],
};

/**
 * DEAD LETTER RECORDS
 */

export const MOCK_DEAD_LETTER_RECORD_PERMISSION: DeadLetterRecord = {
  id: `dlq_001_permission`,
  executionId: 'exec_004_dead_letter',
  draftReceiptId: 'receipt_004_dead_letter',
  failureClass: 'permission_denied',
  reason: 'Gmail API scope not granted',
  attempts: 1,
  lastError: 'Permission Denied (403)',
  operatorMessage: 'Check Gmail API permissions in Google Cloud Console',
  auditIds: ['audit_004', 'audit_004_dlq'],
  recommendedRecovery: 'escalate',
  createdAt: relativeTime(3000),
  expiresAt: relativeTime(30 * 24 * 60 * 60 * 1000), // 30 days
};

export const MOCK_DEAD_LETTER_RECORD_INVALID_TOKEN: DeadLetterRecord = {
  id: `dlq_002_invalid_token`,
  executionId: 'exec_auth_invalid',
  failureClass: 'auth_invalid',
  reason: 'OAuth token could not be refreshed',
  attempts: 3,
  lastError: 'Invalid refresh token',
  operatorMessage: 'User needs to re-authenticate Gmail account',
  auditIds: ['audit_005', 'audit_006', 'audit_007'],
  recommendedRecovery: 'manual_review',
  createdAt: relativeTime(4000),
  expiresAt: relativeTime(30 * 24 * 60 * 60 * 1000), // 30 days
};

/**
 * RECEIPT VERIFICATIONS
 */

export const MOCK_RECEIPT_VERIFICATION_VALID: ReceiptVerification = {
  valid: true,
  draftId: 'draft_001_verified',
  threadId: 'thread_001',
  gmailAccount: 'test@gmail.com',
  executionId: 'exec_receipt_valid',
  idempotencyKey: 'idempotency_receipt_valid',
  createdAt: BASE_TIME,
  mimeHash: 'hash_receipt_valid_sha256',
  auditId: 'audit_receipt_valid',
  mode: 'simulation',
};

export const MOCK_RECEIPT_VERIFICATION_INVALID: ReceiptVerification = {
  valid: false,
  missingFields: ['draftId', 'mimeHash'],
  errors: ['Draft ID is required', 'MIME hash is required for idempotency validation'],
};

/**
 * DUPLICATE DETECTION RESULTS
 */

export const MOCK_DUPLICATE_DETECTION_IDEMPOTENCY_KEY: DuplicateDetectionResult = {
  isDuplicate: true,
  reason: 'idempotency_key',
  existingReceiptId: 'receipt_existing_001',
  existingExecutionId: 'exec_existing_001',
  existingDraftId: 'draft_existing_001',
};

export const MOCK_DUPLICATE_DETECTION_MIME_HASH: DuplicateDetectionResult = {
  isDuplicate: true,
  reason: 'mime_hash',
  existingReceiptId: 'receipt_existing_002',
  existingExecutionId: 'exec_existing_002',
  existingDraftId: 'draft_existing_002',
  details: {
    mimeHashMatched: 'hash_same_content_sha256',
    withinTimeWindow: true,
    timeWindowMs: 3600000,
  },
};

export const MOCK_DUPLICATE_DETECTION_NO_DUPLICATE: DuplicateDetectionResult = {
  isDuplicate: false,
};

/**
 * OAUTH REFRESH STATUS
 */

export const MOCK_OAUTH_REFRESH_SUCCESS: OAuthRefreshStatus = {
  success: true,
  tokenRefreshed: true,
  newTokenExpiry: relativeTime(3600000), // 1 hour from base time
  isExpired: false,
  needsRefresh: false,
  refreshedAt: BASE_TIME,
};

export const MOCK_OAUTH_REFRESH_FAILURE: OAuthRefreshStatus = {
  success: false,
  tokenRefreshed: false,
  error: 'Invalid refresh token',
  isExpired: true,
  needsRefresh: true,
};

export const MOCK_OAUTH_TOKEN_ALREADY_VALID: OAuthRefreshStatus = {
  success: true,
  tokenRefreshed: false,
  isExpired: false,
  needsRefresh: false,
};

/**
 * RESILIENCE METRICS
 */

export const MOCK_RESILIENCE_METRICS_HEALTHY: ResilienceMetrics = {
  failureCount: 5,
  retryableFailureCount: 3,
  deadLetterCount: 2,
  duplicateBlockedCount: 0,
  oauthRefreshRecoveryCount: 1,
  receiptVerificationScore: 98,
  resilienceScore: 95,
  safetyScore: 99,
  healthScore: 97,
  totalExecutions: 500,
  successCount: 495,
  failureRate: 0.01,
  recoveryRate: 0.6,
};

export const MOCK_RESILIENCE_METRICS_DEGRADED: ResilienceMetrics = {
  failureCount: 45,
  retryableFailureCount: 30,
  deadLetterCount: 15,
  duplicateBlockedCount: 5,
  oauthRefreshRecoveryCount: 8,
  receiptVerificationScore: 85,
  resilienceScore: 72,
  safetyScore: 91,
  healthScore: 82,
  totalExecutions: 500,
  successCount: 455,
  failureRate: 0.09,
  recoveryRate: 0.67,
};
