import { QueueCandidate } from "../queue/types";
import { GovernanceDecision } from "../governance/types";
import { ConnectorRuntimeCapabilities } from "./capabilities";
import { RuntimeSnapshot } from "./capabilities";

export interface ExecutionContext {
  executionId: string;
  runtimeVersion: string;
  state: string;
  candidate: QueueCandidate;
  decision: GovernanceDecision;
  capabilities: ConnectorRuntimeCapabilities;
  auditLog: string[];
}

export class ExecutionContextManager {
  static create(candidate: QueueCandidate, decision: GovernanceDecision, capabilities: ConnectorRuntimeCapabilities): ExecutionContext {
    return {
      executionId: `exe-${candidate.queueId}`,
      runtimeVersion: '1.0.0',
      state: 'RECEIVED',
      candidate,
      decision,
      capabilities,
      auditLog: [],
    };
  }

  /**
   * Creates a deterministic snapshot of the current context.
   */
  static createSnapshot(
    context: ExecutionContext,
    stepIndex: number,
    stepName: string,
  ): RuntimeSnapshot<ExecutionContext> {
    const serialized = JSON.stringify(context);
    const snapshot = {
      stepIndex,
      stepName,
      state: context.state,
      context: this.clone(context),
      snapshotHash: this.computeDeterministicHash(serialized),
      timestamp: '2026-01-01T00:00:00Z',
    };

    return this.deepFreeze(snapshot);
  }

  static clone(context: ExecutionContext): ExecutionContext {
    return JSON.parse(JSON.stringify(context)) as ExecutionContext;
  }

  private static computeDeterministicHash(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash) + data.charCodeAt(i);
      hash |= 0;
    }
    return `snap-${Math.abs(hash).toString(16).padStart(8, '0')}`;
  }

  private static deepFreeze<T>(value: T): T {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.freeze(value);
      for (const child of Object.values(value)) {
        this.deepFreeze(child);
      }
    }

    return value;
  }
}
