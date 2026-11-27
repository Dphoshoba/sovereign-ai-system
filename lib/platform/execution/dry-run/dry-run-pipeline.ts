import { ExecutionRequest } from '../execution-request';
import { QueueCandidate } from '../../queue/types';
import { ApprovalGate, ApprovalRequest, ApprovalVerdict, ApprovalLevel } from '../approval-contract';
import { RollbackExecutor, RollbackPlan, RollbackStepDescriptor, RollbackScope, RollbackStrategy } from '../rollback-contract';
import { MutationPlanner } from './mutation-planner';
import { DryRunReportBuilder } from './dry-run-report';
import {
  DryRunReport,
  DryRunArtifacts,
  DryRunPhaseResult,
  MutationPlan,
  VerificationPlan,
} from './dry-run-types';

export interface DryRunPipelineConfig {
  approvalGate?: ApprovalGate;
  rollbackExecutor?: RollbackExecutor;
}

export class DryRunPipeline {
  private planner = new MutationPlanner();
  private reportBuilder = new DryRunReportBuilder();
  private transportInvocations = 0;
  private config: DryRunPipelineConfig;

  constructor(config: DryRunPipelineConfig = {}) {
    this.config = config;
  }

  getTransportInvocationCount(): number {
    return this.transportInvocations;
  }

  recordTransportInvocation(): void {
    this.transportInvocations++;
  }

  resetTransportCount(): void {
    this.transportInvocations = 0;
  }

  async execute(
    request: ExecutionRequest,
    candidate: QueueCandidate,
  ): Promise<DryRunReport> {
    this.transportInvocations = 0;
    const phaseResults: DryRunPhaseResult[] = [];
    const auditEvents: string[] = [];
    const warnings: string[] = [];


    const planningStart = Date.now();
    const mutationPlan = this.planner.plan(request, candidate);
    const planningDuration = Date.now() - planningStart;
    phaseResults.push({
      phase: 'PLANNING',
      passed: true,
      durationMs: planningDuration,
      artifacts: { operation: mutationPlan.operation, hasBody: mutationPlan.requestBody !== null },
    });
    auditEvents.push(`PLAN_GENERATED: ${mutationPlan.operation}`);


    const idemKey = mutationPlan.idempotencyKey;
    phaseResults.push({
      phase: 'IDEMPOTENCY',
      passed: !!idemKey,
      durationMs: 0,
      artifacts: { idempotencyKey: idemKey },
    });
    auditEvents.push(`IDEMPOTENCY_KEY_GENERATED: ${idemKey}`);


    let approvalVerdict: ApprovalVerdict | null = null;
    const approvalStart = Date.now();
    if (this.config.approvalGate) {
      const approvalRequest: ApprovalRequest = {
        approvalId: `dryrun-appr-${request.executionId}`,
        executionId: request.executionId,
        connectorId: request.connectorId,
        operation: request.operation,
        riskLevel: this.getRiskLevel(request.operation),
        requiredLevel: this.getApprovalLevel(request.operation),
        requestedAt: '2026-01-01T00:00:00Z',
        context: {
          queueId: request.queueId,
          decisionId: request.decision.decisionId,
          planHash: request.planHash,
        },
      };
      try {
        approvalVerdict = await this.config.approvalGate.evaluate(approvalRequest);
      } catch (e) {
        approvalVerdict = {
          decision: 'DENIED',
          approvedAt: null,
          approvedBy: null,
          approvalLevel: this.getApprovalLevel(request.operation),
          conditions: [],
          reason: `Approval gate threw: ${(e as Error).message}`,
        };
      }
    } else {
      approvalVerdict = {
        decision: 'APPROVED',
        approvedAt: '2026-01-01T00:00:00Z',
        approvedBy: 'dry-run-system',
        approvalLevel: this.getApprovalLevel(request.operation),
        conditions: ['Dry-run mode: no live execution'],
        reason: 'DRY_RUN_AUTO_APPROVED',
      };
    }
    const approvalDuration = Date.now() - approvalStart;
    const approvalPassed = approvalVerdict.decision === 'APPROVED';
    phaseResults.push({
      phase: 'APPROVAL',
      passed: approvalPassed,
      durationMs: approvalDuration,
      artifacts: { decision: approvalVerdict.decision, reason: approvalVerdict.reason },
    });
    auditEvents.push(`APPROVAL_${approvalVerdict.decision}: ${approvalVerdict.reason}`);
    if (!approvalPassed) {
      warnings.push(`Approval denied: ${approvalVerdict.reason}`);
    }


    let rollbackPlan: RollbackPlan | null = null;
    const rollbackStart = Date.now();
    if (this.config.rollbackExecutor) {
      try {
        rollbackPlan = await this.config.rollbackExecutor.plan(request, candidate);
      } catch (e) {
        warnings.push(`Rollback planning failed: ${(e as Error).message}`);
      }
    }
    if (!rollbackPlan) {
      rollbackPlan = this.createDefaultRollbackPlan(request, mutationPlan);
    }
    const rollbackDuration = Date.now() - rollbackStart;
    phaseResults.push({
      phase: 'ROLLBACK_PLANNING',
      passed: true,
      durationMs: rollbackDuration,
      artifacts: { strategy: rollbackPlan.strategy, scope: rollbackPlan.scope, steps: rollbackPlan.steps.length },
    });
    auditEvents.push(`ROLLBACK_PLAN_GENERATED: ${rollbackPlan.strategy} (${rollbackPlan.scope})`);


    const verificationPlan = this.createVerificationPlan(request.operation);
    phaseResults.push({
      phase: 'VERIFICATION_PLANNING',
      passed: true,
      durationMs: 0,
      artifacts: { readBack: verificationPlan.readBackOperation, fields: verificationPlan.verificationFields },
    });
    auditEvents.push(`VERIFICATION_PLAN_GENERATED: ${verificationPlan.readBackOperation}`);


    const auditApproval = approvalVerdict?.decision ?? 'UNKNOWN';
    const auditRollback = rollbackPlan?.planHash ?? 'NONE';
    auditEvents.push(`DRY_RUN_AUDIT: op=${request.operation} approval=${auditApproval} rollback=${auditRollback}`);
    phaseResults.push({
      phase: 'AUDIT',
      passed: true,
      durationMs: 0,
      artifacts: { eventCount: auditEvents.length },
    });


    const artifacts: DryRunArtifacts = {
      mutationPlan,
      idempotencyKey: idemKey,
      approvalVerdict,
      rollbackPlan,
      verificationPlan,
      auditEvents,
      phaseResults,
    };


    const report = this.reportBuilder.build(
      request.executionId,
      request.operation,
      artifacts,
      this.transportInvocations > 0,
      warnings,
    );

    return report;
  }

