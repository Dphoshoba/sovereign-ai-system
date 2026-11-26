import { FederationRegistry } from "./federation-registry";

// ── Execution Status ──

export type RemoteExecutionStatus =
  | 'pending'
  | 'routing'
  | 'accepted'
  | 'completed'
  | 'failed'
  | 'rejected';

// ── Remote Request ──

export interface RemoteExecutionRequest {
  readonly requestId: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly workflowType: string;
  readonly input: Readonly<Record<string, unknown>>;
  readonly correlationId: string;
  readonly requestedAt: number;
}

// ── Remote Response ──

export interface RemoteExecutionResponse {
  readonly requestId: string;
  readonly success: boolean;
  readonly result: Readonly<Record<string, unknown>> | null;
  readonly error: string | null;
  readonly completedAt: number;
}

// ── Cross-Node Execution Record ──

export interface CrossNodeExecution {
  readonly id: string;
  readonly correlationId: string;
  readonly sourceNode: string;
  readonly targetNode: string;
  readonly workflowType: string;
  readonly status: RemoteExecutionStatus;
  readonly requestedAt: number;
  readonly completedAt: number | null;
  readonly error: string | null;
}

// ── Coordinator ──

export interface CrossPlatformCoordinator {
  requestRemoteExecution(
    sourceNodeId: string,
    targetNodeId: string,
    workflowType: string,
    input: Readonly<Record<string, unknown>>,
  ): Promise<CrossNodeExecution>;

  handleRemoteRequest(request: RemoteExecutionRequest): RemoteExecutionResponse;

  getExecution(executionId: string): CrossNodeExecution | undefined;
  listExecutions(): readonly CrossNodeExecution[];

  getCorrelatedExecutions(correlationId: string): readonly CrossNodeExecution[];
}

// ── Error ──

export class CrossPlatformCoordinatorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CrossPlatformCoordinatorError';
  }
}
