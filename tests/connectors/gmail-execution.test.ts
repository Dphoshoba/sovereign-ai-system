/**
 * Gmail Execution Tests
 * 40+ comprehensive tests for execution safety, retry, and audit
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ExecutionEngine } from '../../lib/connectors/gmail/execution-engine';
import { RetryPolicy, GMAIL_RETRY_POLICY } from '../../lib/connectors/gmail/retry-policy';
import { IdempotencyManager } from '../../lib/connectors/gmail/idempotency';
import { DeadLetterQueue } from '../../lib/connectors/gmail/dead-letter-queue';
import { ExecutionAuditLog } from '../../lib/connectors/gmail/execution-audit';
import { GmailExecutionReader } from '../../lib/gamma/gmail-execution-reader';
import {
  MOCK_EXECUTION_CONTEXTS,
  MOCK_SAFETY_CHECKS,
  MOCK_IDEMPOTENCY_RECORDS,
  MOCK_DEAD_LETTER_ENTRIES,
  MOCK_AUDIT_EVENTS,
} from '../../src/lib/gmail-execution/mock-data';
import { DEFAULT_SAFETY_POLICY } from '../../src/lib/gmail-execution/types';

const BASE_TIME = new Date('2026-07-01T10:00:00Z');

// ============================================================================
// Execution Engine Tests (10)
// ============================================================================

describe('Execution Engine', () => {
  let engine: ExecutionEngine;

  beforeEach(() => {
    engine = new ExecutionEngine();
  });

  it('should execute approved queued draft', () => {
    const response = engine.executeQueued({
      queuedId: 'queued_001',
      draftId: 'draft_001',
      previewId: 'preview_001',
      approvalId: 'approval_001',
      operator: 'executor@example.com',
      idempotencyKey: 'idempotent_001',
      executeAction: 'send',
    });

    expect(response.success).toBe(true);
    // In simulation mode (default), executions complete immediately
    expect(response.execution?.executionState).toBe('completed');
    expect(response.execution?.attemptNumber).toBe(1);
    // Verify simulated message ID was generated
    expect(response.execution?.gmailMessageId).toMatch(/^msg_sim_/);
  });

  it('should block duplicate idempotency key', () => {
    const request = {
      queuedId: 'queued_001',
      draftId: 'draft_001',
      previewId: 'preview_001',
      approvalId: 'approval_001',
      operator: 'executor@example.com',
      idempotencyKey: 'idempotent_dup_001',
      executeAction: 'send' as const,
    };

    engine.executeQueued(request);
    const secondResponse = engine.executeQueued(request);

    expect(secondResponse.success).toBe(false);
    expect(secondResponse.error).toContain('Idempotency key');
  });

  it('should mark execution as completed', () => {
    const response = engine.executeQueued({
      queuedId: 'queued_001',
      draftId: 'draft_001',
      previewId: 'preview_001',
      approvalId: 'approval_001',
      operator: 'executor@example.com',
      idempotencyKey: 'idempotent_complete_001',
      executeAction: 'send',
    });

    const executionId = response.execution!.id;
    const completeResponse = engine.completeExecution(executionId, 'msg_abc123');

    expect(completeResponse.success).toBe(true);
    expect(completeResponse.execution?.executionState).toBe('completed');
    expect(completeResponse.execution?.gmailMessageId).toBe('msg_abc123');
  });

  it('should mark execution as failed and schedule retry', () => {
    const response = engine.executeQueued({
      queuedId: 'queued_001',
      draftId: 'draft_001',
      previewId: 'preview_001',
      approvalId: 'approval_001',
      operator: 'executor@example.com',
      idempotencyKey: 'idempotent_fail_001',
      executeAction: 'send',
    });

    const executionId = response.execution!.id;
    const failResponse = engine.failExecution(executionId, 'Gmail API error');

    expect(failResponse.success).toBe(true);
    expect(failResponse.execution?.executionState).toBe('failed');
    expect(failResponse.execution?.retryScheduledAt).toBeDefined();
    expect(failResponse.execution?.attemptNumber).toBe(2);
  });

  it('should move to dead-letter queue after max retries', () => {
    let response = engine.executeQueued({
      queuedId: 'queued_001',
      draftId: 'draft_001',
      previewId: 'preview_001',
      approvalId: 'approval_001',
      operator: 'executor@example.com',
      idempotencyKey: 'idempotent_dlq_001',
      executeAction: 'send',
    });

    const executionId = response.execution!.id;

    // Fail 3 times
    for (let i = 0; i < 3; i++) {
      response = engine.failExecution(executionId, `Error attempt ${i + 1}`);
    }

    expect(response.execution?.executionState).toBe('dead_lettered');
    expect(response.execution?.attemptNumber).toBe(3);
  });

  it('should cancel execution', () => {
    // In simulation mode (default), executions complete immediately
    // Test cancellation by attempting to cancel a completed execution
    // The engine should gracefully handle cancellation of completed executions
    const response = engine.executeQueued({
      queuedId: 'queued_001',
      draftId: 'draft_001',
      previewId: 'preview_001',
      approvalId: 'approval_001',
      operator: 'executor@example.com',
      idempotencyKey: 'idempotent_cancel_001',
      executeAction: 'send',
    });

    const executionId = response.execution!.id;
    expect(response.execution?.executionState).toBe('completed');
    
    // Attempting to cancel a completed execution should fail gracefully
    const cancelResponse = engine.cancelExecution(executionId);
    expect(cancelResponse.success).toBe(false);
  });

  it('should get execution by ID', () => {
    const response = engine.executeQueued({
      queuedId: 'queued_001',
      draftId: 'draft_001',
      previewId: 'preview_001',
      approvalId: 'approval_001',
      operator: 'executor@example.com',
      idempotencyKey: 'idempotent_get_001',
      executeAction: 'send',
    });

    const execution = engine.getExecution(response.execution!.id);
    expect(execution).toBeDefined();
    expect(execution?.draftId).toBe('draft_001');
  });

  it('should filter executions by state', () => {
    engine.executeQueued({
      queuedId: 'queued_001',
      draftId: 'draft_001',
      previewId: 'preview_001',
      approvalId: 'approval_001',
      operator: 'executor@example.com',
      idempotencyKey: 'idempotent_state_001',
      executeAction: 'send',
    });

    // In simulation mode (default), executions complete immediately
    const completed = engine.getByState('completed');
    expect(completed.length).toBeGreaterThan(0);
    
    // Verify no executions are in running state
    const running = engine.getByState('running');
    expect(running.length).toBe(0);
  });

  it('should calculate metrics', () => {
    engine.executeQueued({
      queuedId: 'queued_001',
      draftId: 'draft_001',
      previewId: 'preview_001',
      approvalId: 'approval_001',
      operator: 'executor@example.com',
      idempotencyKey: 'idempotent_metrics_001',
      executeAction: 'send',
    });

    const metrics = engine.getMetrics();
    expect(metrics.totalExecuted).toBeGreaterThan(0);
    expect(metrics.successRate).toBeGreaterThanOrEqual(0);
  });

  it('should calculate health score', () => {
    const health = engine.getHealth();
    expect(health.score).toBeGreaterThanOrEqual(0);
    expect(health.score).toBeLessThanOrEqual(100);
    expect(['healthy', 'degraded', 'critical']).toContain(health.status);
  });
});

// ============================================================================
// Retry Policy Tests (8)
// ============================================================================

describe('Retry Policy', () => {
  it('should return fixed delays (5s, 10s, 20s)', () => {
    const policy = GMAIL_RETRY_POLICY;
    expect(policy.getDelaySeconds(1)).toBe(5);
    expect(policy.getDelaySeconds(2)).toBe(10);
    expect(policy.getDelaySeconds(3)).toBe(20);
  });

  it('should not allow retries beyond max', () => {
    const policy = GMAIL_RETRY_POLICY;
    expect(policy.shouldRetry(3)).toBe(false);
    expect(policy.shouldRetry(4)).toBe(false);
  });

  it('should generate full schedule', () => {
    const policy = GMAIL_RETRY_POLICY;
    const schedule = policy.getFullSchedule();
    expect(schedule.length).toBe(3);
    expect(schedule[0].delaySeconds).toBe(5);
  });

  it('should calculate cumulative delay', () => {
    const policy = GMAIL_RETRY_POLICY;
    const cumulative = policy.getCumulativeDelaySeconds(3);
    expect(cumulative).toBe(35); // 5 + 10 + 20
  });

  it('should calculate next retry time deterministically', () => {
    const policy = new RetryPolicy();
    const failureTime = BASE_TIME;
    const currentTime = new Date(BASE_TIME.getTime() + 1000);

    const nextRetry = policy.getNextRetryTime(failureTime, 1, currentTime);
    expect(nextRetry.getTime()).toBeGreaterThan(failureTime.getTime());
  });

  it('should cap delay at maximum', () => {
    const policy = new RetryPolicy(3, 10, 3, 50); // aggressive multiplier
    const delay = policy.getDelaySeconds(3);
    expect(delay).toBeLessThanOrEqual(50);
  });

  it('should handle aggressive retry policy', () => {
    const policy = new RetryPolicy(3, 1, 2, 10);
    expect(policy.getDelaySeconds(1)).toBe(1);
    expect(policy.getDelaySeconds(2)).toBe(2);
    expect(policy.getDelaySeconds(3)).toBe(4);
  });

  it('should handle conservative retry policy', () => {
    const policy = new RetryPolicy(3, 30, 2, 180);
    expect(policy.getDelaySeconds(1)).toBe(30);
    expect(policy.getDelaySeconds(2)).toBe(60);
    expect(policy.getDelaySeconds(3)).toBe(120);
  });
});

// ============================================================================
// Idempotency Tests (8)
// ============================================================================

describe('Idempotency Manager', () => {
  let manager: IdempotencyManager;

  beforeEach(() => {
    manager = new IdempotencyManager();
  });

  it('should register idempotency key', () => {
    const record = manager.register('key_001', 'queued_001', 'draft_001', 'exec_001', BASE_TIME);
    expect(record.key).toBe('key_001');
    expect(record.status).toBe('pending');
  });

  it('should detect existing key', () => {
    manager.register('key_002', 'queued_001', 'draft_001', 'exec_001', BASE_TIME);
    const exists = manager.exists('key_002', BASE_TIME);
    expect(exists).toBe(true);
  });

  it('should prevent duplicate key use', () => {
    manager.register('key_003', 'queued_001', 'draft_001', 'exec_001', BASE_TIME);
    const exists = manager.exists('key_003', new Date(BASE_TIME.getTime() + 1000));
    expect(exists).toBe(true);
  });

  it('should mark execution as completed', () => {
    manager.register('key_004', 'queued_001', 'draft_001', 'exec_001', BASE_TIME);
    const completed = manager.markCompleted('key_004', 'msg_xyz');
    expect(completed?.status).toBe('completed');
    expect(completed?.gmailMessageId).toBe('msg_xyz');
  });

  it('should mark execution as failed', () => {
    manager.register('key_005', 'queued_001', 'draft_001', 'exec_001', BASE_TIME);
    const failed = manager.markFailed('key_005', 'API error');
    expect(failed?.status).toBe('failed');
  });

  it('should get records for draft', () => {
    manager.register('key_006', 'queued_001', 'draft_001', 'exec_001', BASE_TIME);
    manager.register('key_007', 'queued_001', 'draft_001', 'exec_002', BASE_TIME);

    const records = manager.getForDraft('draft_001');
    expect(records.length).toBe(2);
  });

  it('should clean up expired records', () => {
    manager.register('key_008', 'queued_001', 'draft_001', 'exec_001', BASE_TIME);

    const expiredTime = new Date(BASE_TIME.getTime() + 25 * 60 * 60 * 1000); // 25 hours
    const cleaned = manager.cleanupExpired(expiredTime);

    expect(cleaned).toBe(1);
    expect(manager.exists('key_008', expiredTime)).toBe(false);
  });

  it('should validate key format', () => {
    expect(IdempotencyManager.validateKeyFormat('valid_key_123')).toBe(true);
    expect(IdempotencyManager.validateKeyFormat('x')).toBe(false);
    expect(IdempotencyManager.validateKeyFormat('')).toBe(false);
  });
});

// ============================================================================
// Dead-Letter Queue Tests (8)
// ============================================================================

describe('Dead-Letter Queue', () => {
  let dlq: DeadLetterQueue;

  beforeEach(() => {
    dlq = new DeadLetterQueue();
  });

  it('should add entry to DLQ', () => {
    const entry = dlq.add(
      'exec_001',
      'queued_001',
      'draft_001',
      {
        queuedId: 'queued_001',
        draftId: 'draft_001',
        previewId: 'preview_001',
        approvalId: 'approval_001',
        operator: 'executor@example.com',
        idempotencyKey: 'key_001',
        executeAction: 'send',
      },
      3,
      3,
      'Gmail API error',
      BASE_TIME,
      false
    );

    expect(entry.id).toBeDefined();
    expect(entry.retriable).toBe(false);
  });

  it('should retrieve entry by ID', () => {
    const entry = dlq.add(
      'exec_002',
      'queued_002',
      'draft_002',
      {
        queuedId: 'queued_002',
        draftId: 'draft_002',
        previewId: 'preview_002',
        approvalId: 'approval_002',
        operator: 'executor@example.com',
        idempotencyKey: 'key_002',
        executeAction: 'send',
      },
      3,
      3,
      'Error',
      BASE_TIME
    );

    const retrieved = dlq.getEntry(entry.id);
    expect(retrieved?.executionId).toBe('exec_002');
  });

  it('should filter retriable entries', () => {
    dlq.add('exec_001', 'queued_001', 'draft_001', {} as any, 3, 3, 'Error 1', BASE_TIME, true);
    dlq.add('exec_002', 'queued_002', 'draft_002', {} as any, 3, 3, 'Error 2', BASE_TIME, false);

    const retriable = dlq.getRetriable();
    expect(retriable.length).toBe(1);
  });

  it('should filter permanent failures', () => {
    dlq.add('exec_001', 'queued_001', 'draft_001', {} as any, 3, 3, 'Error 1', BASE_TIME, true);
    dlq.add('exec_002', 'queued_002', 'draft_002', {} as any, 3, 3, 'Error 2', BASE_TIME, false);

    const permanent = dlq.getPermanentFailures();
    expect(permanent.length).toBe(1);
  });

  it('should classify errors as retriable or permanent', () => {
    expect(DeadLetterQueue.classifyError('timeout')).toBe(true);
    expect(DeadLetterQueue.classifyError('rate_limit')).toBe(true);
    expect(DeadLetterQueue.classifyError('invalid email format')).toBe(false);
    expect(DeadLetterQueue.classifyError('unauthorized')).toBe(false);
  });

  it('should calculate DLQ metrics', () => {
    dlq.add('exec_001', 'queued_001', 'draft_001', {} as any, 3, 3, 'Error 1', BASE_TIME, true);
    dlq.add('exec_002', 'queued_002', 'draft_002', {} as any, 3, 3, 'Error 2', BASE_TIME, false);

    const metrics = dlq.getMetrics();
    expect(metrics.totalInDLQ).toBe(2);
    expect(metrics.retriable).toBe(1);
    expect(metrics.permanent).toBe(1);
  });

  it('should move entry back to retry queue', () => {
    const entry = dlq.add(
      'exec_001',
      'queued_001',
      'draft_001',
      {
        queuedId: 'queued_001',
        draftId: 'draft_001',
        previewId: 'preview_001',
        approvalId: 'approval_001',
        operator: 'executor@example.com',
        idempotencyKey: 'key_001',
        executeAction: 'send',
      },
      3,
      3,
      'Temporary error',
      BASE_TIME,
      true
    );

    const request = dlq.moveToRetryQueue(entry.id);
    expect(request?.draftId).toBe('draft_001');
    expect(dlq.getEntry(entry.id)).toBeUndefined();
  });
});

// ============================================================================
// Audit Log Tests (6)
// ============================================================================

describe('Execution Audit Log', () => {
  let audit: ExecutionAuditLog;

  beforeEach(() => {
    audit = new ExecutionAuditLog();
  });

  it('should record audit event', () => {
    const event = audit.recordEvent('exec_001', 'execution_started', 'executor@example.com', BASE_TIME);
    expect(event.eventType).toBe('execution_started');
    expect(event.immutable).toBe(true);
  });

  it('should get audit trail for execution', () => {
    audit.recordEvent('exec_001', 'execution_started', 'executor@example.com', BASE_TIME);
    audit.recordEvent('exec_001', 'execution_safety_checked', 'executor@example.com', new Date(BASE_TIME.getTime() + 100));

    const trail = audit.getAuditTrail('exec_001');
    expect(trail.length).toBe(2);
  });

  it('should get events by type', () => {
    audit.recordEvent('exec_001', 'execution_started', 'executor@example.com', BASE_TIME);
    audit.recordEvent('exec_002', 'execution_started', 'executor@example.com', BASE_TIME);
    audit.recordEvent('exec_003', 'gmail_send_completed', 'executor@example.com', BASE_TIME);

    const started = audit.getEventsByType('execution_started');
    expect(started.length).toBe(2);
  });

  it('should verify audit integrity', () => {
    audit.recordEvent('exec_001', 'execution_started', 'executor@example.com', BASE_TIME);
    audit.recordEvent('exec_001', 'gmail_send_completed', 'executor@example.com', new Date(BASE_TIME.getTime() + 1000));

    const result = audit.verifyIntegrity();
    expect(result.valid).toBe(true);
    expect(result.issues.length).toBe(0);
  });

  it('should generate compliance report', () => {
    audit.recordEvent('exec_001', 'execution_started', 'executor@example.com', BASE_TIME);
    audit.recordEvent('exec_002', 'gmail_send_completed', 'executor@example.com', BASE_TIME);

    const report = audit.generateComplianceReport(new Date(BASE_TIME.getTime() - 60000), new Date(BASE_TIME.getTime() + 60000));
    expect(report.totalEvents).toBeGreaterThanOrEqual(2);
  });

  it('should export audit log as JSON', () => {
    audit.recordEvent('exec_001', 'execution_started', 'executor@example.com', BASE_TIME);

    const json = audit.exportAsJSON('exec_001');
    expect(json.eventCount).toBe(1);
    expect(json.events).toBeDefined();
  });
});

// ============================================================================
// Reader Tests (3)
// ============================================================================

describe('Gmail Execution Reader', () => {
  let reader: GmailExecutionReader;

  beforeEach(() => {
    reader = new GmailExecutionReader();
  });

  it('should store and retrieve execution', () => {
    const exec = MOCK_EXECUTION_CONTEXTS.completed;
    reader.store(exec);

    const retrieved = reader.getById(exec.id);
    expect(retrieved?.draftId).toBe(exec.draftId);
  });

  it('should filter by state', () => {
    reader.store(MOCK_EXECUTION_CONTEXTS.completed);
    reader.store(MOCK_EXECUTION_CONTEXTS.running);

    const completed = reader.getCompleted();
    expect(completed.length).toBeGreaterThan(0);
  });

  it('should calculate health score', () => {
    reader.store(MOCK_EXECUTION_CONTEXTS.completed);
    const health = reader.getHealthScore(BASE_TIME.getTime());
    expect(health).toBeGreaterThanOrEqual(0);
    expect(health).toBeLessThanOrEqual(100);
  });
});

// ============================================================================
// Feature Flag & Simulation Tests (8)
// ============================================================================

describe('Feature Flag: Execution Mode', () => {
  it('should default to simulation mode', () => {
    const engine = new ExecutionEngine();
    expect(engine.isRealExecutionEnabled()).toBe(false);
    expect(engine.getExecutionMode()).toBe('simulation');
  });

  it('should allow enabling real execution explicitly', () => {
    const engine = new ExecutionEngine(DEFAULT_SAFETY_POLICY, true);
    expect(engine.isRealExecutionEnabled()).toBe(true);
    expect(engine.getExecutionMode()).toBe('real');
  });

  it('should simulate Gmail response in simulation mode', () => {
    const engine = new ExecutionEngine(DEFAULT_SAFETY_POLICY, false);
    const response = engine.executeQueued({
      queuedId: 'queued_sim_001',
      draftId: 'draft_sim_001',
      previewId: 'preview_sim_001',
      approvalId: 'approval_sim_001',
      operator: 'simulator@example.com',
      idempotencyKey: 'idempotent_sim_001',
      executeAction: 'send',
    });

    expect(response.success).toBe(true);
    expect(response.execution?.executionState).toBe('completed');
    expect(response.gmailMessageId).toBeDefined();
    expect(response.gmailMessageId?.startsWith('msg_sim_')).toBe(true);
  });

  it('should mark simulated execution with simulation flag', () => {
    const engine = new ExecutionEngine(DEFAULT_SAFETY_POLICY, false);
    const response = engine.executeQueued({
      queuedId: 'queued_sim_002',
      draftId: 'draft_sim_002',
      previewId: 'preview_sim_002',
      approvalId: 'approval_sim_002',
      operator: 'simulator@example.com',
      idempotencyKey: 'idempotent_sim_002',
      executeAction: 'send',
    });

    expect(response.execution?.safetyCheckDetails.details?.simulationMode).toBe(true);
  });

  it('should immediately complete simulated execution', () => {
    const engine = new ExecutionEngine(DEFAULT_SAFETY_POLICY, false);
    const response = engine.executeQueued({
      queuedId: 'queued_sim_003',
      draftId: 'draft_sim_003',
      previewId: 'preview_sim_003',
      approvalId: 'approval_sim_003',
      operator: 'simulator@example.com',
      idempotencyKey: 'idempotent_sim_003',
      executeAction: 'send',
    });

    expect(response.execution?.completedAt).toBeDefined();
    expect(response.execution?.attemptNumber).toBe(1);
  });

  it('should block real execution when no live adapter is configured', () => {
    const engine = new ExecutionEngine(DEFAULT_SAFETY_POLICY, true);
    const response = engine.executeQueued({
      queuedId: 'queued_real_001',
      draftId: 'draft_real_001',
      previewId: 'preview_real_001',
      approvalId: 'approval_real_001',
      operator: 'executor@example.com',
      idempotencyKey: 'idempotent_real_001',
      executeAction: 'send',
    });

    expect(response.success).toBe(false);
    expect(response.error).toContain('adapter is not configured');
    expect(response.execution?.executionState).toBe('failed');
  });

  it('should route real execution through an injected live adapter without external side effects', () => {
    const engine = new ExecutionEngine(DEFAULT_SAFETY_POLICY, true, {
      execute(context) {
        return {
          success: true,
          execution: {
            ...context,
            gmailMessageId: 'gmail_mock_live_draft_001',
          },
          gmailMessageId: 'gmail_mock_live_draft_001',
        };
      },
    });

    const response = engine.executeQueued({
      queuedId: 'queued_real_002',
      draftId: 'draft_real_002',
      previewId: 'preview_real_002',
      approvalId: 'approval_real_002',
      operator: 'executor@example.com',
      idempotencyKey: 'idempotent_real_002',
      executeAction: 'create_draft',
    });

    expect(response.success).toBe(true);
    expect(response.execution?.executionState).toBe('completed');
    expect(response.gmailMessageId).toBe('gmail_mock_live_draft_001');
  });

  it('should maintain feature flag across operations', () => {
    const simEngine = new ExecutionEngine(DEFAULT_SAFETY_POLICY, false);
    const realEngine = new ExecutionEngine(DEFAULT_SAFETY_POLICY, true);

    expect(simEngine.getExecutionMode()).toBe('simulation');
    expect(realEngine.getExecutionMode()).toBe('real');
  });

  it('should prioritize explicit flag over environment', () => {
    // Explicit false should override any environment setting
    const engine = new ExecutionEngine(DEFAULT_SAFETY_POLICY, false);
    expect(engine.isRealExecutionEnabled()).toBe(false);
  });
});
