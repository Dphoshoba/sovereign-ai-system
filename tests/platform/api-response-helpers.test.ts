/**
 * API Response Helpers Tests
 *
 * Tests for all platform API response constructors.
 * Deterministic — no network calls, no Date.now().
 */

import { describe, it, expect } from 'vitest';
import {
  ok,
  list,
  created,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  validationError,
  rateLimited,
  serverError,
  serviceUnavailable,
  cachedOk,
  simulationOnly,
  featureDisabled,
} from '../../lib/platform/api-response-helpers';

async function parseBody(response: Response): Promise<unknown> {
  return response.json();
}

describe('API Response Helpers', () => {
  describe('ok()', () => {
    it('should return 200 status', async () => {
      const res = ok({ id: 1 });
      expect(res.status).toBe(200);
    });

    it('should include data in body', async () => {
      const res = ok({ id: 1, name: 'test' });
      const body = await parseBody(res) as Record<string, unknown>;
      expect((body as any).data).toEqual({ id: 1, name: 'test' });
    });

    it('should include status ok', async () => {
      const res = ok({});
      const body = await parseBody(res) as Record<string, unknown>;
      expect((body as any).status).toBe('ok');
    });
  });

  describe('list()', () => {
    it('should return 200 with count', async () => {
      const res = list([1, 2, 3]);
      expect(res.status).toBe(200);
      const body = await parseBody(res) as Record<string, unknown>;
      expect((body as any).count).toBe(3);
    });

    it('should handle empty list', async () => {
      const res = list([]);
      const body = await parseBody(res) as Record<string, unknown>;
      expect((body as any).count).toBe(0);
    });
  });

  describe('created()', () => {
    it('should return 201 status', () => {
      expect(created({ id: 'new' }).status).toBe(201);
    });
  });

  describe('badRequest()', () => {
    it('should return 400 status', () => {
      expect(badRequest('Invalid input').status).toBe(400);
    });

    it('should include error message', async () => {
      const res = badRequest('Field required');
      const body = await parseBody(res) as Record<string, unknown>;
      expect((body as any).error).toBe('Field required');
    });
  });

  describe('unauthorized()', () => {
    it('should return 401 status', () => {
      expect(unauthorized().status).toBe(401);
    });

    it('should use default message', async () => {
      const res = unauthorized();
      const body = await parseBody(res) as Record<string, unknown>;
      expect((body as any).error).toContain('Authentication');
    });

    it('should accept custom message', async () => {
      const res = unauthorized('Token expired');
      const body = await parseBody(res) as Record<string, unknown>;
      expect((body as any).error).toBe('Token expired');
    });
  });

  describe('forbidden()', () => {
    it('should return 403 status', () => {
      expect(forbidden().status).toBe(403);
    });
  });

  describe('notFound()', () => {
    it('should return 404 status', () => {
      expect(notFound().status).toBe(404);
    });

    it('should include error message', async () => {
      const res = notFound('Connector not found');
      const body = await parseBody(res) as Record<string, unknown>;
      expect((body as any).error).toBe('Connector not found');
    });

    it('should use default message', async () => {
      const res = notFound();
      const body = await parseBody(res) as Record<string, unknown>;
      expect((body as any).error).toBe('Not found');
    });
  });

  describe('conflict()', () => {
    it('should return 409 status', () => {
      expect(conflict('Already exists').status).toBe(409);
    });
  });

  describe('validationError()', () => {
    it('should return 422 status', () => {
      expect(validationError(['Name required']).status).toBe(422);
    });

    it('should include errors array', async () => {
      const res = validationError(['Name required', 'Email invalid']);
      const body = await parseBody(res) as Record<string, unknown>;
      expect((body as any).errors).toHaveLength(2);
    });
  });

  describe('rateLimited()', () => {
    it('should return 429 status', () => {
      expect(rateLimited().status).toBe(429);
    });
  });

  describe('serverError()', () => {
    it('should return 500 status', () => {
      expect(serverError(new Error('Boom')).status).toBe(500);
    });

    it('should include error message for Error objects', async () => {
      const res = serverError(new Error('Database timeout'));
      const body = await parseBody(res) as Record<string, unknown>;
      expect((body as any).error).toContain('Database timeout');
    });

    it('should handle non-Error objects', () => {
      expect(() => serverError('string error')).not.toThrow();
    });

    it('should include context when provided', async () => {
      const res = serverError(new Error('fail'), 'ConnectorLoader');
      const body = await parseBody(res) as Record<string, unknown>;
      expect((body as any).error).toContain('ConnectorLoader');
    });
  });

  describe('serviceUnavailable()', () => {
    it('should return 503 status', () => {
      expect(serviceUnavailable().status).toBe(503);
    });
  });

  describe('cachedOk()', () => {
    it('should return 200 status', () => {
      expect(cachedOk({ data: 1 }, 30).status).toBe(200);
    });

    it('should include cached flag', async () => {
      const res = cachedOk({ data: 1 }, 30);
      const body = await parseBody(res) as Record<string, unknown>;
      expect((body as any).cached).toBe(true);
    });
  });

  describe('simulationOnly()', () => {
    it('should return 200 status', () => {
      expect(simulationOnly({ preview: 'test' }).status).toBe(200);
    });

    it('should include simulation status', async () => {
      const res = simulationOnly({ preview: 'test' });
      const body = await parseBody(res) as Record<string, unknown>;
      expect((body as any).status).toBe('simulation');
    });

    it('should include safety note', async () => {
      const res = simulationOnly({});
      const body = await parseBody(res) as Record<string, unknown>;
      expect((body as any).note).toContain('ENABLE_REAL_EXECUTION');
    });
  });

  describe('featureDisabled()', () => {
    it('should return 403 status', () => {
      expect(featureDisabled('NEW_FEATURE').status).toBe(403);
    });

    it('should include feature flag name in error', async () => {
      const res = featureDisabled('ENABLE_CALENDAR');
      const body = await parseBody(res) as Record<string, unknown>;
      expect((body as any).error).toContain('ENABLE_CALENDAR');
    });
  });

  describe('Response body shape consistency', () => {
    it('all success responses should have status field', async () => {
      for (const res of [ok({}), list([]), created({})]) {
        const body = await parseBody(res) as Record<string, unknown>;
        expect(body).toHaveProperty('status');
      }
    });

    it('all error responses should have error field', async () => {
      for (const res of [badRequest('x'), unauthorized(), forbidden(), notFound(), serverError('x')]) {
        const body = await parseBody(res) as Record<string, unknown>;
        expect(body).toHaveProperty('error');
      }
    });
  });
});
