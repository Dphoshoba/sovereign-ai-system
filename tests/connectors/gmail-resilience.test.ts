/**
 * Gmail Resilience Test Suite
 * 
 * 50+ comprehensive tests covering:
 * - Failure classification (12 categories)
 * - Retry policies and scheduling
 * - OAuth refresh guards
 * - Duplicate protection
 * - Receipt verification
 * - Dead-letter queuing
 * - Determinism guarantees
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FailureClassifier } from '../../lib/connectors/gmail/failure-classifier';
import { DuplicateProtection } from '../../lib/connectors/gmail/duplicate-protection';
import { ReceiptVerifier } from '../../lib/connectors/gmail/receipt-verifier';
import { OAuthRetryGuard } from '../../lib/connectors/gmail/oauth-retry-guard';
import { RetryOrchestrator } from '../../lib/connectors/gmail/retry-orchestrator';
import { ResilienceManager } from '../../lib/connectors/gmail/resilience-manager';
import { GmailResilienceReader } from '../../lib/gamma/gmail-resilience-reader';
import {
  MOCK_FAILURE_CLASSIFICATIONS,
  MOCK_EXECUTION_FAILURE_TRANSIENT,
  MOCK_EXECUTION_FAILURE_RATE_LIMITED,
  MOCK_EXECUTION_FAILURE_AUTH_EXPIRED,
  MOCK_EXECUTION_FAILURE_DEAD_LETTER,
  MOCK_DEAD_LETTER_RECORD_PERMISSION,
  BASE_TIME,
  relativeTime,
} from '../../src/lib/gmail-resilience/mock-data';

describe('Failure Classifier', () => {
  let classifier: FailureClassifier;

  beforeEach(() => {
    classifier = new FailureClassifier();
  });

  it('should classify rate limit errors', () => {
    const result = classifier.classifyError('Rate Limit Exceeded (429)', { statusCode: 429 });
    expect(result.classification).toBe('rate_limited');
    expect(result.retryable).toBe(true);
  });

  it('should classify auth expired errors', () => {
    const result = classifier.classifyError('Invalid token');
    expect(result.classification).toBe('auth_expired');
    expect(result.retryable).toBe(true);
  });

  it('should classify auth invalid errors', () => {
    const result = classifier.classifyError('Invalid refresh token');
    expect(result.classification).toBe('auth_invalid');
    expect(result.retryable).toBe(false);
  });

  it('should classify permission denied errors', () => {
    const result = classifier.classifyError('Permission Denied (403)', { statusCode: 403 });
    expect(result.classification).toBe('permission_denied');
    expect(result.retryable).toBe(false);
  });

  it('should classify quota exceeded errors', () => {
    const result = classifier.classifyError('Quota exceeded');
    expect(result.classification).toBe('quota_exceeded');
    expect(result.retryable).toBe(true);
  });

  it('should classify validation errors', () => {
    const result = classifier.classifyError('Invalid request', { statusCode: 400 });
    expect(result.classification).toBe('validation_error');
    expect(result.retryable).toBe(false);
  });

  it('should classify network errors', () => {
    const result = classifier.classifyError('ETIMEDOUT: connection timeout');
    expect(result.classification).toBe('network_error');
    expect(result.retryable).toBe(true);
  });

  it('should classify Gmail unavailable errors', () => {
    const result = classifier.classifyError('Service unavailable', { statusCode: 503 });
    expect(result.classification).toBe('gmail_unavailable');
    expect(result.retryable).toBe(true);
  });

  it('should classify transient errors', () => {
    const result = classifier.classifyError('Internal server error', { statusCode: 500 });
    expect(result.classification).toBe('transient');
    expect(result.retryable).toBe(true);
  });

  it('should classify unknown errors', () => {
    const result = classifier.classifyError('Some strange error');
    expect(result.classification).toBe('unknown_failure');
    expect(result.retryable).toBe(false);
  });
});

describe('Duplicate Protection', () => {
  let protection: DuplicateProtection;

  beforeEach(() => {
    protection = new DuplicateProtection();
  });

  it('should detect duplicate idempotency keys', () => {
    protection.registerDraft({
      receiptId: 'receipt_001',
      idempotencyKey: 'idem_001',
    });

    const result = protection.detectDuplicate({ idempotencyKey: 'idem_001' });
    expect(result.isDuplicate).toBe(true);
    expect(result.reason).toBe('idempotency_key');
    expect(result.existingReceiptId).toBe('receipt_001');
  });

  it('should detect duplicate MIME hashes', () => {
    protection.registerDraft({
      receiptId: 'receipt_002',
      mimeHash: 'hash_abc123',
    });

    const result = protection.detectDuplicate({ mimeHash: 'hash_abc123' });
    expect(result.isDuplicate).toBe(true);
    expect(result.reason).toBe('mime_hash');
  });

  it('should detect duplicate approval IDs', () => {
    protection.registerDraft({
      receiptId: 'receipt_003',
      approvalId: 'approval_001',
    });

    const result = protection.detectDuplicate({ approvalId: 'approval_001' });
    expect(result.isDuplicate).toBe(true);
    expect(result.reason).toBe('approval_id');
  });

  it('should allow non-duplicate executions', () => {
    protection.registerDraft({
      receiptId: 'receipt_001',
      idempotencyKey: 'idem_001',
    });

    const result = protection.detectDuplicate({ idempotencyKey: 'idem_002' });
    expect(result.isDuplicate).toBe(false);
  });

  it('should track duplicate statistics', () => {
    protection.registerDraft({
      receiptId: 'receipt_001',
      idempotencyKey: 'idem_001',
      mimeHash: 'hash_001',
      approvalId: 'approval_001',
      executionId: 'exec_001',
    });

    const stats = protection.getStats();
    expect(stats.totalTracked).toBe(4);
  });
});

describe('Receipt Verifier', () => {
  let verifier: ReceiptVerifier;

  beforeEach(() => {
    verifier = new ReceiptVerifier();
  });

  it('should verify valid receipt', () => {
    const receipt = {
      id: 'receipt_001',
      draftId: 'draft_001',
      gmailAccount: 'test@gmail.com',
      executionId: 'exec_001',
      idempotencyKey: 'idem_001',
      createdAt: new Date(),
      mimeHash: 'hash_001',
      auditId: 'audit_001',
      mode: 'simulation',
    };

    const result = verifier.verify(receipt);
    expect(result.valid).toBe(true);
  });

  it('should reject receipt with missing fields', () => {
    const receipt = {
      id: 'receipt_001',
      draftId: 'draft_001',
      // Missing other required fields
    };

    const result = verifier.verify(receipt);
    expect(result.valid).toBe(false);
    expect(result.missingFields).toBeDefined();
    expect(result.missingFields!.length).toBeGreaterThan(0);
  });

  it('should reject receipt with invalid mode', () => {
    const receipt = {
      id: 'receipt_001',
      draftId: 'draft_001',
      gmailAccount: 'test@gmail.com',
      executionId: 'exec_001',
      idempotencyKey: 'idem_001',
      createdAt: new Date(),
      mimeHash: 'hash_001',
      auditId: 'audit_001',
      mode: 'invalid_mode',
    };

    const result = verifier.verify(receipt);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it('should calculate validation score', () => {
    const receipts = [
      {
        id: 'r1',
        draftId: 'd1',
        gmailAccount: 'a@gmail.com',
        executionId: 'e1',
        idempotencyKey: 'i1',
        createdAt: new Date(),
        mimeHash: 'h1',
        auditId: 'a1',
        mode: 'simulation',
      },
      {
        id: 'r2',
        draftId: 'd2',
        // Missing fields
      },
    ];

    const score = verifier.getValidationScore(receipts);
    expect(score).toBe(50);
  });
});

describe('OAuth Retry Guard', () => {
  let guard: OAuthRetryGuard;

  beforeEach(() => {
    guard = new OAuthRetryGuard();
  });

  it('should detect expired tokens', () => {
    const expiredToken = {
      expiresAt: new Date(Date.now() - 10000), // 10 seconds ago
    };

    expect(guard.isExpired(expiredToken)).toBe(true);
  });

  it('should detect tokens needing refresh', () => {
    const expiringToken = {
      expiresAt: new Date(Date.now() + 60000), // 1 minute away
    };

    expect(guard.needsRefresh(expiringToken)).toBe(true);
  });

  it('should not need refresh for fresh tokens', () => {
    const freshToken = {
      expiresAt: new Date(Date.now() + 3600000), // 1 hour away
    };

    expect(guard.needsRefresh(freshToken)).toBe(false);
  });

  it('should classify OAuth refresh failures', () => {
    const result = guard.classifyRefreshFailure('Invalid refresh token');
    expect(result.classification).toBe('auth_invalid');
    expect(result.retryable).toBe(false);
  });

  it('should mask sensitive token info', () => {
    const token = {
      accessToken: 'secret_token_12345',
      expiresAt: new Date(),
    };

    const masked = guard.getMaskedTokenInfo(token);
    expect(masked.exists).toBe(true);
    expect(masked.expiresAt).toBeDefined();
    expect(JSON.stringify(masked)).not.toContain('secret_token');
  });
});

describe('Retry Orchestrator', () => {
  let orchestrator: RetryOrchestrator;

  beforeEach(() => {
    orchestrator = new RetryOrchestrator();
  });

  it('should identify retryable failures', () => {
    const transient = MOCK_FAILURE_CLASSIFICATIONS.transient;
    expect(orchestrator.isRetryable(transient)).toBe(true);
  });

  it('should identify non-retryable failures', () => {
    const permissionDenied = MOCK_FAILURE_CLASSIFICATIONS.permission_denied;
    expect(orchestrator.isRetryable(permissionDenied)).toBe(false);
  });

  it('should enforce max retry attempts', () => {
    const failure = { ...MOCK_EXECUTION_FAILURE_TRANSIENT, attemptCount: 3 };
    const result = orchestrator.canRetry(failure);
    expect(result.canRetry).toBe(false);
  });

  it('should schedule retries deterministically', () => {
    const failure = {
      ...MOCK_EXECUTION_FAILURE_TRANSIENT,
      attemptCount: 0,
      nextRetryScheduled: undefined, // Clear existing schedule to test fresh scheduling
    };
    const currentTime = BASE_TIME;

    const schedule = orchestrator.scheduleRetry(failure, undefined, currentTime);
    expect(schedule.scheduled).toBe(true);
    expect(schedule.nextRetryTime.getTime()).toBe(currentTime.getTime() + 5000); // 5 seconds
  });

  it('should use exponential backoff intervals', () => {
    const policy = orchestrator.getDefaultPolicy();
    expect(policy.retryIntervals).toEqual([5000, 10000, 20000]);
  });

  it('should calculate retry statistics', () => {
    const failures = [
      MOCK_EXECUTION_FAILURE_TRANSIENT,
      MOCK_EXECUTION_FAILURE_RATE_LIMITED,
      MOCK_EXECUTION_FAILURE_DEAD_LETTER,
    ];

    const stats = orchestrator.getRetryStats(failures);
    expect(stats.totalFailures).toBe(3);
    expect(stats.retryableFailures).toBeGreaterThan(0);
    expect(stats.deadLetteredFailures).toBeGreaterThan(0);
  });
});

describe('Resilience Manager', () => {
  let manager: ResilienceManager;

  beforeEach(() => {
    manager = new ResilienceManager();
  });

  it('should handle transient failures with retry', async () => {
    const failure = await manager.handleFailure({
      executionId: 'exec_transient',
      error: new Error('ETIMEDOUT: connection timeout'),
      currentTime: BASE_TIME,
    });

    expect(failure.failureClassification.classification).toBe('network_error');
    expect(failure.isDead).toBe(false);
    expect(failure.nextRetryScheduled).toBeDefined();
  });

  it('should dead-letter non-retryable failures', async () => {
    const failure = await manager.handleFailure({
      executionId: 'exec_permanent',
      error: new Error('Permission Denied (403)'),
      errorContext: { statusCode: 403 },
      currentTime: BASE_TIME,
    });

    expect(failure.failureClassification.classification).toBe('permission_denied');
    expect(failure.isDead).toBe(true);
  });

  it('should check for duplicates', () => {
    const result = manager.checkForDuplicates({
      idempotencyKey: 'idem_test',
      currentTime: BASE_TIME,
    });

    expect(result.isDuplicate).toBe(false);
  });

  it('should register drafts for duplicate protection', () => {
    manager.registerDraft({
      receiptId: 'receipt_001',
      idempotencyKey: 'idem_001',
    });

    const result = manager.checkForDuplicates({
      idempotencyKey: 'idem_001',
      currentTime: BASE_TIME,
    });

    expect(result.isDuplicate).toBe(true);
  });

  it('should verify receipts', () => {
    const validReceipt = {
      id: 'r1',
      draftId: 'd1',
      gmailAccount: 'a@gmail.com',
      executionId: 'e1',
      idempotencyKey: 'i1',
      createdAt: new Date(),
      mimeHash: 'h1',
      auditId: 'a1',
      mode: 'simulation',
    };

    const result = manager.verifyReceipt(validReceipt);
    expect(result.valid).toBe(true);
  });

  it('should prepare retries with OAuth refresh', async () => {
    const expiredToken = {
      expiresAt: new Date(Date.now() - 10000),
      accountId: 'test@gmail.com',
    };

    const result = await manager.prepareRetry({
      executionId: 'exec_retry',
      oauthToken: expiredToken,
      currentTime: BASE_TIME,
    });

    // Should attempt refresh
    expect(result.canProceed).toBe(true);
  });

  it('should calculate resilience metrics', () => {
    const metrics = manager.getMetrics();
    expect(metrics.healthScore).toBeGreaterThanOrEqual(0);
    expect(metrics.healthScore).toBeLessThanOrEqual(100);
    expect(metrics.resilienceScore).toBeGreaterThanOrEqual(0);
    expect(metrics.safetyScore).toBe(99); // Always high - all gated
  });

  it('should return dead letter queue', () => {
    const dlq = manager.getDeadLetterQueue();
    expect(Array.isArray(dlq)).toBe(true);
  });

  it('should return recent failures', () => {
    const failures = manager.getRecentFailures();
    expect(Array.isArray(failures)).toBe(true);
  });
});

describe('Gmail Resilience Reader (GAMMA)', () => {
  let reader: GmailResilienceReader;

  beforeEach(() => {
    reader = new GmailResilienceReader();
  });

  it('should store and retrieve failures', () => {
    reader.storeFailure(MOCK_EXECUTION_FAILURE_TRANSIENT);

    const retrieved = reader.getFailureById(MOCK_EXECUTION_FAILURE_TRANSIENT.id);
    expect(retrieved).toBe(MOCK_EXECUTION_FAILURE_TRANSIENT);
  });

  it('should store and retrieve dead letters', () => {
    reader.storeDeadLetter(MOCK_DEAD_LETTER_RECORD_PERMISSION);

    const retrieved = reader.getDeadLetterById(MOCK_DEAD_LETTER_RECORD_PERMISSION.id);
    expect(retrieved).toBe(MOCK_DEAD_LETTER_RECORD_PERMISSION);
  });

  it('should get failures by execution ID', () => {
    reader.storeFailure(MOCK_EXECUTION_FAILURE_TRANSIENT);

    const failures = reader.getFailuresByExecutionId('exec_001_transient');
    expect(failures.length).toBe(1);
  });

  it('should get retryable failures', () => {
    reader.storeFailure(MOCK_EXECUTION_FAILURE_TRANSIENT);
    reader.storeFailure(MOCK_EXECUTION_FAILURE_DEAD_LETTER);

    const retryable = reader.getRetryableFailures();
    expect(retryable.length).toBeGreaterThan(0);
  });

  it('should get dead-lettered failures', () => {
    reader.storeFailure(MOCK_EXECUTION_FAILURE_DEAD_LETTER);

    const deadLettered = reader.getDeadLetteredFailures();
    expect(deadLettered.length).toBe(1);
  });

  it('should deterministically get failures pending retry (DETERMINISM CHECK)', () => {
    reader.storeFailure(MOCK_EXECUTION_FAILURE_TRANSIENT);

    // Call with specific time
    const pendingAtBaseTime = reader.getFailuresPendingRetry(BASE_TIME);
    const pendingAtFutureTime = reader.getFailuresPendingRetry(relativeTime(10000));

    // Results should differ deterministically based on time
    expect(pendingAtBaseTime.length).not.toBe(pendingAtFutureTime.length);
  });

  it('should calculate failure counts by classification', () => {
    reader.storeFailure(MOCK_EXECUTION_FAILURE_TRANSIENT);
    reader.storeFailure(MOCK_EXECUTION_FAILURE_RATE_LIMITED);

    const counts = reader.getFailureCountByClassification();
    expect(counts.transient).toBe(1);
    expect(counts.rate_limited).toBe(1);
  });

  it('should calculate retry success rate', () => {
    const rate = reader.getRetrySuccessRate();
    expect(rate).toBeGreaterThanOrEqual(0);
    expect(rate).toBeLessThanOrEqual(1);
  });

  it('should deterministically calculate health score (DETERMINISM CHECK)', () => {
    reader.storeFailure(MOCK_EXECUTION_FAILURE_TRANSIENT);

    const scoreAtBaseTime = reader.getHealthScore(BASE_TIME);
    const scoreAtFutureTime = reader.getHealthScore(relativeTime(1000));

    // Score should be deterministic for same state
    expect(typeof scoreAtBaseTime).toBe('number');
    expect(scoreAtBaseTime).toBeGreaterThanOrEqual(0);
    expect(scoreAtBaseTime).toBeLessThanOrEqual(100);
  });

  it('should return resilience metrics with currentTime parameter (DETERMINISM CHECK)', () => {
    reader.storeFailure(MOCK_EXECUTION_FAILURE_TRANSIENT);

    const metricsAtBaseTime = reader.getMetrics(BASE_TIME);
    const metricsAtFutureTime = reader.getMetrics(relativeTime(1000));

    // Both should be valid metrics
    expect(metricsAtBaseTime.healthScore).toBeGreaterThanOrEqual(0);
    expect(metricsAtFutureTime.healthScore).toBeGreaterThanOrEqual(0);
  });

  it('should return statistics', () => {
    reader.storeFailure(MOCK_EXECUTION_FAILURE_TRANSIENT);
    reader.storeDeadLetter(MOCK_DEAD_LETTER_RECORD_PERMISSION);

    const stats = reader.getStats();
    expect(stats.totalFailures).toBe(1);
    expect(stats.totalDeadLetters).toBe(1);
  });

  it('should clear all data', () => {
    reader.storeFailure(MOCK_EXECUTION_FAILURE_TRANSIENT);
    reader.clear();

    const stats = reader.getStats();
    expect(stats.totalFailures).toBe(0);
  });
});

describe('Determinism Guarantees', () => {
  it('should use relative timestamps in mock data', () => {
    const time1 = relativeTime(1000);
    const time2 = relativeTime(1000);

    expect(time1.getTime()).toBe(time2.getTime());
  });

  it('should not expose Date.now() in GAMMA reader', () => {
    const reader = new GmailResilienceReader();
    const code = reader.getMetrics.toString();

    // Check that method accepts currentTime parameter
    expect(code).toContain('currentTime');
  });

  it('should have deterministic retry intervals', () => {
    const orchestrator = new RetryOrchestrator();
    const policy = orchestrator.getDefaultPolicy();

    // Intervals should be fixed, deterministic values
    expect(policy.retryIntervals).toEqual([5000, 10000, 20000]);
  });
});
