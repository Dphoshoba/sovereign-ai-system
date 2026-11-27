/**
 * Calendar Permission Inspector (Stage 1 Read-Only)
 */

import type { CalendarAccessRole, CalendarPermissionInspection } from './types';

export function inspectCalendarPermissions(params: {
  calendarId: string;
  accessRole: CalendarAccessRole;
}): CalendarPermissionInspection {
  const role = params.accessRole;

  return {
    calendarId: params.calendarId,
    accessRole: role,
    canReadMetadata: role !== 'none',
    canReadEvents: role === 'owner' || role === 'writer' || role === 'reader',
    canReadFreeBusy: role !== 'none',
  };
}

export function assertCanReadEvents(inspection: CalendarPermissionInspection): void {
  if (!inspection.canReadEvents) {
    throw new Error(`Unauthorized read blocked for calendar ${inspection.calendarId}`);
  }
}
