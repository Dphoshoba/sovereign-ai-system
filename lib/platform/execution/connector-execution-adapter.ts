import { QueueCandidate } from "../queue/types";
import { ExecutionRequest } from "./execution-request";
import { ExecutionResult } from "./execution-result";
import { ExecutionFailureCode } from "./failure-classifier";

export type AdapterExecutionId = string;

export interface ProviderMutationResult {
  mutationId: string;
  providerState: Record<string, unknown>;
  etag?: string;
  revision?: number;
  mutatedAt: string;
}

export interface ProviderVerificationResult {
  verified: boolean;
  providerState: Record<string, unknown>;
  drift: string[];
  verifiedAt: string;
}

export interface ProviderRollbackResult {
  rollbackApplied: boolean;
  providerState: Record<string, unknown>;
  rollbackId: string;
  rolledBackAt: string;
}

export interface ConnectorExecutionAdapter {
  readonly adapterId: string;
  readonly supportedConnectorIds: string[];

  execute(request: ExecutionRequest, candidate: QueueCandidate): Promise<ProviderMutationResult>;

  verify(
    request: ExecutionRequest,
    mutationResult: ProviderMutationResult,
    candidate: QueueCandidate,
  ): Promise<ProviderVerificationResult>;

  rollback(
    request: ExecutionRequest,
    cause: Error,
    candidate: QueueCandidate,
  ): Promise<ProviderRollbackResult>;

  audit(
    request: ExecutionRequest,
    mutationResult: ProviderMutationResult,
    candidate: QueueCandidate,
  ): Promise<ExecutionResult>;
}
