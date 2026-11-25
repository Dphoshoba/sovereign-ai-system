import { ExecutionContext } from "./execution-context";
import { ExecutionFailureCode } from "./failure-classifier";
import { RuntimeState } from "./runtime-state-machine";

export interface AuditRecord {
  auditId: string;
  executionId: string;
  queueId: string;
  decisionId: string;
  previewId: string;
  connectorId: string;
  operation: string;
  outcome: 'SUCCESS' | 'FAILED' | 'CANCELLED';
  finalState: string;
  failureCode?: ExecutionFailureCode;
  runtimeVersion: string;
  governanceVersion: string;
  policyVersion: string;
  queueVersion: string;
  connectorVersion: string;
  transitions: Array<{
    state: string;
    timestamp: string;
  }>;
  safetyChecks: string[];
  executionAttempted: boolean;
  providerMutationAttempted: boolean;
  providerMutationCompleted: boolean;
  generatedAt: string;
}

export class AuditRecordBuilder {
  static build(
    context: ExecutionContext,
    finalState: RuntimeState,
    failureCode?: ExecutionFailureCode,
  ): AuditRecord {
    const { candidate, decision } = context;

    // Deterministic Audit ID: derived from queueId and a static salt for S3A
    const auditId = `audit-${candidate.queueId}-frozen`;

    return {
      auditId,
      executionId: context.executionId,
      queueId: candidate.queueId,
      decisionId: decision.decisionId,
      previewId: candidate.previewId,
      connectorId: candidate.connectorId,
      operation: candidate.operation,
      outcome: failureCode ? 'FAILED' : 'SUCCESS',
      finalState,
      failureCode,
      runtimeVersion: context.runtimeVersion,
      governanceVersion: decision.governanceVersion,
      policyVersion: decision.policyVersion,
      queueVersion: candidate.metadata.version,
      connectorVersion: '1.0.0',
      transitions: [
        ...context.auditLog
          .filter((log) => log.startsWith('State: '))
          .map((log) => ({
            state: log.slice('State: '.length),
            timestamp: '2026-01-01T00:00:00Z',
          })),
        {
          state: finalState,
          timestamp: '2026-01-01T00:00:00Z',
        },
      ],
      safetyChecks: context.auditLog.filter((log) => log.includes('S3A_EXECUTION_BLOCKED')),
      executionAttempted: false,
      providerMutationAttempted: false,
      providerMutationCompleted: false,
      generatedAt: '2026-01-01T00:00:00Z',
    };
  }
}
