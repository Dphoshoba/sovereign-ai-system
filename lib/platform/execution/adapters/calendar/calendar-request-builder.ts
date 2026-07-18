import { ProviderRequest, HttpMethod } from '../../provider-contracts/provider-request';
import { CalendarListParams, EventsListParams, EventsGetParams } from './calendar-types';

const GOOGLE_API_BASE = 'https://www.googleapis.com/calendar/v3';

export class CalendarRequestBuilder {
  private requestCounter = 0;

  buildListCalendars(
    executionId: string,
    params: CalendarListParams,
    accessToken: string,
  ): ProviderRequest {
    const query = this.buildCalendarListQuery(params);
    return this.createRequest(executionId, 'GET', `/users/me/calendarList?${query}`, accessToken);
  }

  buildListEvents(
    executionId: string,
    params: EventsListParams,
    accessToken: string,
  ): ProviderRequest {
    const encodedCalendarId = encodeURIComponent(params.calendarId);
    const query = this.buildEventsQuery(params);
    return this.createRequest(executionId, 'GET', `/calendars/${encodedCalendarId}/events?${query}`, accessToken);
  }

  buildGetEvent(
    executionId: string,
    params: EventsGetParams,
    accessToken: string,
  ): ProviderRequest {
    const encodedCalendarId = encodeURIComponent(params.calendarId);
    const encodedEventId = encodeURIComponent(params.eventId);
    return this.createRequest(executionId, 'GET', `/calendars/${encodedCalendarId}/events/${encodedEventId}`, accessToken);
  }

  private createRequest(
    executionId: string,
    method: HttpMethod,
    path: string,
    accessToken: string,
  ): ProviderRequest {
    this.requestCounter++;
    return {
      requestId: `cal-req-${this.requestCounter}`,
      executionId,
      method,
      url: `${GOOGLE_API_BASE}${path}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
      body: null,
      bodyFormat: 'none',
      idempotencyKey: null,
      timeoutMs: 30000,
      retryAttempt: 0,
      maxRetries: 2,
      metadata: { source: 'google-calendar-adapter' },
    };
  }

  private buildCalendarListQuery(params: CalendarListParams): string {
    const parts: string[] = [];
    const mappings: Array<[keyof CalendarListParams, string]> = [
      ['minAccessRole', 'minAccessRole'],
      ['maxResults', 'maxResults'],
      ['pageToken', 'pageToken'],
      ['showDeleted', 'showDeleted'],
      ['showHidden', 'showHidden'],
    ];
    for (const [objKey, queryKey] of mappings) {
      const value = params[objKey];
      if (value !== undefined) {
        parts.push(`${encodeURIComponent(queryKey)}=${encodeURIComponent(String(value))}`);
      }
    }
    return parts.join('&');
  }

  private buildEventsQuery(params: EventsListParams): string {
    const parts: string[] = [];
    const mappings: Array<[keyof EventsListParams, string]> = [
      ['timeMin', 'timeMin'],
      ['timeMax', 'timeMax'],
      ['updatedMin', 'updatedMin'],
      ['maxResults', 'maxResults'],
      ['pageToken', 'pageToken'],
      ['showDeleted', 'showDeleted'],
      ['showHiddenInvitations', 'showHiddenInvitations'],
      ['singleEvents', 'singleEvents'],
      ['orderBy', 'orderBy'],
      ['q', 'q'],
    ];
    for (const [objKey, queryKey] of mappings) {
      const value = params[objKey];
      if (value !== undefined) {
        parts.push(`${encodeURIComponent(queryKey)}=${encodeURIComponent(String(value))}`);
      }
    }
    return parts.join('&');
  }
}
