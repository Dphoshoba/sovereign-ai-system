import type { CalendarEventRecord } from './types';
import type { CalendarMutationConflict } from './mutation-types';

export interface ConflictPreviewInput {
  start: string;
  end: string;
  attendees?: { email: string }[];
  existingEvents: CalendarEventRecord[];
}

export function detectConflicts(input: ConflictPreviewInput): CalendarMutationConflict[] {
  const conflicts: CalendarMutationConflict[] = [];
  const startMs = Date.parse(input.start);
  const endMs = Date.parse(input.end);

  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return [
      {
        type: 'time_overlap',
        message: 'Invalid time range for conflict analysis',
      },
    ];
  }

  for (const event of input.existingEvents) {
    const evStart = Date.parse(event.start);
    const evEnd = Date.parse(event.end);
    const overlap = startMs < evEnd && endMs > evStart;
    if (overlap) {
      conflicts.push({
        type: 'time_overlap',
        message: `Overlaps with event "${event.summary}"`,
        eventId: event.id,
        start: event.start,
        end: event.end,
      });
    }

    if (input.attendees?.length) {
      const proposed = new Set(input.attendees.map((a) => a.email.toLowerCase()));
      const common = event.attendees.filter((a) => proposed.has(a.email.toLowerCase()));
      if (common.length > 0 && overlap) {
        conflicts.push({
          type: 'attendee_conflict',
          message: `Attendee conflict with ${common.length} attendee(s) on "${event.summary}"`,
          eventId: event.id,
          start: event.start,
          end: event.end,
        });
      }
    }
  }

  return conflicts;
}
