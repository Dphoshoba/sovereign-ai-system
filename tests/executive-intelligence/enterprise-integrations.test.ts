import { describe, it, expect } from 'vitest';
import { buildIntegrationPlatform, type IntegrationPlatform, type IntegrationStatus } from '../../src/lib/executive/enterprise-integrations';

describe('Enterprise Integration Platform', () => {
  it('builds integration platform with 7 integrations', () => {
    const platform = buildIntegrationPlatform();

    expect(platform.integrations.length).toBe(7);
    expect(platform.totalCount).toBe(7);
    expect(platform.generatedAt).toBeGreaterThan(0);
  });

  it('correctly counts certified and configured integrations', () => {
    const platform = buildIntegrationPlatform();

    const certified = platform.integrations.filter((i: IntegrationStatus) => i.status === 'certified');
    expect(certified.length).toBe(1);
    expect(platform.certifiedCount).toBe(1);

    const configured = platform.integrations.filter((i: IntegrationStatus) => i.status !== 'not_configured');
    expect(configured.length).toBe(7);
    expect(platform.configuredCount).toBe(7);

    const email = platform.integrations.find((i: IntegrationStatus) => i.name === 'Email');
    expect(email).toBeDefined();
    expect(email!.status).toBe('certified');
    expect(email!.version).toBe('1.0');
  });
});
