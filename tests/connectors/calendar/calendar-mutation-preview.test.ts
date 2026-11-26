import { describe, it, expect } from 'vitest';

import { validateAttendees } from '../../../lib/connectors/calendar/attendee-validator';
import { validateRecurrence } from '../../../lib/connectors/calendar/recurrence-validator';
import { detectConflicts } from '../../../lib/connectors/calendar/conflict-preview';
import { buildChangeImpact } from '../../../lib/connectors/calendar/change-impact';
import { buildCreateEventPreview } from '../../../lib/connectors/calendar/create-event-preview';
import { buildUpdateEventPreview } from '../../../lib/connectors/calendar/update-event-preview';
import { buildDeleteEventPreview } from '../../../lib/connectors/calendar/delete-event-preview';
import type { CalendarEventRecord, CalendarIdentity } from '../../../lib/connectors/calendar/types';

const calendars: CalendarIdentity[] = [
  {
    id: 'primary',
    summary: 'Primary',
    timezone: 'UTC',
    primary: true,
    accessRole: 'owner',
  },
];

const existingEvent: CalendarEventRecord = {
  id: 'evt-1',
  calendarId: 'primary',
  summary: 'Existing',
  start: '2025-01-10T10:00:00.000Z',
  end: '2025-01-10T11:00:00.000Z',
  timezone: 'UTC',
  allDay: false,
  attendees: [{ email: 'a@example.com' }],
  status: 'confirmed',
  updated: '2025-01-01T00:00:00.000Z',
};

describe('calendar mutation preview - attendee validation', () => {
  it('accepts valid attendees', () => {
    const r = validateAttendees({ attendees: [{ email: 'ok@example.com' }] });
    expect(r.errors.length).toBe(0);
  });

  it('rejects malformed email', () => {
    const r = validateAttendees({ attendees: [{ email: 'bad-email' }] });
    expect(r.errors.some((e) => e.code === 'invalid_attendee_email')).toBe(true);
  });

  it('rejects duplicate attendees', () => {
    const r = validateAttendees({ attendees: [{ email: 'x@example.com' }, { email: 'x@example.com' }] });
    expect(r.errors.some((e) => e.code === 'duplicate_attendee')).toBe(true);
  });

  it('warns organizer duplicate', () => {
    const r = validateAttendees({ attendees: [{ email: 'org@example.com' }], organizerEmail: 'org@example.com' });
    expect(r.warnings.some((w) => w.code === 'organizer_duplicate')).toBe(true);
  });

  it('warns self invite', () => {
    const r = validateAttendees({ attendees: [{ email: 'me@example.com' }], selfEmail: 'me@example.com' });
    expect(r.warnings.some((w) => w.code === 'self_invite')).toBe(true);
  });
});

