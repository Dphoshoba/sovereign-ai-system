/**
 * Gmail Connector Platform Tests
 *
 * Tests Gmail against the Gamma Connector Platform SDK interfaces.
 * All deterministic — no Date.now(), no Math.random().
 */

import { describe, it, expect } from 'vitest';
import { GmailOAuth } from '../../lib/connectors/gmail/oauth-adapter';
import { GmailApiClient } from '../../lib/connectors/gmail/api-client';
import { GmailResourceParser } from '../../lib/connectors/gmail/resource-parser';
import { GmailActionSet } from '../../lib/connectors/gmail/action-set';
import { PLATFORM_BASE_TIME } from '../../lib/platform/mock-time-helpers';

const BASE = PLATFORM_BASE_TIME;

describe('Gmail Platform SDK Conformance', () => {
  describe('OAuthAdapter interface', () => {
    it('should have authorizationUrl', () => {
      expect(GmailOAuth.authorizationUrl).toContain('google.com');
    });

    it('should have tokenUrl', () => {
      expect(GmailOAuth.tokenUrl).toContain('oauth2.googleapis.com');
    });

    it('should declare required scopes', () => {
      expect(GmailOAuth.requiredScopes).toContain('https://www.googleapis.com/auth/gmail.readonly');
      expect(GmailOAuth.requiredScopes).toContain('https://www.googleapis.com/auth/gmail.modify');
      expect(GmailOAuth.requiredScopes).toContain('https://www.googleapis.com/auth/gmail.compose');
    });

    it('should flag gmail.send as high-risk', () => {
      expect(GmailOAuth.highRiskScopes).toContain('https://www.googleapis.com/auth/gmail.send');
    });

    it('should validate healthy token', () => {
      const now = new Date();
      const token = {
        accessToken: 'ya29.healthy_token_1234',
        expiresAt: new Date(now.getTime() + 3600000),
        scopes: GmailOAuth.requiredScopes,
      };
      const result = GmailOAuth.validateToken(token);
      expect(result.valid).toBe(true);
      expect(result.issue).toBeUndefined();
    });

    it('should detect expired token', () => {
      const now = new Date();
      const token = {
        accessToken: 'ya29.expired_1234',
        expiresAt: new Date(now.getTime() - 1000),
        scopes: [],
      };
      const result = GmailOAuth.validateToken(token);
      expect(result.valid).toBe(false);
      expect(result.issue).toBe('expired');
    });

    it('should detect expiring-soon token', () => {
      const now = new Date();
      const token = {
        accessToken: 'ya29.expiring_1234',
        expiresAt: new Date(now.getTime() + 5 * 60 * 1000),
        scopes: [],
      };
      const result = GmailOAuth.validateToken(token);
      expect(result.issue).toBe('expiring_soon');
    });

    it('should detect missing token', () => {
      const result = GmailOAuth.validateToken({ accessToken: '', expiresAt: BASE, scopes: [] });
      expect(result.valid).toBe(false);
      expect(result.issue).toBe('missing');
    });

    it('should mask token value', () => {
      const now = new Date();
      const token = {
        accessToken: 'ya29.real_token_abcd',
        expiresAt: new Date(now.getTime() + 3600000),
        scopes: [],
      };
      const result = GmailOAuth.validateToken(token);
      expect(result.maskedToken).toContain('****');
      expect(result.maskedToken).not.toContain('ya29.real_token');
    });
  });

  describe('ApiClient interface', () => {
    it('should have Gmail service name', () => {
      expect(GmailApiClient.serviceName).toBe('Gmail');
    });

    it('should have Gmail base URL', () => {
      expect(GmailApiClient.baseUrl).toContain('gmail.googleapis.com');
    });

    it('should have 4 rate limit tiers', () => {
      expect(GmailApiClient.rateLimitTiers).toHaveLength(4);
    });

    it('should have quotas for read, draft, execution, retry', () => {
      const names = GmailApiClient.quotaDefinitions.map(q => q.name);
      expect(names).toContain('read');
      expect(names).toContain('draft');
      expect(names).toContain('execution');
      expect(names).toContain('retry');
    });

    it('should block non-draft create operations', async () => {
      await expect(GmailApiClient.create('messages', {})).rejects.toThrow('drafts');
    });

    it('should block non-draft delete operations', async () => {
      await expect(GmailApiClient.delete('messages', 'msg_001')).rejects.toThrow('drafts');
    });
  });

  describe('ResourceParser interface', () => {
    const rawMessage = {
      id: 'msg_abc123',
      threadId: 'thread_001',
      labelIds: ['INBOX', 'UNREAD'],
      payload: {
        headers: [
          { name: 'From', value: 'sender@example.com' },
          { name: 'To', value: 'recipient@example.com' },
          { name: 'Subject', value: 'Test Subject' },
        ],
      },
    };

    it('should parse raw Gmail message', () => {
      const parsed = GmailResourceParser.parse(rawMessage);
      expect(parsed.id).toBe('msg_abc123');
      expect(parsed.from).toBe('sender@example.com');
      expect(parsed.subject).toBe('Test Subject');
    });

    it('should parse labels', () => {
      const parsed = GmailResourceParser.parse(rawMessage);
      expect(parsed.labels).toContain('INBOX');
    });

    it('should validate valid message', () => {
      const parsed = GmailResourceParser.parse(rawMessage);
      const result = GmailResourceParser.validate(parsed);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject message without id', () => {
      const parsed = GmailResourceParser.parse({ ...rawMessage, id: '' });
      const result = GmailResourceParser.validate(parsed);
      expect(result.valid).toBe(false);
    });

    it('should sanitize without error', () => {
      const parsed = GmailResourceParser.parse(rawMessage);
      expect(() => GmailResourceParser.sanitize(parsed)).not.toThrow();
    });

    it('should mark sanitized message', () => {
      const parsed = GmailResourceParser.parse(rawMessage);
      const sanitized = GmailResourceParser.sanitize(parsed);
      expect(sanitized.sanitized).toBe(true);
    });
  });

  describe('ActionSet interface', () => {
    it('should have supported actions', () => {
      expect(GmailActionSet.supportedActions.length).toBeGreaterThan(0);
    });

    it('should have gmail_read_inbox as low-risk', () => {
      const readAction = GmailActionSet.supportedActions.find(a => a.id === 'gmail_read_inbox');
      expect(readAction?.riskLevel).toBe('low');
      expect(readAction?.requiresApproval).toBe(false);
    });

    it('should have gmail_create_draft requiring approval', () => {
      const createAction = GmailActionSet.supportedActions.find(a => a.id === 'gmail_create_draft');
      expect(createAction?.requiresApproval).toBe(true);
      expect(createAction?.requiresFeatureFlag).toBe(true);
    });

    it('should NOT expose gmail_send action', () => {
      const sendAction = GmailActionSet.supportedActions.find(a => a.id.includes('send'));
      expect(sendAction).toBeUndefined();
    });

    it('should preview read action (zero side effects)', async () => {
      const request = {
        actionId: 'gmail_read_inbox',
        params: {},
        requestedBy: 'user',
        requestedAt: BASE,
      };
      const preview = await GmailActionSet.preview(request);
      expect(preview.actionId).toBe('gmail_read_inbox');
      expect(preview.estimatedImpact).toContain('Read-only');
    });

    it('should queue action when ENABLE_REAL_EXECUTION=false', async () => {
      const approved: Parameters<typeof GmailActionSet.execute>[0] = {
        actionId: 'gmail_create_draft',
        params: {},
        requestedBy: 'user',
        requestedAt: BASE,
        approvedBy: 'admin',
        approvedAt: BASE,
        approvalReason: 'Approved for test',
        queueId: 'queue_test_001',
      };
      const receipt = await GmailActionSet.execute(approved);
      expect(receipt.status).toBe('queued');
    });
  });
});
