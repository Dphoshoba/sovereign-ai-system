import { CalendarEvent } from './calendar-types';

export interface CalendarEventInsertRequest {
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  colorId?: string;
  status?: 'confirmed' | 'tentative' | 'cancelled';
  transparency?: 'opaque' | 'transparent';
  visibility?: 'default' | 'public' | 'private' | 'confidential';
  attendees?: Array<{
    email: string;
    displayName?: string;
    optional?: boolean;
    responseStatus?: 'needsAction' | 'accepted' | 'declined' | 'tentative';
  }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{ method: 'email' | 'popup'; minutes: number }>;
  };
}

export interface CalendarEventUpdateRequest {
  summary?: string;
  description?: string;
  location?: string;
  start?: {
    dateTime: string;
    timeZone?: string;
  };
  end?: {
    dateTime: string;
    timeZone?: string;
  };
  colorId?: string;
  status?: 'confirmed' | 'tentative' | 'cancelled';
  transparency?: 'opaque' | 'transparent';
  visibility?: 'default' | 'public' | 'private' | 'confidential';
  attendees?: Array<{
    email: string;
    displayName?: string;
    optional?: boolean;
    responseStatus?: 'needsAction' | 'accepted' | 'declined' | 'tentative';
  }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{ method: 'email' | 'popup'; minutes: number }>;
  };
}

export interface CalendarEventInsertResponse {
  kind: 'calendar#event';
  etag: string;
  id: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  htmlLink: string;
  created: string;
  updated: string;
  summary: string;
  description: string | null;
  start: { dateTime: string | null; date: string | null; timeZone: string | null };
  end: { dateTime: string | null; date: string | null; timeZone: string | null };
  creator: { email: string; displayName: string | null; self: boolean };
  organizer: { email: string; displayName: string | null; self: boolean };
  iCalUID: string;
  sequence: number;
  eventType: 'default' | 'outOfOffice' | 'focusTime' | 'workingLocation' | 'fromGmail';
}

export interface CalendarEventUpdateResponse {
  kind: 'calendar#event';
  etag: string;
  id: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  htmlLink: string;
  updated: string;
  summary: string;
  description: string | null;
  start: { dateTime: string | null; date: string | null; timeZone: string | null };
  end: { dateTime: string | null; date: string | null; timeZone: string | null };
  sequence: number;
  eventType: 'default' | 'outOfOffice' | 'focusTime' | 'workingLocation' | 'fromGmail';
}

export interface CalendarEventDeleteResponse {
  kind: 'calendar#event';
  id: string;
  status: 'cancelled';
}

export interface EventsInsertParams {
  calendarId: string;
  event: CalendarEventInsertRequest;
  sendUpdates?: 'all' | 'externalOnly' | 'none';
  supportsAttachments?: boolean;
}

export interface EventsUpdateParams {
  calendarId: string;
  eventId: string;
  event: CalendarEventUpdateRequest;
  sendUpdates?: 'all' | 'externalOnly' | 'none';
  supportsAttachments?: boolean;
}

export interface EventsDeleteParams {
  calendarId: string;
  eventId: string;
  sendUpdates?: 'all' | 'externalOnly' | 'none';
}
