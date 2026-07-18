import { ProviderRequest } from '../../provider-contracts/provider-request';
import { EventsInsertParams, EventsUpdateParams, EventsDeleteParams } from './calendar-mutation-types';

const GOOGLE_API_BASE = 'https://www.googleapis.com/calendar/v3';

export class CalendarMutationRequestBuilder {
  private requestCounter = 0;

  buildInsertEvent(
    executionId: string,
    params: EventsInsertParams,
    accessToken: string,
    idempotencyKey: string | null,
  ): ProviderRequest {
    const encodedCalendarId = encodeURIComponent(params.calendarId);
    const query = this.buildMutationQuery(params);
    return this.createRequest(
      executionId, 'POST', `/calendars/${encodedCalendarId}/events${query}`,
      accessToken, params.event as unknown as Record<string, unknown>, idempotencyKey,
    );
  }

  buildUpdateEvent(
    executionId: string,
    params: EventsUpdateParams,
    accessToken: string,
    idempotencyKey: string | null,
  ): ProviderRequest {
    const encodedCalendarId = encodeURIComponent(params.calendarId);
    const encodedEventId = encodeURIComponent(params.eventId);
    const query = this.buildMutationQuery(params);
    return this.createRequest(
      executionId, 'PUT', `/calendars/${encodedCalendarId}/events/${encodedEventId}${query}`,
      accessToken, params.event as unknown as Record<string, unknown>, idempotencyKey,
    );
  }

  buildDeleteEvent(
    executionId: string,
    params: EventsDeleteParams,
    accessToken: string,
    idempotencyKey: string | null,
  ): ProviderRequest {
    const encodedCalendarId = encodeURIComponent(params.calendarId);
    const encodedEventId = encodeURIComponent(params.eventId);
    const query = this.buildMutationQuery(params);
    return this.createRequest(
      executionId, 'DELETE', `/calendars/${encodedCalendarId}/events/${encodedEventId}${query}`,
      accessToken, null, idempotencyKey,
    );
  }

  private createRequest(
    executionId: string,
    method: 'POST' | 'PUT' | 'DELETE',
    path: string,
    accessToken: string,
    body: Record<string, unknown> | null,
    idempotencyKey: string | null,
  ): ProviderRequest {
    this.requestCounter++;
    return {
      requestId: `cal-mut-${this.requestCounter}`,
      executionId,
      method,
      url: `${GOOGLE_API_BASE}${path}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      },
      body,
      bodyFormat: body ? 'json' : 'none',
      idempotencyKey,
      timeoutMs: 30000,
      retryAttempt: 0,
      maxRetries: 2,
      metadata: { source: 'google-calendar-mutation-adapter' },
    };
  }

  private buildMutationQuery(
    params: EventsInsertParams | EventsUpdateParams | EventsDeleteParams,
  ): string {
    const parts: string[] = [];
    if ('sendUpdates' in params && params.sendUpdates) {
      parts.push(`sendUpdates=${encodeURIComponent(params.sendUpdates)}`);
    }
    if ('supportsAttachments' in params && params.supportsAttachments) {
      parts.push('supportsAttachments=true');
    }
    return parts.length > 0 ? `?${parts.join('&')}` : '';
  }
}
