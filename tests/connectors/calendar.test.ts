/**
 * Calendar Comprehensive Test Suite (95%+ Coverage)
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CalendarOAuth } from '../../lib/connectors/calendar/oauth-adapter';
import {
  CalendarApiError,
  CalendarClient,
  GoogleCalendarApiClient,
} from '../../lib/connectors/calendar/api-client';
import { CalendarParser } from '../../lib/connectors/calendar/resource-parser';
import { CalendarActions } from '../../lib/connectors/calendar/action-set';
import { CalendarReader } from '../../lib/gamma/calendar-reader';
import { CalendarFixtures } from '../fixtures/calendar/calendar-fixtures';

const BASE_TIME = new Date('2026-07-01T00:00:00Z');

describe('Calendar Connector', () => {
  describe('OAuth Adapter', () => {
    it('should have authorizationUrl', () => {
      expect(CalendarOAuth.authorizationUrl).toMatch(/^https?:\/\//);
    });

    it('should have tokenUrl', () => {
      expect(CalendarOAuth.tokenUrl).toMatch(/^https?:\/\//);
    });

    it('should have requiredScopes', () => {
      expect(CalendarOAuth.requiredScopes.length).toBeGreaterThan(0);
    });

    it('should validate healthy token', () => {
      const now = new Date();
      const token = {
        accessToken: 'access_token_valid_1234567890',
        expiresAt: new Date(now.getTime() + 3600000),
        scopes: ['calendar.readonly'],
      };
      const result = CalendarOAuth.validateToken(token);
      expect(result.valid).toBe(true);
      expect(result.issue).toBeUndefined();
    });

    it('should detect expired tokens', () => {
      const token = CalendarFixtures.expiredToken();
      const result = CalendarOAuth.validateToken(token);
      expect(result.valid).toBe(false);
      expect(result.issue).toBe('expired');
    });

    it('should detect expiring-soon tokens', () => {
      const now = new Date();
      const token = {
        accessToken: 'access_token_expiring_1234567890',
        expiresAt: new Date(now.getTime() + 5 * 60 * 1000),
        scopes: [],
      };
      const result = CalendarOAuth.validateToken(token);
      expect(result.issue).toBe('expiring_soon');
    });

    it('should mask tokens', () => {
      const token = CalendarFixtures.validToken();
      const result = CalendarOAuth.validateToken(token);
      expect(result.maskedToken).toContain('****');
      expect(result.maskedToken).not.toContain(token.accessToken);
    });
  });

  describe('API Client', () => {
    it('should have serviceName', () => {
      expect(CalendarClient.serviceName).toBeTruthy();
    });

    it('should have baseUrl', () => {
      expect(CalendarClient.baseUrl).toMatch(/^https?:\/\//);
    });

    it('should have rateLimitTiers', () => {
      expect(CalendarClient.rateLimitTiers.length).toBeGreaterThan(0);
    });

    it('should have quotaDefinitions', () => {
      expect(CalendarClient.quotaDefinitions.length).toBeGreaterThan(0);
    });

    it('should expose async read on the platform adapter object', async () => {
      await expect(CalendarClient.read('event', { calendarId: 'primary', eventId: 'e1' })).rejects.toThrow(
        /requires GoogleCalendarApiClient/,
      );
    });
  });

  describe('GoogleCalendarApiClient.read', () => {
    const token = 'access_token_valid_1234567890';
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('reads a single event successfully', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'evt-1',
          summary: 'Standup',
          start: { dateTime: '2026-07-01T09:00:00Z', timeZone: 'UTC' },
          end: { dateTime: '2026-07-01T09:30:00Z', timeZone: 'UTC' },
          status: 'confirmed',
          updated: '2026-07-01T08:00:00Z',
        }),
      });

      const client = new GoogleCalendarApiClient(token);
      const event = (await client.read('event', {
        calendarId: 'primary',
        eventId: 'evt-1',
      })) as { id: string; summary: string };

      expect(event.id).toBe('evt-1');
      expect(event.summary).toBe('Standup');
      expect(fetchMock).toHaveBeenCalledOnce();
      const [url, init] = fetchMock.mock.calls[0];
      expect(String(url)).toContain('/calendars/primary/events/evt-1');
      expect(init.headers.Authorization).toBe(`Bearer ${token}`);
    });

    it('returns null for a missing event', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({}),
      });

      const client = new GoogleCalendarApiClient(token);
      await expect(
        client.read('event', { calendarId: 'primary', eventId: 'missing' }),
      ).resolves.toBeNull();
    });

    it('rejects invalid input before calling the network', async () => {
      const client = new GoogleCalendarApiClient(token);
      await expect(client.read('')).rejects.toThrow(/resource name/);
      await expect(client.read('events')).rejects.toThrow(/calendarId/);
      await expect(client.read('event', { calendarId: 'primary' })).rejects.toThrow(/eventId/);
      await expect(client.read('unsupported')).rejects.toThrow(/unsupported resource/);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects empty access tokens before calling the network', async () => {
      const client = new GoogleCalendarApiClient('   ');
      await expect(client.read('calendars')).rejects.toThrow(/access token/);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('surfaces permission failures', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({}),
      });

      const client = new GoogleCalendarApiClient(token);
      await expect(
        client.read('event', { calendarId: 'primary', eventId: 'secret' }),
      ).rejects.toBeInstanceOf(CalendarApiError);
      await expect(
        client.read('event', { calendarId: 'primary', eventId: 'secret' }),
      ).rejects.toThrow(/permission denied/);
    });
  });

  describe('Resource Parser', () => {
    it('should parse valid resource', () => {
      const fixture = CalendarFixtures.validResource();
      const parsed = CalendarParser.parse(fixture);
      expect(parsed.id).toBe(fixture.id);
    });

    it('should validate complete resource', () => {
      const resource = CalendarFixtures.validResource();
      const result = CalendarParser.validate(resource);
      expect(result.valid).toBe(true);
    });

    it('should reject incomplete resource', () => {
      const invalid = { id: '', name: '', createdAt: BASE_TIME };
      const result = CalendarParser.validate(invalid);
      expect(result.valid).toBe(false);
    });

    it('should sanitize resource', () => {
      const resource = CalendarFixtures.validResource();
      expect(() => CalendarParser.sanitize(resource)).not.toThrow();
    });
  });

  describe('Action Set', () => {
    it('should have supportedActions', () => {
      expect(CalendarActions.supportedActions.length).toBeGreaterThan(0);
    });

    it('should preview action', async () => {
      const action = CalendarFixtures.readAction();
      const preview = await CalendarActions.preview(action);
      expect(preview.actionId).toBe(action.actionId);
    });

    it('should queue execution', async () => {
      const approved = CalendarFixtures.approvedAction();
      const receipt = await CalendarActions.execute(approved);
      expect(receipt.status).toBe('queued');
    });
  });

  describe('Calendar Reader', () => {
    let reader: CalendarReader;

    beforeEach(() => {
      reader = new CalendarReader();
    });

    it('should start empty', () => {
      expect(reader.count()).toBe(0);
    });

    it('should store and retrieve', () => {
      const resource = CalendarFixtures.validResource();
      reader.set(resource.id, resource);
      expect(reader.get(resource.id)?.id).toBe(resource.id);
    });

    it('should get all', () => {
      const batch = CalendarFixtures.batch(3);
      for (const r of batch) reader.set(r.id, r);
      expect(reader.all()).toHaveLength(3);
    });

    it('should filter', () => {
      const resource = CalendarFixtures.validResource();
      reader.set(resource.id, resource);
      const found = reader.filter((r) => r.id === 'resource_001');
      expect(found.length).toBe(1);
      expect(found[0].id).toBe('resource_001');
    });

    it('should get summary deterministically', () => {
      reader.set('1', CalendarFixtures.validResource());
      const s1 = reader.getSummary(BASE_TIME);
      const s2 = reader.getSummary(BASE_TIME);
      expect(s1).toEqual(s2);
    });
  });

  describe('Safety & Compliance', () => {
    it('should not expose tokens in logs', () => {
      const token = CalendarFixtures.validToken();
      const result = CalendarOAuth.validateToken(token);
      expect(result.maskedToken).not.toContain(token.accessToken);
    });

    it('should require approval for medium-risk actions', () => {
      const action = CalendarActions.supportedActions.find(a => a.riskLevel === 'medium');
      expect(action?.requiresApproval).toBe(true);
    });

    it('should validate resources', () => {
      const invalid = { id: '', name: '', createdAt: BASE_TIME };
      const result = CalendarParser.validate(invalid);
      expect(result.valid).toBe(false);
    });
  });
});