describe('calendar mutation preview - recurrence validation', () => {
  it('accepts valid rrule', () => {
    const r = validateRecurrence({ recurrence: ['RRULE:FREQ=WEEKLY;COUNT=10'] });
    expect(r.errors.length).toBe(0);
  });

  it('rejects malformed rule', () => {
    const r = validateRecurrence({ recurrence: ['RRULE:FREQ'] });
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it('rejects unsupported frequency', () => {
    const r = validateRecurrence({ recurrence: ['RRULE:FREQ=HOURLY;COUNT=10'] });
    expect(r.errors.some((e) => e.code === 'unsupported_frequency')).toBe(true);
  });

  it('warns missing end condition', () => {
    const r = validateRecurrence({ recurrence: ['RRULE:FREQ=DAILY'] });
    expect(r.warnings.some((w) => w.code === 'missing_end_condition')).toBe(true);
  });

  it('warns excessive recurrence', () => {
    const r = validateRecurrence({ recurrence: ['RRULE:FREQ=DAILY;COUNT=1000'] });
    expect(r.warnings.some((w) => w.code === 'excessive_recurrence')).toBe(true);
  });
});

describe('calendar mutation preview - conflict and impact', () => {
  it('detects overlap conflict', () => {
    const conflicts = detectConflicts({
      start: '2025-01-10T10:30:00.000Z',
      end: '2025-01-10T10:45:00.000Z',
      existingEvents: [existingEvent],
    });
    expect(conflicts.length).toBeGreaterThan(0);
  });

  it('detects attendee conflict', () => {
    const conflicts = detectConflicts({
      start: '2025-01-10T10:30:00.000Z',
      end: '2025-01-10T10:45:00.000Z',
      attendees: [{ email: 'a@example.com' }],
      existingEvents: [existingEvent],
    });
    expect(conflicts.some((c) => c.type === 'attendee_conflict')).toBe(true);
  });

  it('builds create impact', () => {
    const impact = buildChangeImpact(null, {
      calendarId: 'primary',
      summary: 'new',
      start: '2025-01-11T10:00:00.000Z',
      end: '2025-01-11T11:00:00.000Z',
      timezone: 'UTC',
      allDay: false,
      attendees: [],
      status: 'confirmed',
      updated: '1970-01-01T00:00:00.000Z',
    });
    expect(impact.changedFields.length).toBeGreaterThan(0);
  });

  it('builds update impact', () => {
    const impact = buildChangeImpact(existingEvent, { summary: 'updated' });
    expect(impact.changedFields.includes('summary')).toBe(true);
  });

  it('builds delete impact', () => {
    const impact = buildChangeImpact(existingEvent, null);
    expect(impact.impactNotes[0]).toContain('Delete/cancel');
  });
});

describe('calendar mutation preview - create/update/delete previews', () => {
  const context = {
    calendars,
    requiredScopes: ['https://www.googleapis.com/auth/calendar.events'],
    grantedScopes: ['https://www.googleapis.com/auth/calendar.events'],
    operatorEmail: 'me@example.com',
  };

  it('create preview returns previewOnly true', () => {
    const p = buildCreateEventPreview({
      input: {
        calendarId: 'primary',
        summary: 'New event',
        start: '2025-01-12T10:00:00.000Z',
        end: '2025-01-12T11:00:00.000Z',
        attendees: [{ email: 'u@example.com' }],
      },
      context,
      existingEvents: [existingEvent],
      deterministicSeed: 'seed-1',
    });
    expect(p.previewOnly).toBe(true);
    expect(p.executionAllowed).toBe(false);
    expect(p.estimatedApiOperation).toBe('events.insert');
  });

  it('create preview deterministic id', () => {
    const a = buildCreateEventPreview({
      input: {
        calendarId: 'primary',
        summary: 'A',
        start: '2025-01-12T12:00:00.000Z',
        end: '2025-01-12T13:00:00.000Z',
      },
      context,
      existingEvents: [],
      deterministicSeed: 'same-seed',
    });
    const b = buildCreateEventPreview({
      input: {
        calendarId: 'primary',
        summary: 'A',
        start: '2025-01-12T12:00:00.000Z',
        end: '2025-01-12T13:00:00.000Z',
      },
      context,
      existingEvents: [],
      deterministicSeed: 'same-seed',
    });
    expect(a.previewId).toBe(b.previewId);
  });

  it('update preview includes before/after', () => {
    const p = buildUpdateEventPreview({
      input: {
        calendarId: 'primary',
        eventId: 'evt-1',
        patch: { summary: 'Moved', start: '2025-01-10T12:00:00.000Z', end: '2025-01-10T13:00:00.000Z' },
      },
      context,
      beforeState: existingEvent,
      existingEvents: [existingEvent],
      deterministicSeed: 'seed-upd',
    });
    expect(p.beforeState?.id).toBe('evt-1');
    expect(p.proposedState?.summary).toBe('Moved');
    expect(p.estimatedApiOperation).toBe('events.patch');
  });

  it('delete preview supports series scope', () => {
    const p = buildDeleteEventPreview({
      input: {
        calendarId: 'primary',
        eventId: 'evt-1',
        recurringScope: 'series',
      },
      context,
      beforeState: existingEvent,
      affectedEventCount: 8,
      deterministicSeed: 'seed-del',
    });
    expect(p.recurringScope).toBe('series');
    expect(p.estimatedApiOperation).toBe('events.delete');
    expect(p.requiredApproval).toBe(true);
  });
});

describe('calendar mutation preview - edge and boundary', () => {
  const badContext = {
    calendars,
    requiredScopes: ['https://www.googleapis.com/auth/calendar.events'],
    grantedScopes: [],
    operatorEmail: 'me@example.com',
  };

  it('flags missing scope', () => {
    const p = buildCreateEventPreview({
      input: {
        calendarId: 'primary',
        summary: 'x',
        start: '2025-01-12T10:00:00.000Z',
        end: '2025-01-12T11:00:00.000Z',
      },
      context: badContext,
      existingEvents: [],
      deterministicSeed: 'seed',
    });
    expect(p.validationErrors.some((e) => e.code === 'missing_scope')).toBe(true);
  });

  it('invalid time range', () => {
    const p = buildCreateEventPreview({
      input: {
        calendarId: 'primary',
        summary: 'x',
        start: '2025-01-12T12:00:00.000Z',
        end: '2025-01-12T11:00:00.000Z',
      },
      context: badContext,
      existingEvents: [],
      deterministicSeed: 'seed',
    });
    expect(p.validationErrors.some((e) => e.code === 'invalid_time_range')).toBe(true);
  });

  it('all-day event supported', () => {
    const p = buildCreateEventPreview({
      input: {
        calendarId: 'primary',
        summary: 'all day',
        start: '2025-01-12T00:00:00.000Z',
        end: '2025-01-13T00:00:00.000Z',
        allDay: true,
      },
      context: {
        calendars,
        requiredScopes: ['https://www.googleapis.com/auth/calendar.events'],
        grantedScopes: ['https://www.googleapis.com/auth/calendar.events'],
      },
      existingEvents: [],
      deterministicSeed: 'seed-all',
    });
    expect(p.proposedState?.allDay).toBe(true);
  });

  it('no input mutation guarantee', () => {
    const input = {
      calendarId: 'primary',
      summary: 'keep',
      start: '2025-01-12T10:00:00.000Z',
      end: '2025-01-12T11:00:00.000Z',
      attendees: [{ email: 'a@example.com' }],
    };
    const snapshot = JSON.stringify(input);
    buildCreateEventPreview({
      input,
      context: {
        calendars,
        requiredScopes: ['https://www.googleapis.com/auth/calendar.events'],
        grantedScopes: ['https://www.googleapis.com/auth/calendar.events'],
      },
      existingEvents: [],
      deterministicSeed: 'seed-nomutate',
    });
    expect(JSON.stringify(input)).toBe(snapshot);
  });

  it('no queue/approval execution', () => {
    const p = buildDeleteEventPreview({
      input: { calendarId: 'primary', eventId: 'evt-1' },
      context: {
        calendars,
        requiredScopes: ['https://www.googleapis.com/auth/calendar.events'],
        grantedScopes: ['https://www.googleapis.com/auth/calendar.events'],
      },
      beforeState: existingEvent,
      affectedEventCount: 1,
      deterministicSeed: 'seed-q',
    });
    expect(p.previewOnly).toBe(true);
    expect(p.executionAllowed).toBe(false);
  });
});
