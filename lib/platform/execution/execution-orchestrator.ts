import { ExecutionContext, ExecutionContextManager } from "./execution-context";
import { ExecutionRuntime } from "./execution-runtime";
import { RuntimeResult } from "./runtime-result";
import { ExecutionFailureCode } from "./failure-classifier";
import { AuditRecordBuilder } from "./audit-record-builder";
import { ExecutionRequest, createExecutionRequest } from "./execution-request";
import { ApprovalGate, ApprovalRequest, ApprovalVerdict } from "./approval-contract";
import { RollbackExecutor, RollbackPlan } from "./rollback-contract";
import { ExecutionLifecycle, S3BPhase } from "./execution-lifecycle";
import { RuntimeState } from "./runtime-state-machine";
import { ConnectorCapabilityProfile, OperationCapability, ApprovalLevel } from "./capability-contract";
import { ConnectorRuntimeCapabilities } from "./capabilities";

export type S3BOrchestrationOutcome =
  | 'S3B_PASS_THROUGH'
  | 'S3B_COMPLETED'
  | 'S3B_FAILED'
  | 'S3B_ROLLED_BACK';

export interface S3BOrchestrationResult {
  outcome: S3BOrchestrationOutcome;
  runtimeResult: RuntimeResult;
  s3bPhases: string[];
  s3bAuditEvents: string[];
  lifecycleCompleted: boolean;
}

function isS3BEligible(result: RuntimeResult): boolean {
  if (result.status !== 'FAILED') return false;
  if (result.failureClassification !== ExecutionFailureCode.S3A_EXECUTION_BLOCKED) return false;
  return true;
}

const S3B_DEFAULT_CAPABILITIES: ConnectorRuntimeCapabilities = {
  prepare: true,
  preflight: true,
  execute: false,
  verify: false,
  rollback: false,
  audit: true,
  stage: '3B',
  providerMutationAllowed: false,
  networkMutationAllowed: false,
};

export class ExecutionOrchestrator {
  private lifecycle = new ExecutionLifecycle();

  getLifecycle(): ExecutionLifecycle {
    return this.lifecycle;
  }

