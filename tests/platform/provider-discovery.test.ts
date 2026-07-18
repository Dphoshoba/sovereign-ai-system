import { describe, it, expect, beforeEach } from 'vitest';
import { ProviderRegistration } from '../../lib/platform/execution/provider-registry';
import { ProviderRegistryImpl } from '../../lib/platform/execution/provider-registry-impl';
import { ProviderDiscoveryImpl } from '../../lib/platform/execution/provider-discovery-impl';

function sampleProvider(
  id: string,
  overrides?: Partial<ProviderRegistration>,
): ProviderRegistration {
  return {
    identity: { id, name: id, version: '1.0.0' },
    lifecycle: 'CERTIFIED',
    capabilities: [
      { operation: 'test.read', contractVersion: 'v1' },
      { operation: 'test.write', contractVersion: 'v2' },
    ],
    certification: {
      governanceDecision: 'GOV-0000-TEST-001',
      level: 'STAGE_3C',
      eosVersion: '1.0.0',
      certifiedAt: '2026-07-19T00:00:00.000Z',
    },
    health: { available: true, ready: true },
    policy: { sandboxSupported: true, writeOperations: true, featureFlags: [] },
    metadata: {
      description: `Provider ${id}`,
      owner: 'Test',
      documentationRef: 'docs/test.md',
    },
    ...overrides,
  };
}

