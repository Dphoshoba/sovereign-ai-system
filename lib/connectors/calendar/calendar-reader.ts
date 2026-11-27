/**
 * Calendar Reader (discovery + metadata mapping)
 */

import type { CalendarIdentity } from './types';
import type { CalendarReadClient } from './api-client';

export class CalendarReader {
  constructor(private readonly client: CalendarReadClient) {}

  async listCalendars(): Promise<CalendarIdentity[]> {
    const calendars = await this.client.listCalendars();

    const normalized = calendars.map((c) => ({
      ...c,
      id: String(c.id || ''),
      summary: String(c.summary || ''),
      timezone: String(c.timezone || 'UTC'),
      primary: !!c.primary,
    }));

    return normalized.sort((a, b) => {
      if (a.primary !== b.primary) return a.primary ? -1 : 1;
      return a.summary.localeCompare(b.summary);
    });
  }

  getPrimaryCalendar(calendars: CalendarIdentity[]): CalendarIdentity | null {
    return calendars.find((c) => c.primary) || null;
  }
}
