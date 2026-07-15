import type { CalendarEventAttendee, CalendarEventRecord } from './types';

export type MutationOperation = 'create' | 'update' | 'delete' | 'cancel';
export type RecurrenceScope = 'single' | 'instance' | 'this_and_following' | 'series';
export type MutationRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface CalendarMutationValidationIssue {
  code: string;
  message: string;
  field?: string;
}

export interface CalendarMutationConflict {
  type: 'time_overlap' | 'attendee_conflict' | 'resource_conflict';
  message: string;
  eventId?: string;
  start?: string;
  end?: string;
}

export interface CalendarMutationChangeSummary {
  changedFields: string[];
  attendeeAdded: string[];
  attendeeRemoved: string[];
  timeMoved: boolean;
  timezoneChanged: boolean;
  recurrenceChanged: boolean;
  impactNotes: string[];
}

export interface CalendarMutationAuditMetadata {
  connectorId: 'calendar';
  stage: 'stage2a-preview';
  generatedAt: string;
  deterministicSeed: string;
}

export interface CalendarMutationPreview {
  previewId: string;
  operation: MutationOperation;
  calendarId: string;
  eventId?: string;
  beforeState: CalendarEventRecord | null;
  proposedState: Partial<CalendarEventRecord> | null;
  normalizedTimezone: string;
  attendees: CalendarEventAttendee[];
  recurringScope: RecurrenceScope;
  detectedConflicts: CalendarMutationConflict[];
  validationErrors: CalendarMutationValidationIssue[];
  warnings: CalendarMutationValidationIssue[];
  riskScore: number;
  riskLevel: MutationRiskLevel;
  requiredApproval: boolean;
  requiredScopes: string[];
  estimatedApiOperation: 'events.insert' | 'events.update' | 'events.patch' | 'events.delete';
  changeSummary: CalendarMutationChangeSummary;
  auditMetadata: CalendarMutationAuditMetadata;
  previewOnly: true;
  executionAllowed: false;
}

export interface CreateEventPreviewInput {
  calendarId: string;
  summary: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
  timezone?: string;
  allDay?: boolean;
  attendees?: CalendarEventAttendee[];
  recurrence?: string[];
}

export interface UpdateEventPreviewInput {
  calendarId: string;
  eventId: string;
  patch: Partial<CalendarEventRecord>;
  recurringScope?: RecurrenceScope;
}

export interface DeleteEventPreviewInput {
  calendarId: string;
  eventId: string;
  recurringScope?: RecurrenceScope;
  cancelOnly?: boolean;
}
