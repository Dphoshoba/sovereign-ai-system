/**
 * Calendar Free/Busy Reader
 */

import type { CalendarReadClient } from './api-client';
import type { CalendarFreeBusyResult } from './types';
import { normalizeTimeRange } from './timezone-normalizer';

export class CalendarFreeBusyReader {
  constructor(private readonly client: CalendarReadClient) {}

  async lookup(params: {
    calendarId: string;
    timeMin: string;
    timeMax: string;
    timeZone?: string;
  }): Promise<CalendarFreeBusyResult> {
    const range = normalizeTimeRange({
      start: params.timeMin,
      end: params.timeMax,
      timezone: params.timeZone,
    });

    const result = await this.client.getFreeBusy({
      calendarId: params.calendarId,
      timeMin: range.start,
      timeMax: range.end,
      timeZone: range.timezone,
    });

    return {
      calendarId: result.calendarId,
      busy: [...result.busy].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
    };
  }
}
