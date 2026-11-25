import { describe, it, expect } from 'vitest';
import { buildApiPlatform, type ApiPlatform, type ApiEndpoint } from '../../src/lib/executive/enterprise-api';

describe('Enterprise API Platform', () => {
  it('builds API platform with 5 endpoints', () => {
    const platform = buildApiPlatform();

    expect(platform.endpoints.length).toBe(5);
    expect(platform.totalCount).toBe(5);
    expect(platform.generatedAt).toBeGreaterThan(0);
  });

  it('correctly counts stable vs beta endpoints', () => {
    const platform = buildApiPlatform();

    const stable = platform.endpoints.filter((e: ApiEndpoint) => e.status === 'stable');
    expect(stable.length).toBe(4);
    expect(platform.stableCount).toBe(4);

    const beta = platform.endpoints.filter((e: ApiEndpoint) => e.status === 'beta');
    expect(beta.length).toBe(1);

    const briefing = platform.endpoints.find((e: ApiEndpoint) => e.path === '/api/executive/briefing');
    expect(briefing).toBeDefined();
    expect(briefing!.method).toBe('GET');
    expect(briefing!.version).toBe('v1');
    expect(briefing!.status).toBe('stable');

    const boardroom = platform.endpoints.find((e: ApiEndpoint) => e.path === '/api/executive/boardroom');
    expect(boardroom!).toBeDefined();
    expect(boardroom!.status).toBe('beta');
  });
});
