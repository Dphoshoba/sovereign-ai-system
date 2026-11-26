import type { CalendarEventRecord } from './types';
import type { CalendarMutationChangeSummary } from './mutation-types';

export function buildChangeImpact(
  beforeState: CalendarEventRecord | null,
  proposedState: Partial<CalendarEventRecord> | null
): CalendarMutationChangeSummary {
  if (!beforeState && proposedState) {
    return {
      changedFields: Object.keys(proposedState),
      attendeeAdded: (proposedState.attendees || []).map((a) => a.email),
      attendeeRemoved: [],
      timeMoved: true,
      timezoneChanged: true,
      recurrenceChanged: !!proposedState.recurringEventId,
      impactNotes: ['New event creation preview'],
    };
  }

  if (beforeState && !proposedState) {
    return {
      changedFields: ['status'],
      attendeeAdded: [],
      attendeeRemoved: beforeState.attendees.map((a) => a.email),
      timeMoved: false,
      timezoneChanged: false,
      recurrenceChanged: !!beforeState.recurringEventId,
      impactNotes: ['Delete/cancel event preview'],
    };
  }

  if (!beforeState || !proposedState) {
    return {
      changedFields: [],
      attendeeAdded: [],
      attendeeRemoved: [],
      timeMoved: false,
      timezoneChanged: false,
      recurrenceChanged: false,
      impactNotes: ['No effective change'],
    };
  }

  const changedFields: string[] = [];
  for (const k of Object.keys(proposedState) as (keyof CalendarEventRecord)[]) {
    const beforeValue = beforeState[k];
    const afterValue = proposedState[k];
    if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
      changedFields.push(k as string);
    }
  }

  const beforeAttendees = new Set(beforeState.attendees.map((a) => a.email.toLowerCase()));
  const afterAttendees = new Set(
    (proposedState.attendees || beforeState.attendees).map((a) => a.email.toLowerCase())
  );
  const attendeeAdded = [...afterAttendees].filter((e) => !beforeAttendees.has(e));
  const attendeeRemoved = [...beforeAttendees].filter((e) => !afterAttendees.has(e));

  const timeMoved =
    (proposedState.start && proposedState.start !== beforeState.start) ||
    (proposedState.end && proposedState.end !== beforeState.end) ||
    false;

  const timezoneChanged = !!(
    proposedState.timezone && proposedState.timezone !== beforeState.timezone
  );
  const recurrenceChanged = !!(
    proposedState.recurringEventId &&
    proposedState.recurringEventId !== beforeState.recurringEventId
  );

  const impactNotes: string[] = [];
  if (timeMoved) impactNotes.push('Event time changed');
  if (timezoneChanged) impactNotes.push('Timezone changed');
  if (attendeeAdded.length || attendeeRemoved.length) impactNotes.push('Attendee list changed');
  if (recurrenceChanged) impactNotes.push('Recurrence scope changed');

  return {
    changedFields,
    attendeeAdded,
    attendeeRemoved,
    timeMoved,
    timezoneChanged,
    recurrenceChanged,
    impactNotes,
  };
}
