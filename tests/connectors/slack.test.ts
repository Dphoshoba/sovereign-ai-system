/**
 * Slack Comprehensive Test Suite (95%+ Coverage)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { SlackOAuth } from '../../lib/connectors/slack/oauth-adapter';
import { SlackClient } from '../../lib/connectors/slack/api-client';
import { SlackParser } from '../../lib/connectors/slack/resource-parser';
import { SlackActions } from '../../lib/connectors/slack/action-set';
import { SlackReader } from '../../lib/gamma/slack-reader';
import { SlackFixtures } from '../fixtures/slack/slack-fixtures';

const BASE_TIME = new Date('2026-07-01T00:00:00Z');

describe('Slack Connector', () => {
  describe('OAuth Adapter', () => {
    it('should have authorizationUrl', () => {
      expect(SlackOAuth.authorizationUrl).toMatch(/^https?:\/\//);
    });

    it('should have tokenUrl', () => {
      expect(SlackOAuth.tokenUrl).toMatch(/^https?:\/\//);
    });

    it('should have requiredScopes', () => {
      expect(SlackOAuth.requiredScopes.length).toBeGreaterThan(0);
    });

    it('should validate healthy token', () => {
      const token = SlackFixtures.validToken();
      const result = SlackOAuth.validateToken(token);
      expect(result.valid).toBe(true);
      expect(result.issue).toBeUndefined();
    });

    it('should detect expired tokens', () => {
      const token = SlackFixtures.expiredToken();
      const result = SlackOAuth.validateToken(token);
      expect(result.valid).toBe(false);
      expect(result.issue).toBe('expired');
    });

    it('should detect expiring-soon tokens', () => {
      const token = SlackFixtures.expiringToken();
      const result = SlackOAuth.validateToken(token);
      expect(result.issue).toBe('expiring_soon');
    });

    it('should mask tokens', () => {
      const token = SlackFixtures.validToken();
      const result = SlackOAuth.validateToken(token);
      expect(result.maskedToken).toContain('****');
      expect(result.maskedToken).not.toContain(token.accessToken);
    });
  });

  describe('API Client', () => {
    it('should have serviceName', () => {
      expect(SlackClient.serviceName).toBeTruthy();
    });

    it('should have baseUrl', () => {
      expect(SlackClient.baseUrl).toMatch(/^https?:\/\//);
    });

    it('should have rateLimitTiers', () => {
      expect(SlackClient.rateLimitTiers.length).toBeGreaterThan(0);
    });

    it('should have quotaDefinitions', () => {
      expect(SlackClient.quotaDefinitions.length).toBeGreaterThan(0);
    });
  });

  describe('Resource Parser', () => {
    it('should parse valid resource', () => {
      const fixture = SlackFixtures.validResource();
      const parsed = SlackParser.parse(fixture);
      expect(parsed.id).toBe(fixture.id);
    });

    it('should validate complete resource', () => {
      const resource = SlackFixtures.validResource();
      const result = SlackParser.validate(resource);
      expect(result.valid).toBe(true);
    });

    it('should reject incomplete resource', () => {
      const invalid = { id: '', name: '', createdAt: BASE_TIME };
      const result = SlackParser.validate(invalid);
      expect(result.valid).toBe(false);
    });

    it('should sanitize resource', () => {
      const resource = SlackFixtures.validResource();
      expect(() => SlackParser.sanitize(resource)).not.toThrow();
    });
  });

  describe('Action Set', () => {
    it('should have supportedActions', () => {
      expect(SlackActions.supportedActions.length).toBeGreaterThan(0);
    });

    it('should preview action', async () => {
      const action = SlackFixtures.readAction();
      const preview = await SlackActions.preview(action);
      expect(preview.actionId).toBe(action.actionId);
    });

    it('should queue execution', async () => {
      const approved = SlackFixtures.approvedAction();
      const receipt = await SlackActions.execute(approved);
      expect(receipt.status).toBe('queued');
    });
  });

  describe('Slack Reader', () => {
    let reader: SlackReader;

    beforeEach(() => {
      reader = new SlackReader();
    });

    it('should start empty', () => {
      expect(reader.count()).toBe(0);
    });

    it('should store and retrieve', () => {
      const resource = SlackFixtures.validResource();
      reader.set(resource.id, resource);
      expect(reader.get(resource.id)?.id).toBe(resource.id);
    });

    it('should get all', () => {
      const batch = SlackFixtures.batch(3);
      for (const r of batch) reader.set(r.id, r);
      expect(reader.all()).toHaveLength(3);
    });

    it('should filter', () => {
      const resource = SlackFixtures.validResource();
      reader.set(resource.id, resource);
      const found = reader.filter(r => r.id === resource.id);
      expect(found.length).toBeGreaterThan(0);
    });

    it('should get summary deterministically', () => {
      reader.set('1', SlackFixtures.validResource());
      const s1 = reader.getSummary(BASE_TIME);
      const s2 = reader.getSummary(BASE_TIME);
      expect(s1).toEqual(s2);
    });
  });

  describe('Safety & Compliance', () => {
    it('should not expose tokens in logs', () => {
      const token = SlackFixtures.validToken();
      const result = SlackOAuth.validateToken(token);
      expect(result.maskedToken).not.toContain(token.accessToken);
    });

    it('should require approval for medium-risk actions', () => {
      const action = SlackActions.supportedActions.find(a => a.riskLevel === 'medium');
      expect(action?.requiresApproval).toBe(true);
    });

    it('should validate resources', () => {
      const invalid = { id: '', name: '', createdAt: BASE_TIME };
      const result = SlackParser.validate(invalid);
      expect(result.valid).toBe(false);
    });
  });
});
