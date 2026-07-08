/**
 * Gmail Execution Types
 * Safe controlled execution with strict safety gates
 */

/**
 * Execution state machine
 */
export type ExecutionState = 'waiting' | 'running' | 'completed' | 'failed' | 'cancelled' | 'dead_lettered';

/**
 * Audit event types
 */
export type AuditEventType =
  | 'execution_started'
  | 'execution_safety_checked'
  | 'gmail_draft_created'
  | 'gmail_send_completed'
  | 'execution_failed'
  | 'execution_retried'
  | 'execution_cancelled'
  | 'execution_dead_lettered';

/**
 * Execution request with safety gates
 */
export interface ExecutionRequest {
  queuedId: string;
  draftId: string;
  previewId: string;
  approvalId: string;
  operator: string;
  idempotencyKey: string;
  executeAction: 'create_draft' | 'send'; // 'create_draft' = save to Gmail drafts, 'send' = send immediately
}

/**
 * Execution context with full validation
 */
export interface ExecutionContext {
  id: string; // unique execution ID
  queuedId: string;
  draftId: string;
  previewId: string;
  approvalId: string;
  idempotencyKey: string;
  operator: string;
  executeAction: 'create_draft' | 'send';
  executionState: ExecutionState;
  attemptNumber: number;
  maxRetries: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  gmailMessageId?: string; // from Gmail API response
  error?: string;
  safetyChecksPassed: boolean;
  safetyCheckDetails: SafetyCheckResult;
  retryScheduledAt?: Date; // when next retry will occur
}

/**
 * Safety check result
 */
export interface SafetyCheckResult {
  approvalExists: boolean;
  approvalValid: boolean;
  approvalNotExpired: boolean;
  draftCompositionValid: boolean;
  previewValid: boolean;
  oauthConnected: boolean;
  oauthValid: boolean;
  idempotencyNotDuplicate: boolean;
  allChecksPassed: boolean;
  failureReason?: string;
  checkedAt: Date;
}

/**
 * Execution response
 */
export interface ExecutionResponse {
  success: boolean;
  execution?: ExecutionContext;
  error?: string;
  gmailMessageId?: string;
}

/**
 * Retry schedule (deterministic, no Date.now)
 */
export interface RetrySchedule {
  attemptNumber: number;
  delaySeconds: number; // fixed interval, not random
  maxRetries: number;
  retryAt: Date; // calculated from createdAt + cumulative delays
}

/**
 * Idempotency record
 */
export interface IdempotencyRecord {
  key: string;
  queuedId: string;
  draftId: string;
  executionId: string;
  status: 'pending' | 'completed' | 'failed';
  gmailMessageId?: string;
  createdAt: Date;
  expiresAt: Date; // 24 hours
  result?: any;
}

/**
 * Dead-letter queue entry
 */
export interface DeadLetterEntry {
  id: string;
  executionId: string;
  queuedId: string;
  draftId: string;
  originalRequest: ExecutionRequest;
  attempts: number;
  maxRetries: number;
  finalError: string;
  failedAt: Date;
  movedAt: Date;
  retriable: boolean;
}

/**
 * Execution audit event
 */
export interface ExecutionAuditEvent {
  id: string;
  executionId: string;
  eventType: AuditEventType;
  operator: string;
  timestamp: Date;
  details: {
    oldState?: ExecutionState;
    newState?: ExecutionState;
    reason?: string;
    gmailMessageId?: string;
    error?: string;
    attemptNumber?: number;
  };
  immutable: true; // audit log is append-only
}

/**
 * Execution metrics
 */
export interface ExecutionMetrics {
  totalExecuted: number;
  completed: number;
  failed: number;
  cancelled: number;
  deadLettered: number;
  successRate: number; // 0-100
  avgRetries: number;
  totalRetries: number;
  avgExecutionTimeSeconds: number;
  lastExecutedAt?: Date;
}

/**
 * Safety check policy
 */
export interface SafetyPolicy {
  requireApprovalExists: boolean;
  requireApprovalNotExpired: boolean;
  requireOAuth: boolean;
  requireIdempotencyKey: boolean;
  maxRetries: number;
  retryDelaySeconds: number[];
  deadLetterAfterMaxRetries: boolean;
}

/**
 * Default safety policy
 */
export const DEFAULT_SAFETY_POLICY: SafetyPolicy = {
  requireApprovalExists: true,
  requireApprovalNotExpired: true,
  requireOAuth: true,
  requireIdempotencyKey: true,
  maxRetries: 3,
  retryDelaySeconds: [5, 10, 20], // fixed intervals: 5s, 10s, 20s
  deadLetterAfterMaxRetries: true,
};
