import { ProviderResponse } from '../../provider-contracts/provider-response';
import {
  CalendarEvent,
  CalendarEventListResponse,
  CalendarEventGetResponse,
  CalendarListResponse,
  CalendarListEntry,
} from './calendar-types';

export interface ParsedCalendarResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export class CalendarResponseParser {
  parseEventList(response: ProviderResponse): ParsedCalendarResponse<CalendarEventListResponse> {
    if (response.statusCode !== 200) {
      return { success: false, data: null, error: this.parseError(response) };
    }
    if (!response.body || typeof response.body !== 'object') {
      return { success: false, data: null, error: 'INVALID_RESPONSE_BODY: response body is not an object' };
    }

    const body = response.body as Record<string, unknown>;
    if (body.kind !== 'calendar#events') {
      return { success: false, data: null, error: `UNEXPECTED_KIND: expected 'calendar#events', got '${body.kind}'` };
    }
    if (!Array.isArray(body.items)) {
      return { success: false, data: null, error: 'MISSING_ITEMS: response has no items array' };
    }

    return { success: true, data: body as unknown as CalendarEventListResponse, error: null };
  }

  parseEventGet(response: ProviderResponse): ParsedCalendarResponse<CalendarEventGetResponse> {
    if (response.statusCode !== 200) {
      return { success: false, data: null, error: this.parseError(response) };
    }
    if (!response.body || typeof response.body !== 'object') {
      return { success: false, data: null, error: 'INVALID_RESPONSE_BODY: response body is not an object' };
    }

    const body = response.body as Record<string, unknown>;
    if (body.kind !== 'calendar#event') {
      return { success: false, data: null, error: `UNEXPECTED_KIND: expected 'calendar#event', got '${body.kind}'` };
    }
    if (!body.id) {
      return { success: false, data: null, error: 'MISSING_EVENT_ID: response has no event id' };
    }

    return { success: true, data: body as unknown as CalendarEventGetResponse, error: null };
  }

  parseCalendarList(response: ProviderResponse): ParsedCalendarResponse<CalendarListResponse> {
    if (response.statusCode !== 200) {
      return { success: false, data: null, error: this.parseError(response) };
    }
    if (!response.body || typeof response.body !== 'object') {
      return { success: false, data: null, error: 'INVALID_RESPONSE_BODY: response body is not an object' };
    }

    const body = response.body as Record<string, unknown>;
    if (body.kind !== 'calendar#calendarList') {
      return { success: false, data: null, error: `UNEXPECTED_KIND: expected 'calendar#calendarList', got '${body.kind}'` };
    }
    if (!Array.isArray(body.items)) {
      return { success: false, data: null, error: 'MISSING_ITEMS: response has no items array' };
    }

    return { success: true, data: body as unknown as CalendarListResponse, error: null };
  }

  private parseError(response: ProviderResponse): string {
    if (response.statusCode === 404) {
      return 'NOT_FOUND: The requested resource was not found';
    }
    if (response.statusCode === 401) {
      return 'UNAUTHORIZED: Authentication failed or token expired';
    }
    if (response.statusCode === 403) {
      return 'FORBIDDEN: Insufficient permissions to access the resource';
    }
    if (response.statusCode === 429) {
      return 'RATE_LIMITED: API rate limit exceeded';
    }
    if (response.statusCode >= 500) {
      return `SERVER_ERROR: Calendar API returned ${response.statusCode}`;
    }
    return `ERROR_${response.statusCode}: Calendar API request failed`;
  }
}