describe('ProviderDiscoveryImpl', () => {
  let registry: ProviderRegistryImpl;
  let discovery: ProviderDiscoveryImpl;

  beforeEach(() => {
    registry = new ProviderRegistryImpl();
    discovery = new ProviderDiscoveryImpl(registry);
  });

  describe('findByOperation', () => {
    it('finds providers by operation', () => {
      registry.register(sampleProvider('alpha'));
      const results = discovery.findByOperation('test.read');
      expect(results).toHaveLength(1);
      expect(results[0].provider.identity.id).toBe('alpha');
    });

    it('filters by lifecycle', () => {
      registry.register(sampleProvider('alpha', { lifecycle: 'REGISTERED' }));
      registry.register(sampleProvider('beta', { lifecycle: 'CERTIFIED' }));
      const results = discovery.findByOperation('test.read', { minLifecycle: 'CERTIFIED' });
      expect(results).toHaveLength(1);
      expect(results[0].provider.identity.id).toBe('beta');
    });

    it('filters by certification level', () => {
      registry.register(sampleProvider('alpha', { certification: { ...sampleProvider('').certification, level: 'STAGE_3B' } }));
      registry.register(sampleProvider('beta', { certification: { ...sampleProvider('').certification, level: 'STAGE_3C' } }));
      const results = discovery.findByOperation('test.read', { minCertification: 'STAGE_3C' });
      expect(results).toHaveLength(1);
      expect(results[0].provider.identity.id).toBe('beta');
    });

    it('filters by contract version', () => {
      registry.register(sampleProvider('alpha'));
      const results = discovery.findByOperation('test.read', { contractVersion: 'v99' });
      expect(results).toHaveLength(0);
    });

    it('filters by availability', () => {
      registry.register(sampleProvider('alpha', { health: { available: false, ready: true } }));
      const results = discovery.findByOperation('test.read', { requireAvailable: true });
      expect(results).toHaveLength(0);
    });

    it('filters by readiness', () => {
      registry.register(sampleProvider('alpha', { health: { available: true, ready: false } }));
      const results = discovery.findByOperation('test.read', { requireReady: true });
      expect(results).toHaveLength(0);
    });

    it('returns empty array when no provider matches', () => {
      const results = discovery.findByOperation('nonexistent');
      expect(results).toHaveLength(0);
    });

    it('sorts by match score descending', () => {
      registry.register(sampleProvider('alpha', { lifecycle: 'REGISTERED', health: { available: false, ready: false } }));
      registry.register(sampleProvider('beta'));
      const results = discovery.findByOperation('test.read');
      expect(results).toHaveLength(2);
      expect(results[0].provider.identity.id).toBe('beta');
    });
  });

  describe('findEligible', () => {
    it('finds eligible providers with defaults', () => {
      registry.register(sampleProvider('alpha'));
      const results = discovery.findEligible();
      expect(results).toHaveLength(1);
    });

    it('excludes unavailable providers by default', () => {
      registry.register(sampleProvider('alpha', { health: { available: false, ready: true } }));
      expect(discovery.findEligible()).toHaveLength(0);
    });

    it('excludes unready providers by default', () => {
      registry.register(sampleProvider('alpha', { health: { available: true, ready: false } }));
      expect(discovery.findEligible()).toHaveLength(0);
    });

    it('returns empty when no providers registered', () => {
      expect(discovery.findEligible()).toHaveLength(0);
    });
  });

  describe('findCertified', () => {
    it('finds certified providers', () => {
      registry.register(sampleProvider('alpha', { lifecycle: 'REGISTERED' }));
      registry.register(sampleProvider('beta'));
      const results = discovery.findCertified();
      expect(results).toHaveLength(1);
      expect(results[0].provider.identity.id).toBe('beta');
    });

    it('filters by minimum certification level', () => {
      registry.register(sampleProvider('alpha', { certification: { ...sampleProvider('').certification, level: 'STAGE_3A' } }));
      registry.register(sampleProvider('beta', { certification: { ...sampleProvider('').certification, level: 'STAGE_3C' } }));
      const results = discovery.findCertified('STAGE_3B');
      expect(results).toHaveLength(1);
      expect(results[0].provider.identity.id).toBe('beta');
    });
  });

  describe('supportsOperation', () => {
    it('returns true when provider supports operation', () => {
      registry.register(sampleProvider('alpha'));
      expect(discovery.supportsOperation('alpha', 'test.read')).toBe(true);
    });

    it('returns false when provider does not support operation', () => {
      registry.register(sampleProvider('alpha'));
      expect(discovery.supportsOperation('alpha', 'unknown.op')).toBe(false);
    });

    it('returns false when provider is not registered', () => {
      expect(discovery.supportsOperation('unknown', 'test.read')).toBe(false);
    });
  });

  describe('resolve', () => {
    it('returns the best match for an operation', () => {
      registry.register(sampleProvider('alpha', { lifecycle: 'REGISTERED', health: { available: false, ready: false } }));
      registry.register(sampleProvider('beta'));
      const result = discovery.resolve('test.read');
      expect(result).toBeDefined();
      expect(result!.provider.identity.id).toBe('beta');
    });

    it('applies filters to resolution', () => {
      registry.register(sampleProvider('alpha'));
      const result = discovery.resolve('test.read', { minCertification: 'PRODUCTION' });
      expect(result).toBeUndefined();
    });

    it('returns undefined when no provider can resolve', () => {
      expect(discovery.resolve('nonexistent')).toBeUndefined();
    });

    it('returns the highest-scored provider', () => {
      registry.register(sampleProvider('alpha', { lifecycle: 'CERTIFIED' }));
      registry.register(sampleProvider('beta', { lifecycle: 'CERTIFIED', health: { available: false, ready: false } }));
      const result = discovery.resolve('test.read');
      expect(result).toBeDefined();
      expect(result!.provider.identity.id).toBe('alpha');
    });
  });

  describe('Google Calendar integration', () => {
    beforeEach(() => {
      registry = ProviderRegistryImpl.createWithDefaultProviders();
      discovery = new ProviderDiscoveryImpl(registry);
    });

    it('discovers Google Calendar by operation', () => {
      const results = discovery.findByOperation('events.list');
      expect(results).toHaveLength(1);
      expect(results[0].provider.identity.id).toBe('google-calendar');
    });

    it('resolves Google Calendar for calendar operations', () => {
      const result = discovery.resolve('events.insert');
      expect(result).toBeDefined();
      expect(result!.provider.identity.id).toBe('google-calendar');
    });

    it('Google Calendar is eligible', () => {
      const results = discovery.findEligible();
      expect(results.some((r) => r.provider.identity.id === 'google-calendar')).toBe(true);
    });

    it('Google Calendar supports all five operations', () => {
      for (const op of ['events.list', 'events.get', 'events.insert', 'events.update', 'events.delete']) {
        expect(discovery.supportsOperation('google-calendar', op)).toBe(true);
      }
    });
  });
});
