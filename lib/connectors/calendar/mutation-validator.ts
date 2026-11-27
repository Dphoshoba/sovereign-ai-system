import { normalizeTimeRange } from './timezone-normalizer';
import { inspectCalendarPermissions } from './permission-inspector';
import { validateAttendees } from './attendee-validator';
import { validateRecurrence } from './recurrence-validator';
import type {
  CalendarMutationValidationIssue,
  CreateEventPreviewInput,
  UpdateEventPreviewInput,
  DeleteEventPreviewInput,
  RecurrenceScope,
} from './mutation-types';
import type { CalendarIdentity } from './types';

export interface MutationValidationContext {
  calendars: CalendarIdentity[];
  requiredScopes: string[];
  grantedScopes: string[];
  operatorEmail?: string;
}

export interface MutationValidationResult {
  normalizedTimezone: string;
  errors: CalendarMutationValidationIssue[];
  warnings: CalendarMutationValidationIssue[];
  recurringScope: RecurrenceScope;
}

const MUTATION_SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

function hasScope(required: string[], granted: string[]): boolean {
  return required.every((s) => granted.includes(s));
}

export function validateCreatePreviewInput(
  input: CreateEventPreviewInput,
  ctx: MutationValidationContext
): MutationValidationResult {
  const errors: CalendarMutationValidationIssue[] = [];
  const warnings: CalendarMutationValidationIssue[] = [];

  const calendar = ctx.calendars.find((c) => c.id === input.calendarId);
  if (!calendar) {
    errors.push({ code: 'calendar_not_found', message: 'Calendar does not exist', field: 'calendarId' });
  } else {
    const permission = inspectCalendarPermissions({
      calendarId: calendar.id,
      accessRole: calendar.accessRole,
    });
    if (!permission.canReadMetadata) {
      errors.push({ code: 'insufficient_permission', message: 'Cannot access calendar metadata', field: 'calendarId' });
    }
  }

  if (!input.summary?.trim()) {
    errors.push({ code: 'missing_title', message: 'Event title is required', field: 'summary' });
  }

  const startMs = Date.parse(input.start);
  const endMs = Date.parse(input.end);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    errors.push({ code: 'invalid_time_range', message: 'Invalid start/end time range', field: 'start/end' });
  }

  let normalizedTimezone = input.timezone || calendar?.timezone || 'UTC';
  try {
    normalizedTimezone = normalizeTimeRange({
      start: input.start,
      end: input.end,
      timezone: normalizedTimezone,
    }).timezone;
  } catch {
    // Keep deterministic validation flow and surface as validation error instead of throw.
  }

  const attendeeResult = validateAttendees({
    attendees: input.attendees || [],
    organizerEmail: ctx.operatorEmail,
    selfEmail: ctx.operatorEmail,
  });
  errors.push(...attendeeResult.errors);
  warnings.push(...attendeeResult.warnings);

  const recurrenceResult = validateRecurrence({
    recurrence: input.recurrence,
    scope: 'single',
  });
  errors.push(...recurrenceResult.errors);
  warnings.push(...recurrenceResult.warnings);

  if (!hasScope(MUTATION_SCOPES, ctx.grantedScopes)) {
    errors.push({ code: 'missing_scope', message: 'Missing mutation scopes for preview intent', field: 'scopes' });
  }

  return {
    normalizedTimezone,
    errors,
    warnings,
    recurringScope: 'single',
  };
}

export function validateUpdatePreviewInput(
  input: UpdateEventPreviewInput,
  ctx: MutationValidationContext
): MutationValidationResult {
  const base = validateCreatePreviewInput(
    {
      calendarId: input.calendarId,
      summary: input.patch.summary || 'update-preview',
      start: input.patch.start || '1970-01-01T00:00:00Z',
      end: input.patch.end || '1970-01-01T01:00:00Z',
      timezone: input.patch.timezone,
      attendees: input.patch.attendees,
      recurrence: [],
    },
    ctx
  );

  if (!input.eventId?.trim()) {
    base.errors.push({ code: 'missing_event_id', message: 'Event ID is required for update preview', field: 'eventId' });
  }

  base.recurringScope = input.recurringScope || 'single';
  return base;
}

export function validateDeletePreviewInput(
  input: DeleteEventPreviewInput,
  ctx: MutationValidationContext
): MutationValidationResult {
  const errors: CalendarMutationValidationIssue[] = [];
  const warnings: CalendarMutationValidationIssue[] = [];
  const calendar = ctx.calendars.find((c) => c.id === input.calendarId);

  if (!calendar) {
    errors.push({ code: 'calendar_not_found', message: 'Calendar does not exist', field: 'calendarId' });
  }

  if (!input.eventId?.trim()) {
    errors.push({ code: 'missing_event_id', message: 'Event ID is required', field: 'eventId' });
  }

  if (!hasScope(MUTATION_SCOPES, ctx.grantedScopes)) {
    errors.push({ code: 'missing_scope', message: 'Missing mutation scopes for preview intent', field: 'scopes' });
  }

  if ((input.recurringScope || 'single') !== 'single') {
    warnings.push({
      code: 'high_impact_delete',
      message: 'Recurring scope delete may affect multiple instances',
      field: 'recurringScope',
    });
  }

  return {
    normalizedTimezone: calendar?.timezone || 'UTC',
    errors,
    warnings,
    recurringScope: input.recurringScope || 'single',
  };
}
