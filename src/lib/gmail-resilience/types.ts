/**
 * Gmail Resilience Types
 * 
 * Failure classification, retry policies, and recovery mechanisms
 * for Gmail Draft API execution with deterministic retry scheduling.
 */

/**
 * Failure classification types
 */
export type FailureClassification =
  | 'transient'
  | 'rate_limited'
  | 'auth_expired'
  | 'auth_invalid'
  | 'permission_denied'
  | 'quota_exceeded'
  | 'validation_error'
  | 'duplicate_detected'
  | 'network_error'
  | 'gmail_unavailable'
  | 'permanent_failure'
  | 'unknown_failure';

/**
 * Severity levels for failures
 */
export type FailureSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Recommended actions for operator guidance
 */
export type RecommendedAction =
  | 'retry'
  | 'refresh_oauth'
  | 'check_approval'
  | 'check_quota'
  | 'manual_review'
  | 'dead_letter'
  | 'escalate';

/**
 * Classification metadata for a specific failure
 */
export interface FailureMetadata {
  classification: FailureClassification;
  retryable: boolean;
  severity: FailureSeverity;
  recommendedAction: RecommendedAction;
  auditEvent: string;
  operatorMessage: string;
  details?: Record<string, any>;
}

/**
 * Retry policy configuration
 */
export interface RetryPolicy {
  maxAttempts: number;
  retryIntervals: number[]; // milliseconds, deterministic
  backoffMultiplier?: number;
  retryableClasses: FailureClassification[];
}

/**
 * Retry attempt record
 */
export interface RetryAttempt {
  attemptNumber: number;
  scheduledFor: Date;
  executedAt?: Date;
  result?: 'success' | 'failed' | 'pending';
  error?: string;
}

/**
 * Execution failure record
 */
export interface ExecutionFailure {
  id: string;
  executionId: string;
  draftReceiptId?: string;
  failureClassification: FailureMetadata;
  originalError: string;
  timestamp: Date;
  attemptCount: number;
  nextRetryScheduled?: Date;
  retryAttempts: RetryAttempt[];
  isDead: boolean;
  deadLetterReason?: string;
  auditIds: string[];
}

/**
 * Dead letter queue record
 */
export interface DeadLetterRecord {
  id: string;
  executionId: string;
  draftReceiptId?: string;
  failureClass: FailureClassification;
  reason: string;
  attempts: number;
  lastError: string;
  operatorMessage: string;
  auditIds: string[];
  recommendedRecovery: RecommendedAction;
  createdAt: Date;
  expiresAt: Date;
  metadata?: Record<string, any>;
}

/**
 * Receipt verification result
 */
export interface ReceiptVerification {
  valid: boolean;
  draftId?: string;
  threadId?: string;
  gmailAccount?: string;
  executionId?: string;
  idempotencyKey?: string;
  createdAt?: Date;
  mimeHash?: string;
  auditId?: string;
  mode?: 'simulation' | 'live';
  missingFields?: string[];
  errors?: string[];
}

/**
 * Duplicate detection result
 */
export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  reason?: 'idempotency_key' | 'mime_hash' | 'receipt_id' | 'approval_id' | 'queued_execution';
  existingReceiptId?: string;
  existingExecutionId?: string;
  existingDraftId?: string;
  details?: Record<string, any>;
}

/**
 * OAuth refresh status
 */
export interface OAuthRefreshStatus {
  success: boolean;
  tokenRefreshed: boolean;
  newTokenExpiry?: Date;
  error?: string;
  isExpired?: boolean;
  needsRefresh?: boolean;
  refreshedAt?: Date;
}

/**
 * Resilience metrics
 */
export interface ResilienceMetrics {
  failureCount: number;
  retryableFailureCount: number;
  deadLetterCount: number;
  duplicateBlockedCount: number;
  oauthRefreshRecoveryCount: number;
  receiptVerificationScore: number; // 0-100
  resilienceScore: number; // 0-100
  safetyScore: number; // 0-100
  healthScore: number; // 0-100
  totalExecutions: number;
  successCount: number;
  failureRate: number; // 0-1
  recoveryRate: number; // 0-1
}

/**
 * Resilience status response
 */
export interface ResilienceStatus {
  metrics: ResilienceMetrics;
  recentFailures: ExecutionFailure[];
  deadLetterQueue: DeadLetterRecord[];
  lastUpdated: Date;
}
