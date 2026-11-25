/**
 * Google Calendar Connector Metadata
 * Auto-registered by Gamma Platform
 */
export const CalendarConnectorMetadata = {
  id: 'calendar',
  name: 'Google Calendar',
  version: '1.0.0',
  description: 'Connector for Google Calendar',
  baseUrl: 'https://www.googleapis.com/calendar/v3',
  adapters: {
    oauth: true,
    apiClient: true,
    resourceParser: true,
    actionSet: true,
  },
  operations: {
    read: true,
    create: true,
    update: true,
    delete: true,
  },
  security: {
    requiresApproval: true,
    requiresFeatureFlag: 'ENABLE_REAL_EXECUTION',
    maskesTokens: true,
  },
  tags: ['calendar', 'gamma-connector', 'phase-xvi'],
} as const;
