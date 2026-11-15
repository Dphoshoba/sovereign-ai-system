/**
 * Calendar API Client (Stage 1 Read-Only, deterministic-friendly)
 */

import type { CalendarEventListResult, CalendarEventRecord, CalendarFreeBusyResult, CalendarIdentity } from './types';

export interface CalendarReadClient {
  listCalendars(): Promise<CalendarIdentity[]>;
  listEvents(params: {
    calendarId: string;
    maxResults?: number;
    pageToken?: string;
    timeMin?: string;
    timeMax?: string;
  }): Promise<CalendarEventListResult>;
  getEvent(params: { calendarId: string; eventId: string }): Promise<CalendarEventRecord | null>;
  searchEvents(params: {
    calendarId: string;
    query: string;
    maxResults?: number;
    timeMin?: string;
    timeMax?: string;
  }): Promise<CalendarEventRecord[]>;
  getFreeBusy(params: {
    calendarId: string;
    timeMin: string;
    timeMax: string;
    timeZone?: string;
  }): Promise<CalendarFreeBusyResult>;
}

export class CalendarApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'CalendarApiError';
    this.status = status;
  }
}

export class GoogleCalendarApiClient implements CalendarReadClient {
  static serviceName = 'google-calendar';
  static baseUrl = 'https://www.googleapis.com/calendar/v3';
  static rateLimitTiers = [{ name: 'default', rpm: 600 }];
  static quotaDefinitions = [{ name: 'requests_per_day', limit: 1000000 }];
  constructor(private readonly accessToken: string) {}

