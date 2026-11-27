import { ExecutionRequest } from '../execution-request';
import { QueueCandidate } from '../../queue/types';
import { MutationPlan } from './dry-run-types';

export function computeDeterministicIdempotencyKey(
  executionId: string,
  operation: string,
  operationHash: string,
  attemptNumber: number,
): string {
  const raw = `${executionId}:${operation}:${operationHash}:${attemptNumber}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(i);
    hash |= 0;
  }
  return `idem-${executionId}-${Math.abs(hash).toString(16).padStart(8, '0')}-${attemptNumber}`;
}

export function computeOperationHash(params: Record<string, unknown>): string {
  const serialized = JSON.stringify(params, Object.keys(params).sort());
  let hash = 0;
  for (let i = 0; i < serialized.length; i++) {
    hash = ((hash << 5) - hash) + serialized.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

export class MutationPlanner {
  plan(
    request: ExecutionRequest,
    candidate: QueueCandidate,
  ): MutationPlan {
    const operation = request.operation;
    const executionId = request.executionId;

    let requestBody: Record<string, unknown> | null = null;
    let expectedStatusCode = 200;
    const parameters: Record<string, string> = {};

    const targetId = candidate.executionManifest.resourceSummary.targetId ?? 'primary';

    if (operation === 'events.insert') {
      requestBody = {
        summary: `Dry-run event: ${executionId}`,
        description: `Gamma OS dry-run execution ${executionId}`,
        start: {
          dateTime: '2026-07-20T09:00:00',
          timeZone: 'America/New_York',
        },
        end: {
          dateTime: '2026-07-20T09:30:00',
          timeZone: 'America/New_York',
        },
      };
      expectedStatusCode = 200;
      parameters.calendarId = targetId;
    } else if (operation === 'events.update') {
      requestBody = {
        summary: `Dry-run updated event: ${executionId}`,
      };
      expectedStatusCode = 200;
      parameters.calendarId = targetId;
      parameters.eventId = candidate.queueId;
    } else if (operation === 'events.delete') {
      requestBody = null;
      expectedStatusCode = 204;
      parameters.calendarId = targetId;
      parameters.eventId = candidate.queueId;
    }

    const opHash = computeOperationHash({
      operation,
      body: requestBody,
      parameters,
    });

    const idempotencyKey = computeDeterministicIdempotencyKey(
      executionId,
      operation,
      opHash,
      0,
    );

    return {
      operation,
      requestBody,
      expectedStatusCode,
      parameters,
      idempotencyKey,
    };
  }
}
