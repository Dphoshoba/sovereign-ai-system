import { QueueCandidate } from "../queue/types";
import { GovernanceDecision } from "../governance/types";
import { ConnectorRuntimeCapabilities } from "./capabilities";

export interface ExecutionRequest {
  executionId: string;
  queueId: string;
  connectorId: string;
  operation: string;

  candidate: QueueCandidate;
  decision: GovernanceDecision;
  capabilities: ConnectorRuntimeCapabilities;

  idempotencyToken: string;
  planHash: string;
  requestedAt: string;
}

export function createExecutionRequest(
  candidate: QueueCandidate,
  decision: GovernanceDecision,
  capabilities: ConnectorRuntimeCapabilities,
): ExecutionRequest {
  const executionId = `s3b-${candidate.queueId}`;
  const serialized = JSON.stringify({ candidate, decision, capabilities });
  const planHash = computeDeterministicPlanHash(serialized);

  return {
    executionId,
    queueId: candidate.queueId,
    connectorId: candidate.connectorId,
    operation: candidate.operation,
    candidate,
    decision,
    capabilities,
    idempotencyToken: candidate.idempotencyToken,
    planHash,
    requestedAt: '2026-01-01T00:00:00Z',
  };
}

export function computeDeterministicPlanHash(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data.charCodeAt(i);
    hash |= 0;
  }
  return `plan-${Math.abs(hash).toString(16).padStart(8, '0')}`;
}
