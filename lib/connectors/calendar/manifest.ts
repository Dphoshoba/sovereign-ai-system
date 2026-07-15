/**
 * Calendar Connector - Manifest (Stage 1 Read-Only)
 */

import { ConnectorManifest } from '../sdk/connector-types';

export const calendarManifest: ConnectorManifest = {
  key: 'calendar',
  name: 'Google Calendar',
  provider: 'google',
  category: 'calendar',
  description: 'Connect to Google Calendar to read calendars, events, and availability',
  authType: 'oauth2',
  oauthConfig: {
    clientId: process.env.GCAL_CLIENT_ID || '',
    clientSecret: process.env.GCAL_CLIENT_SECRET || '',
    scopes: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    revokeUrl: 'https://oauth2.googleapis.com/revoke',
  },
  actions: {
    list_calendars: {
      name: 'list_calendars',
      displayName: 'List Calendars',
      description: 'List accessible calendars and metadata',
      riskLevel: 'low',
      requiresApproval: false,
      inputSchema: {
        type: 'object',
        properties: {},
      },
      outputSchema: {
        type: 'object',
        properties: {
          calendars: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                summary: { type: 'string' },
                timezone: { type: 'string' },
                primary: { type: 'boolean' },
                accessRole: { type: 'string' },
              },
            },
          },
        },
      },
    },
    list_events: {
      name: 'list_events',
      displayName: 'List Events',
      description: 'List events for a calendar',
      riskLevel: 'low',
      requiresApproval: false,
      inputSchema: {
        type: 'object',
        properties: {
          calendarId: { type: 'string' },
          maxResults: { type: 'integer', default: 25 },
          pageToken: { type: 'string' },
          timeMin: { type: 'string' },
          timeMax: { type: 'string' },
        },
        required: ['calendarId'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          events: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                summary: { type: 'string' },
                start: { type: 'string' },
                end: { type: 'string' },
                timezone: { type: 'string' },
                allDay: { type: 'boolean' },
              },
            },
          },
          nextPageToken: { type: 'string' },
        },
      },
    },
    get_event: {
      name: 'get_event',
      displayName: 'Get Event',
      description: 'Get event details by ID',
      riskLevel: 'low',
      requiresApproval: false,
      inputSchema: {
        type: 'object',
        properties: {
          calendarId: { type: 'string' },
          eventId: { type: 'string' },
        },
        required: ['calendarId', 'eventId'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          event: { type: 'object' },
        },
      },
    },
    search_events: {
      name: 'search_events',
      displayName: 'Search Events',
      description: 'Search events using text query and filters',
      riskLevel: 'low',
      requiresApproval: false,
      inputSchema: {
        type: 'object',
        properties: {
          calendarId: { type: 'string' },
          query: { type: 'string' },
          timeMin: { type: 'string' },
          timeMax: { type: 'string' },
          maxResults: { type: 'integer', default: 25 },
        },
        required: ['calendarId', 'query'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          events: { type: 'array' },
        },
      },
    },
    free_busy_lookup: {
      name: 'free_busy_lookup',
      displayName: 'Free/Busy Lookup',
      description: 'Read free/busy blocks for a time window',
      riskLevel: 'low',
      requiresApproval: false,
      inputSchema: {
        type: 'object',
        properties: {
          calendarId: { type: 'string' },
          timeMin: { type: 'string' },
          timeMax: { type: 'string' },
          timeZone: { type: 'string' },
        },
        required: ['calendarId', 'timeMin', 'timeMax'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          calendarId: { type: 'string' },
          busy: { type: 'array' },
        },
      },
    },
    compute_availability: {
      name: 'compute_availability',
      displayName: 'Compute Availability',
      description: 'Compute availability windows and conflict status',
      riskLevel: 'low',
      requiresApproval: false,
      inputSchema: {
        type: 'object',
        properties: {
          calendarId: { type: 'string' },
          start: { type: 'string' },
          end: { type: 'string' },
          timeZone: { type: 'string' },
        },
        required: ['calendarId', 'start', 'end'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          available: { type: 'boolean' },
          windows: { type: 'array' },
        },
      },
    },
    inspect_permissions: {
      name: 'inspect_permissions',
      displayName: 'Inspect Permissions',
      description: 'Inspect read permissions and access role',
      riskLevel: 'low',
      requiresApproval: false,
      inputSchema: {
        type: 'object',
        properties: {
          calendarId: { type: 'string' },
          accessRole: { type: 'string' },
        },
        required: ['calendarId', 'accessRole'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          inspection: { type: 'object' },
        },
      },
    },
  },
};

export function validateCalendarManifest(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!calendarManifest.oauthConfig?.clientId) {
    errors.push('GCAL_CLIENT_ID environment variable not set');
  }

  if (!calendarManifest.oauthConfig?.clientSecret) {
    errors.push('GCAL_CLIENT_SECRET environment variable not set');
  }

  const actionKeys = Object.keys(calendarManifest.actions);
  const mutationActions = actionKeys.filter((key) =>
    key.includes('create') || key.includes('update') || key.includes('delete') || key.includes('cancel')
  );

  if (mutationActions.length > 0) {
    errors.push(`Stage 1 read-only violation. Mutation actions found: ${mutationActions.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
