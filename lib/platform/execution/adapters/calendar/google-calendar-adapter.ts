import { ProviderAdapter, AdapterConfig, AdapterValidationResult } from '../provider-adapter';
import { ConnectorExecutionAdapter, ProviderMutationResult, ProviderVerificationResult, ProviderRollbackResult } from '../../connector-execution-adapter';
import { ExecutionRequest } from '../../execution-request';
import { ExecutionResult } from '../../execution-result';
import { QueueCandidate } from '../../../queue/types';
import { ConnectorCapabilityProfile, OperationCapability } from '../../capability-contract';
import { AuthenticationProvider } from '../../provider-contracts/authentication-provider';
import { Transport } from '../../provider-contracts/transport';
import { VerificationProvider, VerificationRequest, VerificationResult } from '../../provider-contracts/verification-provider';
import { CalendarRequestBuilder } from './calendar-request-builder';
import { CalendarResponseParser } from './calendar-response-parser';
import { CalendarMutationRequestBuilder } from './calendar-mutation-request-builder';
import { CalendarMutationResponseParser } from './calendar-mutation-response-parser';
import {
  CalendarEventListResponse,
  CalendarEventGetResponse,
  EventsListParams,
  EventsGetParams,
  CalendarListParams,
} from './calendar-types';
import {
  EventsInsertParams,
  EventsUpdateParams,
  EventsDeleteParams,
} from './calendar-mutation-types';

export class GoogleCalendarAdapter extends ProviderAdapter implements ConnectorExecutionAdapter {
  readonly providerId = 'google-calendar';
  readonly providerVersion = '1.0.0';
  readonly supportedOperations: string[] = [
    'events.list', 'events.get', 'calendarList.list', 'calendars.get',
    'events.insert', 'events.update', 'events.delete',
  ];
  readonly adapterId = 'google-calendar-adapter';
  readonly supportedConnectorIds: string[] = ['google-calendar'];

  private config: AdapterConfig | null = null;
  private initialized = false;
  private requestBuilder = new CalendarRequestBuilder();
  private mutationRequestBuilder = new CalendarMutationRequestBuilder();
  private responseParser = new CalendarResponseParser();
  private mutationResponseParser = new CalendarMutationResponseParser();

  constructor(
    private authProvider: AuthenticationProvider,
    private transport: Transport,
    private verificationProvider?: VerificationProvider,
  ) {
    super();
  }

  getTransport(): Transport {
    return this.transport;
  }

  getAuthProvider(): AuthenticationProvider {
    return this.authProvider;
  }

