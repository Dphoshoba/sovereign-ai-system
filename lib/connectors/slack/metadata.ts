/**
 * Slack Connector Metadata
 * Auto-registered by Gamma Platform
 */
export const SlackConnectorMetadata = {
  id: 'slack',
  name: 'Slack',
  version: '1.0.0',
  description: 'Connector for Slack',
  baseUrl: 'https://slack.com/api',
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
  tags: ['slack', 'gamma-connector', 'phase-xvi'],
} as const;