  /**
   * Platform ApiClient read surface. Read-only; routes to Calendar GET endpoints.
   * Supported resources: `calendars`, `events`, `event`.
   */
  async read(resource: string, params?: Record<string, string>): Promise<unknown> {
    if (!this.accessToken.trim()) {
      throw new Error('CalendarClient.read requires a non-empty access token');
    }

    const name = (resource || '').trim().toLowerCase();
    if (!name) {
      throw new Error('CalendarClient.read requires a resource name');
    }

    switch (name) {
      case 'calendars':
      case 'calendarlist':
        return this.listCalendars();
      case 'events': {
        const calendarId = params?.calendarId?.trim();
        if (!calendarId) {
          throw new Error('CalendarClient.read(events) requires calendarId');
        }
        return this.listEvents({
          calendarId,
          maxResults: params?.maxResults ? Number(params.maxResults) : undefined,
          pageToken: params?.pageToken,
          timeMin: params?.timeMin,
          timeMax: params?.timeMax,
        });
      }
      case 'event': {
        const calendarId = params?.calendarId?.trim();
        const eventId = params?.eventId?.trim() || params?.id?.trim();
        if (!calendarId || !eventId) {
          throw new Error('CalendarClient.read(event) requires calendarId and eventId');
        }
        try {
          const item = await this.get(
            `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
          );
          return mapEvent(calendarId, item);
        } catch (error) {
          if (error instanceof CalendarApiError && error.status === 404) {
            return null;
          }
          throw error;
        }
      }
      default:
        throw new Error(`CalendarClient.read unsupported resource: ${resource}`);
    }
  }

  private async get(path: string, query?: Record<string, string | undefined>): Promise<any> {
    const url = new URL(`https://www.googleapis.com/calendar/v3${path}`);
    Object.entries(query || {}).forEach(([k, v]) => {
      if (v !== undefined) url.searchParams.set(k, v);
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new CalendarApiError(
          `Calendar API permission denied: ${response.status}`,
          response.status,
        );
      }
      if (response.status === 404) {
        throw new CalendarApiError(`Calendar API resource not found: ${response.status}`, 404);
      }
      throw new CalendarApiError(`Calendar API read failed: ${response.status}`, response.status);
    }

    return response.json();
  }

  async listCalendars(): Promise<CalendarIdentity[]> {
    const data = await this.get('/users/me/calendarList');
    const items = Array.isArray(data.items) ? data.items : [];
    return items.map((item: any) => ({
      id: String(item.id || ''),
      summary: String(item.summary || ''),
      description: item.description ? String(item.description) : undefined,
      timezone: String(item.timeZone || 'UTC'),
      primary: !!item.primary,
      accessRole: (item.accessRole || 'none'),
    }));
  }

  async listEvents(params: {
    calendarId: string;
    maxResults?: number;
    pageToken?: string;
    timeMin?: string;
    timeMax?: string;
  }): Promise<CalendarEventListResult> {
    const data = await this.get(`/calendars/${encodeURIComponent(params.calendarId)}/events`, {
      singleEvents: 'true',
      maxResults: String(params.maxResults ?? 25),
      pageToken: params.pageToken,
      timeMin: params.timeMin,
      timeMax: params.timeMax,
      orderBy: 'startTime',
    });

    const items = Array.isArray(data.items) ? data.items : [];
    return {
      events: items.map((item: any) => mapEvent(params.calendarId, item)),
      nextPageToken: data.nextPageToken ? String(data.nextPageToken) : undefined,
    };
  }

  async getEvent(params: { calendarId: string; eventId: string }): Promise<CalendarEventRecord | null> {
    try {
      const item = await this.get(
        `/calendars/${encodeURIComponent(params.calendarId)}/events/${encodeURIComponent(params.eventId)}`
      );
      return mapEvent(params.calendarId, item);
    } catch (error) {
      if (error instanceof CalendarApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async searchEvents(params: {
    calendarId: string;
    query: string;
    maxResults?: number;
    timeMin?: string;
    timeMax?: string;
  }): Promise<CalendarEventRecord[]> {
    const data = await this.get(`/calendars/${encodeURIComponent(params.calendarId)}/events`, {
      singleEvents: 'true',
      q: params.query,
      maxResults: String(params.maxResults ?? 25),
      timeMin: params.timeMin,
      timeMax: params.timeMax,
      orderBy: 'startTime',
    });

    const items = Array.isArray(data.items) ? data.items : [];
    return items.map((item: any) => mapEvent(params.calendarId, item));
  }

  async getFreeBusy(params: {
    calendarId: string;
    timeMin: string;
    timeMax: string;
    timeZone?: string;
  }): Promise<CalendarFreeBusyResult> {
    const response = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timeMin: params.timeMin,
        timeMax: params.timeMax,
        timeZone: params.timeZone || 'UTC',
        items: [{ id: params.calendarId }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Calendar freeBusy failed: ${response.status}`);
    }

    const data = await response.json();
    const busy = data?.calendars?.[params.calendarId]?.busy ?? [];
    return {
      calendarId: params.calendarId,
      busy: Array.isArray(busy)
        ? busy.map((slot: any) => ({
            start: String(slot.start),
            end: String(slot.end),
          }))
        : [],
    };
  }
}

/**
 * Platform adapter metadata + ApiClient.read entrypoint.
 * Authenticated reads require GoogleCalendarApiClient(accessToken).
 * This object exposes async read() for contract detection and documents the surface.
 */
export const CalendarClient = {
  serviceName: GoogleCalendarApiClient.serviceName,
  baseUrl: GoogleCalendarApiClient.baseUrl,
  rateLimitTiers: GoogleCalendarApiClient.rateLimitTiers,
  quotaDefinitions: GoogleCalendarApiClient.quotaDefinitions,
  async read(resource: string, params?: Record<string, string>): Promise<unknown> {
    throw new Error(
      `CalendarClient.read(${resource}) requires GoogleCalendarApiClient(accessToken); params=${JSON.stringify(params ?? {})}`,
    );
  },
};

function mapEvent(calendarId: string, item: any): CalendarEventRecord {
  const startDateTime = item?.start?.dateTime;
  const endDateTime = item?.end?.dateTime;
  const allDayStart = item?.start?.date;
  const allDayEnd = item?.end?.date;

  const start = startDateTime || allDayStart || '';
  const end = endDateTime || allDayEnd || '';
  const timezone = item?.start?.timeZone || item?.end?.timeZone || 'UTC';
  const allDay = !!(allDayStart && !startDateTime);

  const attendees = Array.isArray(item?.attendees)
    ? item.attendees.map((a: any) => ({
        email: String(a.email || ''),
        displayName: a.displayName ? String(a.displayName) : undefined,
        responseStatus: a.responseStatus,
        organizer: !!a.organizer,
        self: !!a.self,
      }))
    : [];

  return {
    id: String(item?.id || ''),
    calendarId,
    summary: String(item?.summary || '(no title)'),
    description: item?.description ? String(item.description) : undefined,
    location: item?.location ? String(item.location) : undefined,
    start: String(start),
    end: String(end),
    timezone: String(timezone),
    allDay,
    recurringEventId: item?.recurringEventId ? String(item.recurringEventId) : undefined,
    attendees,
    status: item?.status || 'confirmed',
    updated: String(item?.updated || ''),
  };
}
