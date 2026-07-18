import { describe, it, expect, beforeEach } from 'vitest';
import { ProviderRegistration } from '../../lib/platform/execution/provider-registry';
import { ProviderRegistryImpl } from '../../lib/platform/execution/provider-registry-impl';
import { ProviderDiscoveryImpl } from '../../lib/platform/execution/provider-discovery-impl';
import { CapabilityResolverImpl } from '../../lib/platform/execution/capability-resolver-impl';

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
    metadata: { description: `Provider ${id}`, owner: 'Test', documentationRef: 'docs/test.md' },
    ...overrides,
  };
}

describe('CapabilityResolverImpl', () => {
  let registry: ProviderRegistryImpl;
  let resolver: CapabilityResolverImpl;

  function build(): void {
    const discovery = new ProviderDiscoveryImpl(registry);
    resolver = new CapabilityResolverImpl(discovery);
  }

  beforeEach(() => {
    registry = new ProviderRegistryImpl();
    build();
  });

  describe('resolve', () => {
    it('resolves a single provider for an operation', () => {
      registry.register(sampleProvider('alpha'));
      const result = resolver.resolve({ operation: 'test.read' });
      expect(result).toBeDefined();
      expect(result!.provider.identity.id).toBe('alpha');
      expect(result!.operation).toBe('test.read');
    });

    it('returns the highest-scored provider', () => {
      registry.register(sampleProvider('alpha', { lifecycle: 'REGISTERED', health: { available: false, ready: false } }));
      registry.register(sampleProvider('beta'));
      const result = resolver.resolve({ operation: 'test.read' });
      expect(result).toBeDefined();
      expect(result!.provider.identity.id).toBe('beta');
    });

    it('returns undefined when no provider supports the operation', () => {
      const result = resolver.resolve({ operation: 'unknown.op' });
      expect(result).toBeUndefined();
    });

    it('returns undefined when filters exclude all providers', () => {
      registry.register(sampleProvider('alpha'));
      const result = resolver.resolve({
        operation: 'test.read',
        options: { minCertification: 'PRODUCTION' },
      });
      expect(result).toBeUndefined();
    });

    it('applies health filters', () => {
      registry.register(sampleProvider('alpha', { health: { available: false, ready: false } }));
      const result = resolver.resolve({
        operation: 'test.read',
        options: { requireAvailable: true, requireReady: true },
      });
      expect(result).toBeUndefined();
    });

    it('resolves with contract version filter', () => {
      registry.register(sampleProvider('alpha'));
      const result = resolver.resolve({
        operation: 'test.read',
        options: { contractVersion: 'v1' },
      });
      expect(result).toBeDefined();
      expect(result!.provider.identity.id).toBe('alpha');
    });

    it('excludes when contract version does not match', () => {
      registry.register(sampleProvider('alpha'));
      const result = resolver.resolve({
        operation: 'test.read',
        options: { contractVersion: 'v99' },
      });
      expect(result).toBeUndefined();
    });
  });

  describe('explanation', () => {
    it('includes match score breakdown', () => {
      registry.register(sampleProvider('alpha'));
      const result = resolver.resolve({ operation: 'test.read' });
      expect(result!.explanation.rule).toBe('highest_match_score');
      expect(result!.explanation.breakdown.lifecycle).toBe(100);
      expect(result!.explanation.breakdown.health).toBe(75);
    });

    it('reflects health state in breakdown', () => {
      registry.register(sampleProvider('alpha', { health: { available: false, ready: false } }));
      const result = resolver.resolve({ operation: 'test.read' });
      expect(result!.explanation.breakdown.lifecycle).toBe(100);
      expect(result!.explanation.breakdown.health).toBe(0);
    });

    it('reflects lifecycle state in breakdown', () => {
      registry.register(sampleProvider('alpha', { lifecycle: 'REGISTERED' }));
      const result = resolver.resolve({ operation: 'test.read' });
      expect(result!.explanation.breakdown.lifecycle).toBe(0);
    });

    it('reports total candidates considered', () => {
      registry.register(sampleProvider('alpha'));
      registry.register(sampleProvider('beta'));
      const result = resolver.resolve({ operation: 'test.read' });
      expect(result!.explanation.totalCandidates).toBe(2);
    });

    it('reports applied filters', () => {
      registry.register(sampleProvider('alpha'));
      const result = resolver.resolve({
        operation: 'test.read',
        options: {
          minLifecycle: 'CERTIFIED',
          minCertification: 'STAGE_3B',
          requireAvailable: true,
        },
      });
      expect(result!.explanation.filters.lifecycle).toBe('CERTIFIED');
      expect(result!.explanation.filters.certification).toBe('STAGE_3B');
      expect(result!.explanation.filters.requireAvailable).toBe(true);
    });

    it('shows empty filters when no options provided', () => {
      registry.register(sampleProvider('alpha'));
      const result = resolver.resolve({ operation: 'test.read' });
      expect(result!.explanation.filters.lifecycle).toBeUndefined();
      expect(result!.explanation.filters.certification).toBeUndefined();
    });
  });

  describe('Google Calendar integration', () => {
    beforeEach(() => {
      registry = ProviderRegistryImpl.createWithDefaultProviders();
      build();
    });

    it('resolves Google Calendar for events.list', () => {
      const result = resolver.resolve({ operation: 'events.list' });
      expect(result).toBeDefined();
      expect(result!.provider.identity.id).toBe('google-calendar');
      expect(result!.explanation.totalCandidates).toBe(1);
    });

    it('resolves Google Calendar for all five operations', () => {
      for (const op of ['events.list', 'events.get', 'events.insert', 'events.update', 'events.delete']) {
        const result = resolver.resolve({ operation: op });
        expect(result).toBeDefined();
        expect(result!.provider.identity.id).toBe('google-calendar');
      }
    });

    it('explanation reflects certified lifecycle and available health', () => {
      const result = resolver.resolve({ operation: 'events.insert' });
      expect(result!.explanation.breakdown.lifecycle).toBe(100);
      expect(result!.explanation.breakdown.health).toBe(75);
      expect(result!.matchScore).toBe(175);
    });

    it('produces deterministic results', () => {
      const a = resolver.resolve({ operation: 'events.list' });
      const b = resolver.resolve({ operation: 'events.list' });
      expect(a!.matchScore).toBe(b!.matchScore);
      expect(a!.provider.identity.id).toBe(b!.provider.identity.id);
      expect(a!.explanation.breakdown.lifecycle).toBe(b!.explanation.breakdown.lifecycle);
    });
  });
});
