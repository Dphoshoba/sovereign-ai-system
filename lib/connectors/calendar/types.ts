/**
 * Calendar Connector - Types (Stage 1 Read-Only)
 */

export type CalendarAccessRole = 'owner' | 'writer' | 'reader' | 'freeBusyReader' | 'none';

export interface CalendarIdentity {
  id: string;
  summary: string;
  description?: string;
  timezone: string;
  primary: boolean;
  accessRole: CalendarAccessRole;
}

export interface CalendarEventAttendee {
  email: string;
  displayName?: string;
  responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  organizer?: boolean;
  self?: boolean;
}

export interface CalendarEventRecord {
  id: string;
  calendarId: string;
  summary: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
  timezone: string;
  allDay: boolean;
  recurringEventId?: string;
  attendees: CalendarEventAttendee[];
  status: 'confirmed' | 'tentative' | 'cancelled';
  updated: string;
}

export interface CalendarListResult {
  calendars: CalendarIdentity[];
}

export interface CalendarEventListResult {
  events: CalendarEventRecord[];
  nextPageToken?: string;
}

export interface CalendarFreeBusySlot {
  start: string;
  end: string;
}

export interface CalendarFreeBusyResult {
  calendarId: string;
  busy: CalendarFreeBusySlot[];
}

export interface AvailabilityWindow {
  start: string;
  end: string;
  timezone: string;
  hasConflict: boolean;
  conflictingEventIds: string[];
}

export interface CalendarAvailabilityResult {
  calendarId: string;
  requestedStart: string;
  requestedEnd: string;
  timezone: string;
  windows: AvailabilityWindow[];
  available: boolean;
}

export interface CalendarPermissionInspection {
  calendarId: string;
  accessRole: CalendarAccessRole;
  canReadMetadata: boolean;
  canReadEvents: boolean;
  canReadFreeBusy: boolean;
}

export interface CalendarHealthStatus {
  status: 'healthy' | 'warning' | 'blocked';
  quotaUsedPercent: number;
  tokenMinutesUntilExpiry: number;
  scopeHealthy: boolean;
  warnings: string[];
}

export interface CalendarAuditReceipt {
  connectorId: 'calendar';
  action: string;
  success: boolean;
  timestamp: string;
  details: Record<string, unknown>;
}
