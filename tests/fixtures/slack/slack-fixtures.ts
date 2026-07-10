/**
 * Slack Test Fixtures - Deterministic mock data for 95%+ coverage
 */
import { PLATFORM_BASE_TIME } from '../../../lib/platform/mock-time-helpers';
import type { SlackResource } from '../../../lib/connectors/slack/resource-parser';

const BASE_TIME = PLATFORM_BASE_TIME;

export const SlackFixtures = {
  validResource: (): SlackResource => ({
    id: 'resource_001',
    name: 'Sample Resource',
    createdAt: BASE_TIME,
  }),

  batch: (count: number): SlackResource[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: 'resource_' + String(i + 1).padStart(3, '0'),
      name: 'Resource ' + (i + 1),
      createdAt: new Date(BASE_TIME.getTime() + i * 60 * 60 * 1000),
    }));
  },

  validToken: () => ({
    accessToken: 'access_token_valid_1234567890',
    expiresAt: new Date(new Date().getTime() + 3600000),
    scopes: ['slack.readonly'],
  }),

  expiredToken: () => ({
    accessToken: 'access_token_expired_1234567890',
    expiresAt: new Date(new Date().getTime() - 1000),
    scopes: [],
  }),

  expiringToken: () => ({
    accessToken: 'access_token_expiring_1234567890',
    expiresAt: new Date(new Date().getTime() + 5 * 60 * 1000),
    scopes: [],
  }),

  readAction: () => ({
    actionId: 'slack_read',
    params: { resource: 'resources' },
    requestedBy: 'test-user',
    requestedAt: BASE_TIME,
  }),

  approvedAction: () => ({
    actionId: 'slack_create',
    params: { name: 'Approved Resource' },
    requestedBy: 'user',
    requestedAt: BASE_TIME,
    approvedBy: 'admin',
    approvedAt: BASE_TIME,
    approvalReason: 'Standard approval',
    queueId: 'queue_001',
  }),
};