  private createDefaultRollbackPlan(
    request: ExecutionRequest,
    mutationPlan: MutationPlan,
  ): RollbackPlan {
    const compensatingOp = this.getCompensatingOperation(request.operation);
    const steps: RollbackStepDescriptor[] = [{
      stepIndex: 0,
      action: request.operation,
      compensatingOperation: compensatingOp,
      parameters: mutationPlan.parameters,
      reversible: request.operation !== 'events.delete',
    }];

    return {
      rollbackId: `dryrun-rb-${request.executionId}`,
      executionId: request.executionId,
      connectorId: request.connectorId,
      operation: request.operation,
      scope: 'FULL',
      strategy: 'REVERSE_ORDER',
      steps,
      plannedAt: '2026-01-01T00:00:00Z',
      planHash: `dryrun-rb-hash-${request.executionId}`,
    };
  }

  private createVerificationPlan(operation: string): VerificationPlan {
    if (operation === 'events.list' || operation === 'events.get') {
      return {
        operation,
        readBackOperation: operation,
        verificationFields: ['id', 'summary', 'status', 'updated'],
        expectedDrift: [],
        maxVerificationDurationMs: 5000,
      };
    }
    if (operation === 'events.insert') {
      return {
        operation,
        readBackOperation: 'events.get',
        verificationFields: ['id', 'summary', 'start', 'end', 'status'],
        expectedDrift: [],
        maxVerificationDurationMs: 5000,
      };
    }
    if (operation === 'events.update') {
      return {
        operation,
        readBackOperation: 'events.get',
        verificationFields: ['summary', 'description', 'updated'],
        expectedDrift: [],
        maxVerificationDurationMs: 5000,
      };
    }
    if (operation === 'events.delete') {
      return {
        operation,
        readBackOperation: 'events.get',
        verificationFields: ['status'],
        expectedDrift: ['status: "confirmed" -> expected 404'],
        maxVerificationDurationMs: 5000,
      };
    }
    return {
      operation,
      readBackOperation: operation,
      verificationFields: [],
      expectedDrift: [],
      maxVerificationDurationMs: 5000,
    };
  }

  private getRiskLevel(operation: string): string {
    if (operation === 'events.delete') return 'DESTRUCTIVE';
    if (operation === 'events.insert' || operation === 'events.update') return 'MODIFY';
    return 'READ';
  }

  private getApprovalLevel(operation: string): ApprovalLevel {
    if (operation === 'events.delete') return 'HEIGHTENED';
    if (operation === 'events.insert' || operation === 'events.update') return 'STANDARD';
    return 'NONE';
  }

  private getCompensatingOperation(operation: string): string {
    switch (operation) {
      case 'events.insert': return 'events.delete';
      case 'events.update': return 'events.update';
      case 'events.delete': return 'events.insert';
      default: return operation;
    }
  }
}