  async orchestrate(
    context: ExecutionContext,
    approvalGate?: ApprovalGate,
    rollbackExecutor?: RollbackExecutor,
  ): Promise<S3BOrchestrationResult> {
    this.lifecycle.reset();

    const s3aResult = await ExecutionRuntime.run(context);

    if (!isS3BEligible(s3aResult)) {
      return {
        outcome: 'S3B_PASS_THROUGH',
        runtimeResult: s3aResult,
        s3bPhases: [],
        s3bAuditEvents: [],
        lifecycleCompleted: false,
      };
    }

    if (!this.lifecycle.transitionTo('S3B_APPROVAL')) {
      return this.buildS3BFailure(s3aResult, 'Lifecycle initialization failed');
    }

    const executionRequest = createExecutionRequest(
      context.candidate,
      context.decision,
      context.capabilities,
    );

    let s3bContext = this.createS3BContext(context, executionRequest);
    let lastPhase: S3BPhase = 'S3B_APPROVAL';
    let s3bWarnings: string[] = [];

    const approvalResult = await this.runApprovalPhase(
      approvalGate,
      executionRequest,
      s3bContext,
    );
    if (approvalResult.failed) {
      lastPhase = 'S3B_ROLLBACK';
      this.lifecycle.transitionTo('S3B_ROLLBACK');
      const rollbackResult = await this.runRollbackPhase(rollbackExecutor, executionRequest, s3bContext);
      this.lifecycle.transitionTo('S3B_FAILED');
      return this.buildS3BCompletedResult(
        s3bContext,
        s3aResult,
        'FAILED',
        ExecutionFailureCode.APPROVAL_MISSING,
        approvalResult.warnings,
        `S3B_APPROVAL: ${approvalResult.reason}`,
        ['APPROVAL_DENIED'],
        rollbackResult,
      );
    }
    s3bWarnings.push(...approvalResult.warnings);
    this.lifecycle.recordEvent('APPROVAL_PASSED', approvalResult.reason);

    if (!this.lifecycle.transitionTo('S3B_EXECUTION')) {
      return this.buildS3BFailure(s3aResult, 'Phase transition to execution failed');
    }
    lastPhase = 'S3B_EXECUTION';
    const executionPhase = this.runExecutionPhase(executionRequest, s3bContext);
    if (executionPhase.failed) {
      this.lifecycle.transitionTo('S3B_ROLLBACK');
      const rollbackResult = await this.runRollbackPhase(rollbackExecutor, executionRequest, s3bContext);
      this.lifecycle.transitionTo('S3B_FAILED');
      return this.buildS3BCompletedResult(
        s3bContext,
        s3aResult,
        'FAILED',
        ExecutionFailureCode.EXECUTION_NOT_AUTHORIZED,
        executionPhase.warnings,
        `S3B_EXECUTION: ${executionPhase.reason}`,
        ['EXECUTION_FAILED'],
        rollbackResult,
      );
    }
    s3bWarnings.push(...executionPhase.warnings);
    this.lifecycle.recordEvent('EXECUTION_PASSED', executionPhase.reason);

    if (!this.lifecycle.transitionTo('S3B_VERIFICATION')) {
      return this.buildS3BFailure(s3aResult, 'Phase transition to verification failed');
    }
    lastPhase = 'S3B_VERIFICATION';
    const verificationResult = this.runVerificationPhase(executionRequest, s3bContext);
    if (verificationResult.failed) {
      this.lifecycle.transitionTo('S3B_ROLLBACK');
      const rollbackResult = await this.runRollbackPhase(rollbackExecutor, executionRequest, s3bContext);
      this.lifecycle.transitionTo('S3B_FAILED');
      return this.buildS3BCompletedResult(
        s3bContext,
        s3aResult,
        'FAILED',
        ExecutionFailureCode.S3A_EXECUTION_BLOCKED,
        verificationResult.warnings,
        `S3B_VERIFICATION: ${verificationResult.reason}`,
        ['VERIFICATION_FAILED'],
        rollbackResult,
      );
    }
    s3bWarnings.push(...verificationResult.warnings);
    this.lifecycle.recordEvent('VERIFICATION_PASSED', verificationResult.reason);

    if (!this.lifecycle.transitionTo('S3B_AUDIT')) {
      return this.buildS3BFailure(s3aResult, 'Phase transition to audit failed');
    }
    lastPhase = 'S3B_AUDIT';
    const auditResult = this.runAuditPhase(s3bContext);
    if (auditResult.failed) {
      this.lifecycle.transitionTo('S3B_FAILED');
      return this.buildS3BCompletedResult(
        s3bContext,
        s3aResult,
        'FAILED',
        ExecutionFailureCode.AUDIT_GENERATION_FAILED,
        auditResult.warnings,
        `S3B_AUDIT: ${auditResult.reason}`,
        ['AUDIT_FAILED'],
        null,
      );
    }
    s3bWarnings.push(...auditResult.warnings);
    this.lifecycle.recordEvent('AUDIT_PASSED', auditResult.reason);

    this.lifecycle.transitionTo('S3B_COMPLETED');

    return this.buildS3BCompletedResult(
      s3bContext,
      s3aResult,
      'SUCCESS',
      undefined,
      s3bWarnings,
      'S3B_EXECUTION_COMPLETED',
      [],
      null,
    );
  }

  private createS3BContext(
    context: ExecutionContext,
    executionRequest: ExecutionRequest,
  ): ExecutionContext {
    return ExecutionContextManager.create(
      context.candidate,
      context.decision,
      context.capabilities,
    );
  }

  private async runApprovalPhase(
    approvalGate: ApprovalGate | undefined,
    request: ExecutionRequest,
    context: ExecutionContext,
  ): Promise<{ failed: boolean; warnings: string[]; reason: string }> {
    if (!approvalGate) {
      return { failed: false, warnings: ['No approval gate configured'], reason: 'APPROVAL_SKIPPED' };
    }

    const approvalRequest: ApprovalRequest = {
      approvalId: `appr-${request.executionId}`,
      executionId: request.executionId,
      connectorId: request.connectorId,
      operation: request.operation,
      riskLevel: 'MODIFY',
      requiredLevel: 'STANDARD',
      requestedAt: '2026-01-01T00:00:00Z',
      context: {
        queueId: request.queueId,
        decisionId: request.decision.decisionId,
        planHash: request.planHash,
      },
    };

    try {
      const verdict = await approvalGate.evaluate(approvalRequest);
      if (verdict.decision !== 'APPROVED') {
        return { failed: true, warnings: [], reason: `Not approved: ${verdict.reason}` };
      }
      return { failed: false, warnings: [verdict.reason], reason: 'APPROVED' };
    } catch {
      return { failed: true, warnings: [], reason: 'Approval gate threw exception' };
    }
  }

