import type { CalendarEventAttendee } from './types';
import type { CalendarMutationValidationIssue } from './mutation-types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface AttendeeValidationInput {
  attendees: CalendarEventAttendee[];
  organizerEmail?: string;
  selfEmail?: string;
  maxAttendees?: number;
}

export interface AttendeeValidationResult {
  errors: CalendarMutationValidationIssue[];
  warnings: CalendarMutationValidationIssue[];
  normalizedAttendees: CalendarEventAttendee[];
}

export function validateAttendees(input: AttendeeValidationInput): AttendeeValidationResult {
  const errors: CalendarMutationValidationIssue[] = [];
  const warnings: CalendarMutationValidationIssue[] = [];
  const maxAttendees = input.maxAttendees ?? 200;
  const seen = new Set<string>();

  const normalizedAttendees = input.attendees.map((a, idx) => {
    const email = (a.email || '').trim().toLowerCase();
    const normalized: CalendarEventAttendee = { ...a, email };

    if (!email || !EMAIL_REGEX.test(email)) {
      errors.push({
        code: 'invalid_attendee_email',
        message: `Attendee at index ${idx} has invalid email`,
        field: `attendees[${idx}].email`,
      });
    }

    if (seen.has(email)) {
      errors.push({
        code: 'duplicate_attendee',
        message: `Duplicate attendee email: ${email}`,
        field: `attendees[${idx}].email`,
      });
    } else if (email) {
      seen.add(email);
    }

    if (input.organizerEmail && email === input.organizerEmail.toLowerCase()) {
      warnings.push({
        code: 'organizer_duplicate',
        message: `Organizer is also included as attendee: ${email}`,
        field: `attendees[${idx}]`,
      });
    }

    if (input.selfEmail && email === input.selfEmail.toLowerCase()) {
      warnings.push({
        code: 'self_invite',
        message: `Self attendee detected: ${email}`,
        field: `attendees[${idx}]`,
      });
    }

    if (a.responseStatus === 'needsAction') {
      warnings.push({
        code: 'notification_required',
        message: `Attendee ${email} requires notification/response`,
        field: `attendees[${idx}].responseStatus`,
      });
    }

    const domain = email.split('@')[1] || '';
    if (domain && !domain.endsWith('example.com')) {
      warnings.push({
        code: 'external_attendee',
        message: `External attendee detected: ${email}`,
        field: `attendees[${idx}]`,
      });
    }

    return normalized;
  });

  if (normalizedAttendees.length > maxAttendees) {
    errors.push({
      code: 'attendee_limit_exceeded',
      message: `Attendee limit exceeded: ${normalizedAttendees.length}/${maxAttendees}`,
      field: 'attendees',
    });
  }

  return {
    errors,
    warnings,
    normalizedAttendees,
  };
}
