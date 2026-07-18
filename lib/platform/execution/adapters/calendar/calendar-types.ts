export interface CalendarEvent {
  id: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  htmlLink: string;
  created: string;
  updated: string;
  summary: string;
  description: string | null;
  location: string | null;
  colorId: string | null;
  creator: {
    id: string | null;
    email: string;
    displayName: string | null;
    self: boolean;
  };
  organizer: {
    id: string | null;
    email: string;
    displayName: string | null;
    self: boolean;
  };
  start: {
    dateTime: string | null;
    date: string | null;
    timeZone: string | null;
  };
  end: {
    dateTime: string | null;
    date: string | null;
    timeZone: string | null;
  };
  recurringEventId: string | null;
  originalStartTime: {
    dateTime: string | null;
    date: string | null;
    timeZone: string | null;
  } | null;
  iCalUID: string;
  sequence: number;
  reminders: {
    useDefault: boolean;
    overrides: Array<{ method: string; minutes: number }> | null;
  };
  eventType: 'default' | 'outOfOffice' | 'focusTime' | 'workingLocation' | 'fromGmail';
}

export interface CalendarEventListResponse {
  kind: 'calendar#events';
  etag: string;
  summary: string;
  description: string | null;
  updated: string;
  timeZone: string;
  accessRole: string;
  defaultReminders: Array<{ method: string; minutes: number }>;
  nextPageToken: string | null;
  nextSyncToken: string | null;
  items: CalendarEvent[];
}

export interface CalendarEventGetResponse {
  kind: 'calendar#event';
  etag: string;
  id: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  htmlLink: string;
  created: string;
  updated: string;
  summary: string;
  description: string | null;
  location: string | null;
  colorId: string | null;
  creator: { id: string | null; email: string; displayName: string | null; self: boolean };
  organizer: { id: string | null; email: string; displayName: string | null; self: boolean };
  start: { dateTime: string | null; date: string | null; timeZone: string | null };
  end: { dateTime: string | null; date: string | null; timeZone: string | null };
  recurringEventId: string | null;
  originalStartTime: { dateTime: string | null; date: string | null; timeZone: string | null } | null;
  iCalUID: string;
  sequence: number;
  reminders: { useDefault: boolean; overrides: Array<{ method: string; minutes: number }> | null };
  eventType: 'default' | 'outOfOffice' | 'focusTime' | 'workingLocation' | 'fromGmail';
}

export interface CalendarListEntry {
  id: string;
  summary: string;
  description: string | null;
  timeZone: string;
  accessRole: 'freeBusyReader' | 'reader' | 'writer' | 'owner';
  primary: boolean | null;
  backgroundColor: string;
  foregroundColor: string;
  selected: boolean;
  etag: string;
}

export interface CalendarListResponse {
  kind: 'calendar#calendarList';
  etag: string;
  nextPageToken: string | null;
  nextSyncToken: string | null;
  items: CalendarListEntry[];
}

export type CalendarOperation = 'events.list' | 'events.get' | 'calendarList.list' | 'calendars.get';

export interface CalendarListParams {
  minAccessRole?: 'freeBusyReader' | 'reader' | 'writer' | 'owner';
  maxResults?: number;
  pageToken?: string;
  showDeleted?: boolean;
  showHidden?: boolean;
}

export interface EventsListParams {
  calendarId: string;
  timeMin?: string;
  timeMax?: string;
  updatedMin?: string;
  maxResults?: number;
  pageToken?: string;
  showDeleted?: boolean;
  showHiddenInvitations?: boolean;
  singleEvents?: boolean;
  orderBy?: 'startTime' | 'updated';
  q?: string;
}

export interface EventsGetParams {
  calendarId: string;
  eventId: string;
}
