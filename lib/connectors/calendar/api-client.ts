/**
 * Calendar API Client
 */
import type { ApiClient, RateLimitTier, QuotaDefinition } from '../../platform/connector-platform-sdk';

export const CalendarClient: ApiClient = {
  serviceName: 'Google Calendar',
  baseUrl: 'https://www.googleapis.com/calendar/v3',
  rateLimitTiers: [
    { name: 'Normal', thresholdPercent: 70, score: 100, backoffSeconds: 0 },
    { name: 'Elevated', thresholdPercent: 85, score: 70, backoffSeconds: 10 },
    { name: 'Warning', thresholdPercent: 95, score: 40, backoffSeconds: 30 },
    { name: 'Limited', thresholdPercent: 100, score: 10, backoffSeconds: 60 },
  ] satisfies RateLimitTier[],
  quotaDefinitions: [
    { name: 'read', limit: 1000, windowSeconds: 86400 },
    { name: 'write', limit: 500, windowSeconds: 86400 },
  ] satisfies QuotaDefinition[],
  async read(resource: string, params?: Record<string, string>): Promise<unknown> {
    throw new Error('Not implemented');
  },
  async create(resource: string, payload: unknown): Promise<unknown> {
    throw new Error('Not implemented');
  },
  async update(resource: string, id: string, payload: unknown): Promise<unknown> {
    throw new Error('Not implemented');
  },
  async delete(resource: string, id: string): Promise<void> {
    throw new Error('Not implemented');
  },
};
