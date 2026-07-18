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
import {
  CalendarEventListResponse,
  CalendarEventGetResponse,
  EventsListParams,
  EventsGetParams,
  CalendarListParams,
} from './calendar-types';

export class GoogleCalendarAdapter extends ProviderAdapter implements ConnectorExecutionAdapter {
  readonly providerId = 'google-calendar';
  readonly providerVersion = '1.0.0';
  readonly supportedOperations: string[] = ['events.list', 'events.get', 'calendarList.list', 'calendars.get'];
  readonly adapterId = 'google-calendar-adapter';
  readonly supportedConnectorIds: string[] = ['google-calendar'];

  private config: AdapterConfig | null = null;
  private initialized = false;
  private requestBuilder = new CalendarRequestBuilder();
  private responseParser = new CalendarResponseParser();

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

    return {
      verified: true,
      providerState: mutationResult.providerState,
      drift: [],
      verifiedAt: '2026-01-01T00:00:00Z',
    };
  }

  async rollback(
    _request: ExecutionRequest,
    _cause: Error,
    _candidate: QueueCandidate,
  ): Promise<ProviderRollbackResult> {
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
    return {
      executionOutcome: 'EXECUTION_SUCCEEDED',
      adapterId: this.adapterId,
      mutationId: mutationResult.mutationId,
      providerState: mutationResult.providerState,
      executionDurationMs: 0,
      mutationAttempted: false,
      rollbackAttempted: false,
      rollbackSuccessful: false,
      status: 'SUCCESS',
      finalState: 'COMPLETED',
      transitionHistory: [`S3C: ${request.operation} completed`],
      auditProjection: null,
      executionAttempted: true,
      providerMutationAttempted: false,
      providerMutationCompleted: false,
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

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('ADAPTER_NOT_INITIALIZED: GoogleCalendarAdapter must be initialized before use');
    }
  }

  private getRequiredScopes(operation: string): string[] {
    if (operation === 'events.list' || operation === 'events.get' ||
        operation === 'calendarList.list' || operation === 'calendars.get') {
      return ['https://www.googleapis.com/auth/calendar.readonly'];
    }
    return [];
  }

  private extractEventsListParams(
    request: ExecutionRequest,
    candidate: QueueCandidate,
  ): EventsListParams {
    const params: EventsListParams = {
      calendarId: 'primary',
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
      calendarId: candidate.executionManifest.resourceSummary.targetId ?? 'primary',
      eventId: candidate.queueId,
    };
  }

  private extractCalendarListParams(
    _request: ExecutionRequest,
    _candidate: QueueCandidate,
  ): CalendarListParams {
    return {};
  }
}
