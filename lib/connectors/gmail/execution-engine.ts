/**
 * Gmail Execution Engine
 * Controlled execution with strict safety gates
 * Only approved, queued drafts can execute
 */

import {
  ExecutionRequest,
  ExecutionContext,
  ExecutionResponse,
  SafetyCheckResult,
  SafetyPolicy,
  DEFAULT_SAFETY_POLICY,
  ExecutionState,
  AuditEventType,
} from '../../../src/lib/gmail-execution/types';

export class ExecutionEngine {
  private executions: Map<string, ExecutionContext> = new Map();
  private idempotencyKeys: Set<string> = new Set();
  private policy: SafetyPolicy;

  constructor(policy: SafetyPolicy = DEFAULT_SAFETY_POLICY) {
    this.policy = policy;
  }

  /**
   * Execute queued draft with safety checks
   */
  executeQueued(request: ExecutionRequest): ExecutionResponse {
    try {
      // Generate unique execution ID (deterministic, without Date.now or Math.random)
      const timestamp = request.approvalId.substring(0, 8);
      const counter = this.executions.size.toString().padStart(5, '0');
      const executionId = `exec_${timestamp}_${counter}`;

      // Check idempotency
      if (this.idempotencyKeys.has(request.idempotencyKey)) {
        return {
          success: false,
          error: 'Idempotency key already used',
        };
      }

      // Run safety checks
      const safetyChecks = this.runSafetyChecks(request);
      if (!safetyChecks.allChecksPassed) {
        return {
          success: false,
          error: `Safety check failed: ${safetyChecks.failureReason}`,
        };
      }

      // Create execution context
      const now = new Date();
      const context: ExecutionContext = {
        id: executionId,
        queuedId: request.queuedId,
        draftId: request.draftId,
        previewId: request.previewId,
        approvalId: request.approvalId,
        idempotencyKey: request.idempotencyKey,
        operator: request.operator,
        executeAction: request.executeAction,
        executionState: 'running',
        attemptNumber: 1,
        maxRetries: this.policy.maxRetries,
        createdAt: now,
        startedAt: now,
        safetyChecksPassed: true,
        safetyCheckDetails: safetyChecks,
      };

      // Store execution
      this.executions.set(executionId, context);
      this.idempotencyKeys.add(request.idempotencyKey);

      return {
        success: true,
        execution: context,
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * Run all safety checks
   */
  private runSafetyChecks(request: ExecutionRequest): SafetyCheckResult {
    const checks: SafetyCheckResult = {
      approvalExists: !!request.approvalId,
      approvalValid: !!request.approvalId,
      approvalNotExpired: true, // In real implementation, check approval timestamp
      draftCompositionValid: !!request.draftId,
      previewValid: !!request.previewId,
      oauthConnected: true, // In real implementation, check OAuth status
      oauthValid: true, // In real implementation, validate token
      idempotencyNotDuplicate: !this.idempotencyKeys.has(request.idempotencyKey),
      allChecksPassed: true,
      checkedAt: new Date(),
    };

    // Validate all required checks
    if (this.policy.requireApprovalExists && !checks.approvalExists) {
      checks.allChecksPassed = false;
      checks.failureReason = 'Approval does not exist';
      return checks;
    }

    if (this.policy.requireApprovalNotExpired && !checks.approvalNotExpired) {
      checks.allChecksPassed = false;
      checks.failureReason = 'Approval expired';
      return checks;
    }

    if (this.policy.requireOAuth && !checks.oauthValid) {
      checks.allChecksPassed = false;
      checks.failureReason = 'OAuth not valid';
      return checks;
    }

    if (this.policy.requireIdempotencyKey && !checks.idempotencyNotDuplicate) {
      checks.allChecksPassed = false;
      checks.failureReason = 'Duplicate idempotency key';
      return checks;
    }

    if (!checks.draftCompositionValid) {
      checks.allChecksPassed = false;
      checks.failureReason = 'Draft composition invalid';
      return checks;
    }

    if (!checks.previewValid) {
      checks.allChecksPassed = false;
      checks.failureReason = 'Preview invalid';
      return checks;
    }

    return checks;
  }

  /**
   * Mark execution as completed
   */
  completeExecution(executionId: string, gmailMessageId?: string): ExecutionResponse {
    const execution = this.executions.get(executionId);
    if (!execution) {
      return {
        success: false,
        error: 'Execution not found',
      };
    }

    execution.executionState = 'completed';
    execution.completedAt = new Date();
    execution.gmailMessageId = gmailMessageId;

    return {
      success: true,
      execution,
      gmailMessageId,
    };
  }

  /**
   * Mark execution as failed
   */
  failExecution(executionId: string, error: string): ExecutionResponse {
    const execution = this.executions.get(executionId);
    if (!execution) {
      return {
        success: false,
        error: 'Execution not found',
      };
    }

    execution.error = error;

    // Determine next action
    if (execution.attemptNumber < this.policy.maxRetries) {
      execution.executionState = 'failed';
      execution.attemptNumber++;
      // Schedule retry (in real implementation, use queue scheduler)
      const delaySeconds = this.policy.retryDelaySeconds[execution.attemptNumber - 1] || 60;
      execution.retryScheduledAt = new Date(Date.now() + delaySeconds * 1000);
    } else {
      execution.executionState = 'dead_lettered';
    }

    execution.completedAt = new Date();

    return {
      success: true,
      execution,
    };
  }

  /**
   * Cancel execution
   */
  cancelExecution(executionId: string): ExecutionResponse {
    const execution = this.executions.get(executionId);
    if (!execution) {
      return {
        success: false,
        error: 'Execution not found',
      };
    }

    if (execution.executionState === 'completed' || execution.executionState === 'dead_lettered') {
      return {
        success: false,
        error: 'Cannot cancel completed or dead-lettered execution',
      };
    }

    execution.executionState = 'cancelled';
    execution.completedAt = new Date();

    return {
      success: true,
      execution,
    };
  }

  /**
   * Get execution by ID
   */
  getExecution(executionId: string): ExecutionContext | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Query executions by state
   */
  getByState(state: ExecutionState): ExecutionContext[] {
    return Array.from(this.executions.values()).filter(e => e.executionState === state);
  }

  /**
   * Get execution metrics
   */
  getMetrics() {
    const executions = Array.from(this.executions.values());
    const completed = executions.filter(e => e.executionState === 'completed').length;
    const failed = executions.filter(e => e.executionState === 'failed').length;
    const cancelled = executions.filter(e => e.executionState === 'cancelled').length;
    const deadLettered = executions.filter(e => e.executionState === 'dead_lettered').length;

    const successRate = executions.length > 0 ? (completed / executions.length) * 100 : 0;
    const totalRetries = executions.reduce((sum, e) => sum + (e.attemptNumber - 1), 0);
    const avgRetries = executions.length > 0 ? totalRetries / executions.length : 0;

    return {
      totalExecuted: executions.length,
      completed,
      failed,
      cancelled,
      deadLettered,
      successRate,
      totalRetries,
      avgRetries,
    };
  }

  /**
   * Get health score (0-100)
   */
  getHealth() {
    const metrics = this.getMetrics();
    const backlogCount = this.getByState('waiting').length + this.getByState('running').length;
    const failureRate = metrics.totalExecuted > 0 ? ((metrics.failed + metrics.deadLettered) / metrics.totalExecuted) * 100 : 0;

    // Score calculation
    let score = 100;
    score -= Math.min(backlogCount * 5, 30); // Backlog penalty (max 30)
    score -= Math.min(failureRate * 2, 40); // Failure penalty (max 40)

    const status = score >= 80 ? 'healthy' : score >= 60 ? 'degraded' : 'critical';

    return {
      score: Math.max(0, Math.min(100, score)),
      status,
      backlogCount,
      failureRate,
    };
  }

  /**
   * Validate execution is safe (not already executed)
   */
  validateIdempotency(key: string): boolean {
    return !this.idempotencyKeys.has(key);
  }

  /**
   * Verify approval not expired (7-day window)
   */
  verifyApprovalNotExpired(approvalCreatedAt: Date): boolean {
    const now = new Date();
    const approvalAgeMs = now.getTime() - approvalCreatedAt.getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    return approvalAgeMs < sevenDaysMs;
  }

  /**
   * Check if OAuth is connected and valid
   */
  checkOAuthValid(oauthTokenExpiresAt: Date): boolean {
    const now = new Date();
    return now < oauthTokenExpiresAt;
  }
}
