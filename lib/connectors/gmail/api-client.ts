/**
 * Gmail API Client
 *
 * Implements ApiClient from the Gamma Connector Platform SDK.
 * Wraps Gmail REST API with platform-standard interface.
 */

import type { ApiClient, RateLimitTier, QuotaDefinition } from '../../platform/connector-platform-sdk';

export const GmailApiClient: ApiClient = {
  serviceName: 'Gmail',
  baseUrl: 'https://gmail.googleapis.com/gmail/v1/users/me',

  rateLimitTiers: [
    { name: 'Normal',   thresholdPercent: 70,  score: 100, backoffSeconds: 0 },
    { name: 'Elevated', thresholdPercent: 85,  score: 70,  backoffSeconds: 10 },
    { name: 'Warning',  thresholdPercent: 95,  score: 40,  backoffSeconds: 30 },
    { name: 'Limited',  thresholdPercent: 100, score: 10,  backoffSeconds: 60 },
  ] satisfies RateLimitTier[],

  quotaDefinitions: [
    { name: 'read',      limit: 1000, windowSeconds: 86400 },
    { name: 'draft',     limit: 500,  windowSeconds: 86400 },
    { name: 'execution', limit: 250,  windowSeconds: 86400 },
    { name: 'retry',     limit: 100,  windowSeconds: 86400 },
  ] satisfies QuotaDefinition[],

  async read(resource: string, params?: Record<string, string>): Promise<unknown> {
    // Production: GET /gmail/v1/users/me/{resource}
    // Requires Build 141 for real execution
    throw new Error(`GmailApiClient.read(${resource}): requires Build 141 real execution`);
  },

  async create(resource: string, payload: unknown): Promise<unknown> {
    // Production: POST /gmail/v1/users/me/{resource}
    // SAFETY: Only draft creation allowed. messages.send is not exposed.
    if (resource !== 'drafts') {
      throw new Error(`GmailApiClient.create: only 'drafts' resource allowed, got '${resource}'`);
    }
    throw new Error(`GmailApiClient.create(${resource}): requires Build 141 real execution`);
  },

  async update(resource: string, id: string, payload: unknown): Promise<unknown> {
    // Production: PATCH /gmail/v1/users/me/{resource}/{id}
    throw new Error(`GmailApiClient.update(${resource}, ${id}): requires Build 141 real execution`);
  },

  async delete(resource: string, id: string): Promise<void> {
    // Production: DELETE /gmail/v1/users/me/{resource}/{id}
    // SAFETY: Only draft deletion allowed.
    if (resource !== 'drafts') {
      throw new Error(`GmailApiClient.delete: only 'drafts' resource allowed, got '${resource}'`);
    }
    throw new Error(`GmailApiClient.delete(${resource}, ${id}): requires Build 141 real execution`);
  },
};