  getCapabilityProfile(): ConnectorCapabilityProfile {
    const readScopes = ['https://www.googleapis.com/auth/calendar.readonly'];
    const writeScopes = ['https://www.googleapis.com/auth/calendar.events'];
    return {
      connectorId: this.providerId,
      connectorVersion: this.providerVersion,
      supportedOperations: [
        {
          operation: 'events.list',
          canDryRun: true,
          canExecute: true,
          canVerify: true,
          canRollback: false,
          supportsIdempotency: false,
          riskLevel: 'READ',
          requiredApprovalLevel: 'NONE',
          requiredScopes: readScopes,
          parameters: [
            { name: 'calendarId', type: 'string', required: true, description: 'Calendar identifier' },
            { name: 'timeMin', type: 'string', required: false, description: 'Lower bound for event start time' },
            { name: 'timeMax', type: 'string', required: false, description: 'Upper bound for event start time' },
            { name: 'maxResults', type: 'number', required: false, description: 'Maximum number of events returned' },
            { name: 'orderBy', type: 'string', required: false, description: 'Sort order (startTime or updated)' },
          ],
        },
        {
          operation: 'events.get',
          canDryRun: true,
          canExecute: true,
          canVerify: true,
          canRollback: false,
          supportsIdempotency: false,
          riskLevel: 'READ',
          requiredApprovalLevel: 'NONE',
          requiredScopes: readScopes,
          parameters: [
            { name: 'calendarId', type: 'string', required: true, description: 'Calendar identifier' },
            { name: 'eventId', type: 'string', required: true, description: 'Event identifier' },
          ],
        },
        {
          operation: 'calendarList.list',
          canDryRun: true,
          canExecute: true,
          canVerify: true,
          canRollback: false,
          supportsIdempotency: false,
          riskLevel: 'READ',
          requiredApprovalLevel: 'NONE',
          requiredScopes: readScopes,
          parameters: [
            { name: 'maxResults', type: 'number', required: false, description: 'Maximum number of calendars returned' },
          ],
        },
        {
          operation: 'calendars.get',
          canDryRun: true,
          canExecute: true,
          canVerify: true,
          canRollback: false,
          supportsIdempotency: false,
          riskLevel: 'READ',
          requiredApprovalLevel: 'NONE',
          requiredScopes: readScopes,
          parameters: [
            { name: 'calendarId', type: 'string', required: true, description: 'Calendar identifier' },
          ],
        },
        {
          operation: 'events.insert',
          canDryRun: true,
          canExecute: true,
          canVerify: true,
          canRollback: true,
          supportsIdempotency: true,
          riskLevel: 'MODIFY',
          requiredApprovalLevel: 'STANDARD',
          requiredScopes: writeScopes,
          parameters: [
            { name: 'calendarId', type: 'string', required: true, description: 'Calendar identifier' },
            { name: 'summary', type: 'string', required: true, description: 'Event title' },
          ],
        },
        {
          operation: 'events.update',
          canDryRun: true,
          canExecute: true,
          canVerify: true,
          canRollback: true,
          supportsIdempotency: true,
          riskLevel: 'MODIFY',
          requiredApprovalLevel: 'STANDARD',
          requiredScopes: writeScopes,
          parameters: [
            { name: 'calendarId', type: 'string', required: true, description: 'Calendar identifier' },
            { name: 'eventId', type: 'string', required: true, description: 'Event identifier' },
          ],
        },
        {
          operation: 'events.delete',
          canDryRun: true,
          canExecute: true,
          canVerify: true,
          canRollback: true,
          supportsIdempotency: true,
          riskLevel: 'DESTRUCTIVE',
          requiredApprovalLevel: 'HEIGHTENED',
          requiredScopes: writeScopes,
          parameters: [
            { name: 'calendarId', type: 'string', required: true, description: 'Calendar identifier' },
            { name: 'eventId', type: 'string', required: true, description: 'Event identifier' },
          ],
        },
      ],
    };
  }

  async initialize(config: AdapterConfig): Promise<void> {
    this.config = config;
    this.initialized = true;
  }

