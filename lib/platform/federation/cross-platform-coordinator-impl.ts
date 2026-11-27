import {
  CrossPlatformCoordinator,
  CrossNodeExecution,
  RemoteExecutionRequest,
  RemoteExecutionResponse,
  RemoteExecutionStatus,
  CrossPlatformCoordinatorError,
} from "./cross-platform-coordinator";
import { FederationRegistry } from "./federation-registry";

let executionCounter = 0;

function nextExecutionId(): string {
  return `cx-${++executionCounter}-${Date.now()}`;
}

function nextCorrelationId(): string {
  return `corr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── Implementation ──

export class CrossPlatformCoordinatorImpl implements CrossPlatformCoordinator {
  private executions = new Map<string, CrossNodeExecution>();

  constructor(private readonly registry: FederationRegistry) {}

  async requestRemoteExecution(
    sourceNodeId: string,
    targetNodeId: string,
    workflowType: string,
    input: Readonly<Record<string, unknown>>,
  ): Promise<CrossNodeExecution> {
    if (!this.registry.getNode(sourceNodeId)) {
      throw new CrossPlatformCoordinatorError(`Source node not found: ${sourceNodeId}`);
    }
    if (!this.registry.getNode(targetNodeId)) {
      throw new CrossPlatformCoordinatorError(`Target node not found: ${targetNodeId}`);
    }

    const trusted = this.registry.verifyTrust(sourceNodeId, targetNodeId);
    const correlationId = nextCorrelationId();
    const now = Date.now();

    let status: RemoteExecutionStatus;
    let error: string | null;

    if (trusted) {
      status = 'accepted';
      error = null;
    } else {
      status = 'rejected';
      error = `No trust relationship from ${sourceNodeId} to ${targetNodeId}`;
    }

    const execution: CrossNodeExecution = {
      id: nextExecutionId(),
      correlationId,
      sourceNode: sourceNodeId,
      targetNode: targetNodeId,
      workflowType,
      status,
      requestedAt: now,
      completedAt: status === 'rejected' ? now : null,
      error,
    };

    this.executions.set(execution.id, execution);
    return execution;
  }

  handleRemoteRequest(request: RemoteExecutionRequest): RemoteExecutionResponse {
    const trusted = this.registry.verifyTrust(request.sourceNodeId, request.targetNodeId);
    const now = Date.now();

    if (!trusted) {
      const execution = this.tryGetExecutionByRequestId(request.requestId);
      if (execution) {
        this.updateExecution(execution.id, 'rejected', `Untrusted source: ${request.sourceNodeId}`);
      }
      return {
        requestId: request.requestId,
        success: false,
        result: null,
        error: `Untrusted source node: ${request.sourceNodeId}`,
        completedAt: now,
      };
    }

    this.updateExecutionByRequestId(request.requestId, 'completed', null);

    return {
      requestId: request.requestId,
      success: true,
      result: { workflowType: request.workflowType, processed: true, inputSnapshot: { ...request.input } },
      error: null,
      completedAt: now,
    };
  }

  getExecution(executionId: string): CrossNodeExecution | undefined {
    return this.executions.get(executionId);
  }

  listExecutions(): readonly CrossNodeExecution[] {
    return [...this.executions.values()];
  }

  getCorrelatedExecutions(correlationId: string): readonly CrossNodeExecution[] {
    return [...this.executions.values()].filter(e => e.correlationId === correlationId);
  }

  // ── Internals ──

  private updateExecution(id: string, status: RemoteExecutionStatus, error: string | null): void {
    const existing = this.executions.get(id);
    if (!existing) return;
    this.executions.set(id, {
      ...existing,
      status,
      completedAt: (status === 'completed' || status === 'failed' || status === 'rejected') ? Date.now() : existing.completedAt,
      error: error ?? existing.error,
    });
  }

  private tryGetExecutionByRequestId(requestId: string): CrossNodeExecution | undefined {
    // requestId maps to execution id in this implementation
    return this.executions.get(requestId);
  }

  private updateExecutionByRequestId(requestId: string, status: RemoteExecutionStatus, error: string | null): void {
    const execution = this.tryGetExecutionByRequestId(requestId);
    if (execution) {
      this.updateExecution(execution.id, status, error);
    }
  }
}