  private runExecutionPhase(
    request: ExecutionRequest,
    context: ExecutionContext,
  ): { failed: boolean; warnings: string[]; reason: string } {
    if (!request.idempotencyToken) {
      return { failed: true, warnings: [], reason: 'Missing idempotency token' };
    }
    if (!request.planHash) {
      return { failed: true, warnings: [], reason: 'Missing plan hash' };
    }
    return {
      failed: false,
      warnings: ['Execution simulated — no provider mutation attempted'],
      reason: 'EXECUTION_SIMULATED',
    };
  }

  private runVerificationPhase(
    request: ExecutionRequest,
    context: ExecutionContext,
  ): { failed: boolean; warnings: string[]; reason: string } {
    return {
      failed: false,
      warnings: ['Verification simulated — no provider state to verify'],
      reason: 'VERIFICATION_SIMULATED',
    };
  }

  private runAuditPhase(
    context: ExecutionContext,
  ): { failed: boolean; warnings: string[]; reason: string } {
    if (!context.executionId) {
      return { failed: true, warnings: [], reason: 'Missing execution ID for audit' };
    }
    return {
      failed: false,
      warnings: ['S3B audit record generated'],
      reason: 'AUDIT_GENERATED',
    };
  }

  private async runRollbackPhase(
    rollbackExecutor: RollbackExecutor | undefined,
    request: ExecutionRequest,
    context: ExecutionContext,
  ): Promise<string[]> {
    if (!rollbackExecutor) {
      return ['No rollback executor configured — rollback skipped'];
    }

    try {
      const plan = await rollbackExecutor.plan(request, context.candidate);
      return [`Rollback planned: ${plan.strategy} (${plan.scope})`];
    } catch {
      return ['Rollback planning failed — no rollback applied'];
    }
  }

  private buildS3BFailure(
    s3aResult: RuntimeResult,
    reason: string,
  ): S3BOrchestrationResult {
    return {
      outcome: 'S3B_FAILED',
      runtimeResult: s3aResult,
      s3bPhases: this.lifecycle.getTransitions().map(t => `${t.from}->${t.to}`),
      s3bAuditEvents: this.lifecycle.getPhaseEvents().map(e => `${e.phase}:${e.event}`),
      lifecycleCompleted: this.lifecycle.isTerminal(),
    };
  }

  private buildS3BCompletedResult(
    context: ExecutionContext,
    s3aResult: RuntimeResult,
    status: 'SUCCESS' | 'FAILED',
    failureCode: ExecutionFailureCode | undefined,
    warnings: string[],
    s3bState: string,
    blockingReasons: string[],
    rollbackEvents: string[] | null,
  ): S3BOrchestrationResult {
    const allWarnings = [...s3aResult.warnings, ...warnings, ...(rollbackEvents ?? [])];
    const allBlocking = [...s3aResult.blockingReasons, ...blockingReasons];

    const auditLog = [
      ...s3aResult.transitionHistory,
      `S3B: ${s3bState}`,
      ...this.lifecycle.getTransitions().map(t => `S3BPhase: ${t.from} -> ${t.to}`),
    ];

    const runtimeResult: RuntimeResult = {
      status: status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
      finalState: status === 'SUCCESS' ? 'COMPLETED' : 'FAILED',
      failureClassification: failureCode,
      transitionHistory: auditLog,
      auditProjection: s3aResult.auditProjection,
      executionAttempted: true,
      providerMutationAttempted: false,
      providerMutationCompleted: false,
      deterministicHashes: {
        inputHash: s3aResult.deterministicHashes.inputHash,
        outputHash: `s3b-${this.lifecycle.getTransitions().length}-${s3aResult.deterministicHashes.outputHash}`,
        pipelineHash: `s3b-${auditLog.length}-${s3aResult.deterministicHashes.pipelineHash}`,
      },
      warnings: allWarnings,
      blockingReasons: allBlocking,
    };

    return {
      outcome: status === 'SUCCESS' ? 'S3B_COMPLETED' : 'S3B_FAILED',
      runtimeResult,
      s3bPhases: this.lifecycle.getTransitions().map(t => `${t.from}->${t.to}`),
      s3bAuditEvents: this.lifecycle.getPhaseEvents().map(e => `${e.phase}:${e.event}`),
      lifecycleCompleted: this.lifecycle.isTerminal(),
    };
  }
}
