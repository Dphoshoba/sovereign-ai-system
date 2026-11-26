/**
 * Calendar Connector - Barrel Export (Stage 1 Read-Only)
 */

export { calendarManifest, validateCalendarManifest } from './manifest';
export { CalendarAuthenticator } from './authenticator';
export { GoogleCalendarApiClient } from './api-client';

export { CalendarReader } from './calendar-reader';
export { CalendarEventReader } from './event-reader';
export { CalendarEventSearch } from './event-search';
export { CalendarFreeBusyReader } from './free-busy';

export { computeAvailability } from './availability-engine';

export { inspectCalendarPermissions, assertCanReadEvents } from './permission-inspector';
export { validateCalendarReadScopes } from './scope-validator';
export { evaluateCalendarQuota } from './quota-adapter';
export { evaluateCalendarHealth } from './health-adapter';
export { buildCalendarReadAuditReceipt } from './read-audit';
export { classifyCalendarReadError } from './retry-classifier';

export type {
  CalendarAccessRole,
  CalendarIdentity,
  CalendarEventAttendee,
  CalendarEventRecord,
  CalendarListResult,
  CalendarEventListResult,
  CalendarFreeBusyResult,
  AvailabilityWindow,
  CalendarAvailabilityResult,
  CalendarPermissionInspection,
  CalendarHealthStatus,
  CalendarAuditReceipt,
} from './types';
