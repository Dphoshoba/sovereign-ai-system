import { RuntimeState } from "./runtime-state-machine";
import { ExecutionFailureCode } from "./failure-classifier";
import { AuditRecord } from "./audit-record-builder";

export interface RuntimeResult {
  status: 'SUCCESS' | 'FAILED' | 'CANCELLED';
  finalState: RuntimeState;
  failureClassification?: ExecutionFailureCode;
  transitionHistory: string[];
  auditProjection: AuditRecord | null;
  executionAttempted: boolean;
  providerMutationAttempted: boolean;
  providerMutationCompleted: boolean;
  deterministicHashes: {
    inputHash: string;
    outputHash: string;
    pipelineHash: string;
  };
  warnings: string[];
  blockingReasons: string[];
}
