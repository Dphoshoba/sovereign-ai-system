/**
 * Calendar Event Reader (list/detail/filter/pagination/recurring awareness)
 */

import type { CalendarReadClient } from './api-client';
import type { CalendarEventListResult, CalendarEventRecord } from './types';

export interface EventListParams {
  calendarId: string;
  maxResults?: number;
  pageToken?: string;
  timeMin?: string;
  timeMax?: string;
}

export class CalendarEventReader {
  constructor(private readonly client: CalendarReadClient) {}

  async listEvents(params: EventListParams): Promise<CalendarEventListResult> {
    const result = await this.client.listEvents(params);
    return {
      events: normalizeEvents(result.events),
      nextPageToken: result.nextPageToken,
    };
  }

  async getEvent(calendarId: string, eventId: string): Promise<CalendarEventRecord | null> {
    const event = await this.client.getEvent({ calendarId, eventId });
    if (!event) return null;
    return normalizeEvent(event);
  }

  filterByTimeRange(events: CalendarEventRecord[], timeMin?: string, timeMax?: string): CalendarEventRecord[] {
    const min = timeMin ? new Date(timeMin).getTime() : Number.MIN_SAFE_INTEGER;
    const max = timeMax ? new Date(timeMax).getTime() : Number.MAX_SAFE_INTEGER;

    return events.filter((event) => {
      const start = new Date(event.start).getTime();
      const end = new Date(event.end).getTime();
      return start <= max && end >= min;
    });
  }

  hasRecurringSource(event: CalendarEventRecord): boolean {
    return !!event.recurringEventId;
  }
}

function normalizeEvents(events: CalendarEventRecord[]): CalendarEventRecord[] {
  return events.map(normalizeEvent).sort((a, b) => {
    const delta = new Date(a.start).getTime() - new Date(b.start).getTime();
    if (delta !== 0) return delta;
    return a.id.localeCompare(b.id);
  });
}

function normalizeEvent(event: CalendarEventRecord): CalendarEventRecord {
  return {
    ...event,
    id: String(event.id || ''),
    summary: String(event.summary || '(no title)'),
    timezone: String(event.timezone || 'UTC'),
    attendees: Array.isArray(event.attendees) ? event.attendees : [],
    status: event.status || 'confirmed',
  };
}
