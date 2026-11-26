/**
 * Calendar Event Search
 */

import type { CalendarReadClient } from './api-client';
import type { CalendarEventRecord } from './types';

export interface EventSearchParams {
  calendarId: string;
  query: string;
  maxResults?: number;
  timeMin?: string;
  timeMax?: string;
}

export class CalendarEventSearch {
  constructor(private readonly client: CalendarReadClient) {}

  async search(params: EventSearchParams): Promise<CalendarEventRecord[]> {
    const events = await this.client.searchEvents(params);
    return events
      .map((event) => ({
        ...event,
        summary: String(event.summary || '(no title)'),
      }))
      .sort((a, b) => {
        const ts = new Date(a.start).getTime() - new Date(b.start).getTime();
        if (ts !== 0) return ts;
        return a.id.localeCompare(b.id);
      });
  }
}
