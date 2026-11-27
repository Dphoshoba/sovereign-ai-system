/**
 * Calendar Availability Engine (read-only conflict detection)
 */

import type { CalendarAvailabilityResult, CalendarFreeBusyResult, AvailabilityWindow } from './types';
import { normalizeTimeRange } from './timezone-normalizer';

export function computeAvailability(params: {
  calendarId: string;
  requestedStart: string;
  requestedEnd: string;
  timezone?: string;
  freeBusy: CalendarFreeBusyResult;
}): CalendarAvailabilityResult {
  const range = normalizeTimeRange({
    start: params.requestedStart,
    end: params.requestedEnd,
    timezone: params.timezone,
  });

  const reqStart = new Date(range.start).getTime();
  const reqEnd = new Date(range.end).getTime();

  const overlapping = params.freeBusy.busy
    .filter((slot) => {
      const s = new Date(slot.start).getTime();
      const e = new Date(slot.end).getTime();
      return s < reqEnd && e > reqStart;
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  const windows: AvailabilityWindow[] = [];

  if (overlapping.length === 0) {
    windows.push({
      start: range.start,
      end: range.end,
      timezone: range.timezone,
      hasConflict: false,
      conflictingEventIds: [],
    });
  } else {
    let cursor = reqStart;
    overlapping.forEach((slot, index) => {
      const s = new Date(slot.start).getTime();
      const e = new Date(slot.end).getTime();

      if (cursor < s) {
        windows.push({
          start: new Date(cursor).toISOString(),
          end: new Date(Math.min(s, reqEnd)).toISOString(),
          timezone: range.timezone,
          hasConflict: false,
          conflictingEventIds: [],
        });
      }

      windows.push({
        start: new Date(Math.max(s, reqStart)).toISOString(),
        end: new Date(Math.min(e, reqEnd)).toISOString(),
        timezone: range.timezone,
        hasConflict: true,
        conflictingEventIds: [`conflict_${index + 1}`],
      });

      cursor = Math.max(cursor, e);
    });

    if (cursor < reqEnd) {
      windows.push({
        start: new Date(cursor).toISOString(),
        end: new Date(reqEnd).toISOString(),
        timezone: range.timezone,
        hasConflict: false,
        conflictingEventIds: [],
      });
    }
  }

  const available = windows.some((w) => !w.hasConflict);

  return {
    calendarId: params.calendarId,
    requestedStart: range.start,
    requestedEnd: range.end,
    timezone: range.timezone,
    windows,
    available,
  };
}