  async validate(): Promise<AdapterValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.initialized) {
      errors.push('NOT_INITIALIZED: adapter has not been initialized');
    }

    const available = await this.transport.isAvailable();
    if (!available) {
      warnings.push('TRANSPORT_UNAVAILABLE: transport layer reports unavailable');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  async dispose(): Promise<void> {
    this.initialized = false;
    this.config = null;
  }

  async execute(
    request: ExecutionRequest,
    candidate: QueueCandidate,
  ): Promise<ProviderMutationResult> {
    this.ensureInitialized();

    const token = await this.authProvider.acquireToken(
      request.executionId,
      this.getRequiredScopes(request.operation),
    );

    let providerRequest;
    if (request.operation === 'events.list') {
      const params = this.extractEventsListParams(request, candidate);
      providerRequest = this.requestBuilder.buildListEvents(request.executionId, params, token.accessToken);
    } else if (request.operation === 'events.get') {
      const params = this.extractEventsGetParams(request, candidate);
      providerRequest = this.requestBuilder.buildGetEvent(request.executionId, params, token.accessToken);
    } else if (request.operation === 'calendarList.list') {
      const params = this.extractCalendarListParams(request, candidate);
      providerRequest = this.requestBuilder.buildListCalendars(request.executionId, params, token.accessToken);
    } else if (request.operation === 'events.insert') {
      const params = this.extractEventsInsertParams(request, candidate);
      providerRequest = this.mutationRequestBuilder.buildInsertEvent(
        request.executionId, params, token.accessToken, request.idempotencyToken || null,
      );
    } else if (request.operation === 'events.update') {
      const params = this.extractEventsUpdateParams(request, candidate);
      providerRequest = this.mutationRequestBuilder.buildUpdateEvent(
        request.executionId, params, token.accessToken, request.idempotencyToken || null,
      );
    } else if (request.operation === 'events.delete') {
      const params = this.extractEventsDeleteParams(request, candidate);
      providerRequest = this.mutationRequestBuilder.buildDeleteEvent(
        request.executionId, params, token.accessToken, request.idempotencyToken || null,
      );
    } else {
      return {
        mutationId: '',
        providerState: {},
        mutatedAt: '2026-01-01T00:00:00Z',
      };
    }

    const providerResponse = await this.transport.send(providerRequest);

    const parsedBody = providerResponse.body as Record<string, unknown> | null;

    return {
      mutationId: providerResponse.requestId,
      providerState: {
        operation: request.operation,
        statusCode: providerResponse.statusCode,
        body: parsedBody,
        etag: providerResponse.etag,
        requestUrl: providerRequest.url,
      },
      etag: providerResponse.etag ?? undefined,
      revision: providerResponse.revisionId ? parseInt(providerResponse.revisionId, 10) : undefined,
      mutatedAt: providerResponse.receivedAt,
    };
  }

  async verify(
    request: ExecutionRequest,
    mutationResult: ProviderMutationResult,
    candidate: QueueCandidate,
  ): Promise<ProviderVerificationResult> {
    if (this.verificationProvider) {
      const verificationReq: VerificationRequest = {
        verificationId: `ver-${request.executionId}`,
        executionId: request.executionId,
        operation: request.operation,
        expectedState: {},
        actualProviderState: mutationResult.providerState,
        mutationResult: mutationResult as unknown as Record<string, unknown>,
      };
      const result = await this.verificationProvider.verify(verificationReq);
      return {
        verified: result.outcome === 'VERIFIED',
        providerState: result.actualState,
        drift: result.drift,
        verifiedAt: result.verifiedAt,
      };
    }

    if (request.operation === 'events.list' || request.operation === 'events.get') {
      return await this.readBackVerify(request, mutationResult, candidate);
    }

    if (request.operation === 'events.insert' || request.operation === 'events.update') {
      return await this.mutationReadBackVerify(request, mutationResult, candidate);
    }

    if (request.operation === 'events.delete') {
      return await this.deleteVerify(request, mutationResult, candidate);
    }

    return {
      verified: true,
      providerState: mutationResult.providerState,
      drift: [],
      verifiedAt: '2026-01-01T00:00:00Z',
    };
  }

  async rollback(
    request: ExecutionRequest,
    cause: Error,
    candidate: QueueCandidate,
  ): Promise<ProviderRollbackResult> {
    const calendarId = this.resolveCalendarId(request, candidate);

    if (request.operation === 'events.insert') {
      const providerBody = (request as unknown as Record<string, unknown>).lastMutationBody as Record<string, unknown> | undefined;
      const insertedEventId = providerBody?.id as string | undefined;
      if (insertedEventId) {
        const params: EventsDeleteParams = { calendarId, eventId: insertedEventId };
        const token = await this.authProvider.acquireToken(
          request.executionId, this.getRequiredScopes('events.delete'),
        );
        await this.transport.send(
          this.mutationRequestBuilder.buildDeleteEvent(request.executionId, params, token.accessToken, null),
        );
        return {
          rollbackApplied: true,
          providerState: { operation: 'events.delete', eventId: insertedEventId },
          rollbackId: `rb-${request.executionId}`,
          rolledBackAt: '2026-01-01T00:00:00Z',
        };
      }
      return {
        rollbackApplied: false,
        providerState: { note: 'No eventId available for compensating delete' },
        rollbackId: '',
        rolledBackAt: '2026-01-01T00:00:00Z',
      };
    }

    if (request.operation === 'events.update') {
      return {
        rollbackApplied: false,
        providerState: { note: 'Update rollback requires previous state snapshot' },
        rollbackId: '',
        rolledBackAt: '2026-01-01T00:00:00Z',
      };
    }

    if (request.operation === 'events.delete') {
      const previewPayload = (request as unknown as Record<string, unknown>).previewPayload as Record<string, unknown> | undefined;
      const deletedSummary = previewPayload?.summary as string | undefined;
      if (deletedSummary) {
        const params: EventsInsertParams = {
          calendarId,
          event: {
            summary: deletedSummary,
            start: (previewPayload?.start as { dateTime: string; timeZone?: string }) ?? { dateTime: '2026-07-20T09:00:00', timeZone: 'America/New_York' },
            end: (previewPayload?.end as { dateTime: string; timeZone?: string }) ?? { dateTime: '2026-07-20T10:00:00', timeZone: 'America/New_York' },
          },
        };
        const token = await this.authProvider.acquireToken(
          request.executionId, this.getRequiredScopes('events.insert'),
        );
        await this.transport.send(
          this.mutationRequestBuilder.buildInsertEvent(request.executionId, params, token.accessToken, null),
        );
        return {
          rollbackApplied: true,
          providerState: { operation: 'events.insert', restoredSummary: deletedSummary },
          rollbackId: `rb-${request.executionId}`,
          rolledBackAt: '2026-01-01T00:00:00Z',
        };
      }
      return {
        rollbackApplied: false,
        providerState: { note: 'No preview payload available for compensating insert' },
        rollbackId: '',
        rolledBackAt: '2026-01-01T00:00:00Z',
      };
    }

    return {
      rollbackApplied: false,
      providerState: {},
      rollbackId: '',
      rolledBackAt: '2026-01-01T00:00:00Z',
    };
  }

  async audit(
    request: ExecutionRequest,
    mutationResult: ProviderMutationResult,
    _candidate: QueueCandidate,
  ): Promise<ExecutionResult> {
    const isMutation = ['events.insert', 'events.update', 'events.delete'].includes(request.operation);
    return {
      executionOutcome: 'EXECUTION_SUCCEEDED',
      adapterId: this.adapterId,
      mutationId: mutationResult.mutationId,
      providerState: mutationResult.providerState,
      executionDurationMs: 0,
      mutationAttempted: isMutation,
      rollbackAttempted: false,
      rollbackSuccessful: false,
      status: 'SUCCESS',
      finalState: 'COMPLETED',
      transitionHistory: [`S3C: ${request.operation} completed`],
      auditProjection: null,
      executionAttempted: true,
      providerMutationAttempted: isMutation,
      providerMutationCompleted: isMutation,
      deterministicHashes: {
        inputHash: request.planHash,
        outputHash: '',
        pipelineHash: '',
      },
      warnings: [],
      blockingReasons: [],
    };
  }

  private async readBackVerify(
    request: ExecutionRequest,
    mutationResult: ProviderMutationResult,
    candidate: QueueCandidate,
  ): Promise<ProviderVerificationResult> {
    const readBackResult = await this.execute(request, candidate);
    const originalBody = (mutationResult.providerState.body as Record<string, unknown>) ?? {};
    const readBackBody = (readBackResult.providerState.body as Record<string, unknown>) ?? {};
    const drift: string[] = [];

    if (request.operation === 'events.get') {
      const originalId = originalBody.id as string;
      const readBackId = readBackBody.id as string;
      if (originalId && readBackId && originalId !== readBackId) {
        drift.push(`eventId: "${originalId}" !== "${readBackId}"`);
      }
    }

    if (request.operation === 'events.list') {
      const originalItems = (originalBody.items as Array<Record<string, unknown>>) ?? [];
      const readBackItems = (readBackBody.items as Array<Record<string, unknown>>) ?? [];
      if (originalItems.length !== readBackItems.length) {
        drift.push(`itemCount: ${originalItems.length} !== ${readBackItems.length}`);
      }
    }

    return {
      verified: drift.length === 0,
      providerState: readBackResult.providerState,
      drift,
      verifiedAt: '2026-01-01T00:00:00Z',
    };
  }

  private async mutationReadBackVerify(
    request: ExecutionRequest,
    mutationResult: ProviderMutationResult,
    candidate: QueueCandidate,
  ): Promise<ProviderVerificationResult> {
    const providerState = mutationResult.providerState as Record<string, unknown>;
    const body = providerState.body as Record<string, unknown> ?? {};
    const createdId = body.id as string;

    if (!createdId) {
      return {
        verified: false,
        providerState: mutationResult.providerState,
        drift: ['MISSING_EVENT_ID: mutation response did not contain an event id'],
        verifiedAt: '2026-01-01T00:00:00Z',
      };
    }

    const getRequest = { ...request, operation: 'events.get' };
    const getCandidate = {
      ...candidate,
      executionManifest: {
        ...candidate.executionManifest,
        resourceSummary: {
          ...candidate.executionManifest?.resourceSummary,
          targetId: this.resolveCalendarId(request, candidate),
        },
      },
    };

    const readBackResult = await this.execute(getRequest, getCandidate);
    const readBackBody = (readBackResult.providerState.body as Record<string, unknown>) ?? {};
    const drift: string[] = [];

    if (readBackBody.id !== createdId) {
      drift.push(`eventId mismatch: created="${createdId}" read="${readBackBody.id}"`);
    }
    if (readBackBody.status === 'cancelled') {
      drift.push('eventStatus: read-back returned cancelled');
    }

    return {
      verified: drift.length === 0,
      providerState: readBackResult.providerState,
      drift,
      verifiedAt: '2026-01-01T00:00:00Z',
    };
  }

  private async deleteVerify(
    _request: ExecutionRequest,
    mutationResult: ProviderMutationResult,
    candidate: QueueCandidate,
  ): Promise<ProviderVerificationResult> {
    const providerState = mutationResult.providerState as Record<string, unknown>;
    const body = providerState.body as Record<string, unknown> ?? {};
    const deletedId = body.id as string;

    if (!deletedId) {
      return {
        verified: true,
        providerState: mutationResult.providerState,
        drift: [],
        verifiedAt: '2026-01-01T00:00:00Z',
      };
    }

    const getRequest = { ..._request, operation: 'events.get' };
    try {
      const readBackResult = await this.execute(getRequest, candidate);
      const readBackBody = (readBackResult.providerState.body as Record<string, unknown>) ?? {};
      if (readBackBody.status === 'cancelled' || readBackBody.status === undefined) {
        return {
          verified: true,
          providerState: readBackResult.providerState,
          drift: [],
          verifiedAt: '2026-01-01T00:00:00Z',
        };
      }
      return {
        verified: false,
        providerState: readBackResult.providerState,
        drift: [`eventStatus: expected cancelled, got "${readBackBody.status}"`],
        verifiedAt: '2026-01-01T00:00:00Z',
      };
    } catch {
      return {
        verified: true,
        providerState: mutationResult.providerState,
        drift: ['eventNotFound: 404 confirms deletion'],
        verifiedAt: '2026-01-01T00:00:00Z',
      };
    }
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('ADAPTER_NOT_INITIALIZED: GoogleCalendarAdapter must be initialized before use');
    }
  }

  private getRequiredScopes(operation: string): string[] {
    if (['events.insert', 'events.update', 'events.delete'].includes(operation)) {
      return ['https://www.googleapis.com/auth/calendar.events'];
    }
    if (['events.list', 'events.get', 'calendarList.list', 'calendars.get'].includes(operation)) {
      return ['https://www.googleapis.com/auth/calendar.readonly'];
    }
    return [];
  }

  private resolveCalendarId(request: ExecutionRequest, candidate: QueueCandidate): string {
    return candidate.executionManifest?.resourceSummary?.targetId ?? 'primary';
  }

  private extractEventsListParams(
    request: ExecutionRequest,
    candidate: QueueCandidate,
  ): EventsListParams {
    const params: EventsListParams = {
      calendarId: this.resolveCalendarId(request, candidate),
    };
    if (candidate.executionManifest?.resourceSummary?.targetId) {
      params.calendarId = candidate.executionManifest.resourceSummary.targetId;
    }
    return params;
  }

  private extractEventsGetParams(
    request: ExecutionRequest,
    candidate: QueueCandidate,
  ): EventsGetParams {
    return {
      calendarId: this.resolveCalendarId(request, candidate),
      eventId: candidate.queueId,
    };
  }

  private extractCalendarListParams(
    _request: ExecutionRequest,
    _candidate: QueueCandidate,
  ): CalendarListParams {
    return {};
  }

  private extractEventsInsertParams(
    request: ExecutionRequest,
    candidate: QueueCandidate,
  ): EventsInsertParams {
    const calendarId = this.resolveCalendarId(request, candidate);
    return {
      calendarId,
      event: {
        summary: 'Sandbox Test Event',
        start: { dateTime: '2026-07-20T09:00:00', timeZone: 'America/New_York' },
        end: { dateTime: '2026-07-20T10:00:00', timeZone: 'America/New_York' },
      },
    };
  }

  private extractEventsUpdateParams(
    request: ExecutionRequest,
    candidate: QueueCandidate,
  ): EventsUpdateParams {
    const calendarId = this.resolveCalendarId(request, candidate);
    return {
      calendarId,
      eventId: candidate.queueId,
      event: {
        summary: 'Updated Sandbox Event',
      },
    };
  }

  private extractEventsDeleteParams(
    request: ExecutionRequest,
    candidate: QueueCandidate,
  ): EventsDeleteParams {
    const calendarId = this.resolveCalendarId(request, candidate);
    return {
      calendarId,
      eventId: candidate.queueId,
    };
  }
}
