import { ProviderResponse } from '../../provider-contracts/provider-response';
import {
  CalendarEventInsertResponse,
  CalendarEventUpdateResponse,
  CalendarEventDeleteResponse,
} from './calendar-mutation-types';

export interface ParsedMutationResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export class CalendarMutationResponseParser {
  parseEventInsert(response: ProviderResponse): ParsedMutationResponse<CalendarEventInsertResponse> {
    if (response.statusCode === 200 || response.statusCode === 201) {
      return this.parseSuccess(response, 'calendar#event') as ParsedMutationResponse<CalendarEventInsertResponse>;
    }
    return { success: false, data: null, error: this.parseError(response) };
  }

  parseEventUpdate(response: ProviderResponse): ParsedMutationResponse<CalendarEventUpdateResponse> {
    if (response.statusCode === 200) {
      return this.parseSuccess(response, 'calendar#event') as ParsedMutationResponse<CalendarEventUpdateResponse>;
    }
    return { success: false, data: null, error: this.parseError(response) };
  }

  parseEventDelete(response: ProviderResponse): ParsedMutationResponse<CalendarEventDeleteResponse> {
    if (response.statusCode === 204) {
      return { success: true, data: null, error: null };
    }
    return { success: false, data: null, error: this.parseError(response) };
  }

  private parseSuccess(response: ProviderResponse, expectedKind: string): ParsedMutationResponse<unknown> {
    if (!response.body || typeof response.body !== 'object') {
      return { success: false, data: null, error: 'INVALID_RESPONSE_BODY: response body is not an object' };
    }
    const body = response.body as Record<string, unknown>;
    if (body.kind && body.kind !== expectedKind) {
      return { success: false, data: null, error: `UNEXPECTED_KIND: expected '${expectedKind}', got '${body.kind}'` };
    }
    if (!body.id) {
      return { success: false, data: null, error: 'MISSING_EVENT_ID: response has no event id' };
    }
    return { success: true, data: body, error: null };
  }

  parseError(response: ProviderResponse): string {
    if (response.statusCode === 400) return 'BAD_REQUEST: Invalid request parameters or body';
    if (response.statusCode === 401) return 'UNAUTHORIZED: Authentication failed or token expired';
    if (response.statusCode === 403) return 'FORBIDDEN: Insufficient permissions to modify calendar';
    if (response.statusCode === 404) return 'NOT_FOUND: Event not found';
    if (response.statusCode === 409) return 'CONFLICT: Idempotency key conflict or concurrent modification';
    if (response.statusCode === 412) return 'PRECONDITION_FAILED: Etag mismatch or precondition not met';
    if (response.statusCode === 429) return 'RATE_LIMITED: API rate limit exceeded';
    if (response.statusCode >= 500) return `SERVER_ERROR: Calendar API returned ${response.statusCode}`;
    return `ERROR_${response.statusCode}: Calendar mutation request failed`;
  }
}
