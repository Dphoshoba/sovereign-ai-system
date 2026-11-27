import { describe, it, expect, beforeEach } from 'vitest';
import { ProviderRegistration } from '../../lib/platform/execution/provider-registry';
import { ProviderRegistryImpl, ProviderRegistryError } from '../../lib/platform/execution/provider-registry-impl';

function sampleRegistration(overrides?: Partial<ProviderRegistration>): ProviderRegistration {
  return {
    identity: { id: 'test-provider', name: 'Test Provider', version: '1.0.0' },
    lifecycle: 'CERTIFIED',
    capabilities: [
      { operation: 'test.read', contractVersion: 'v1' },
      { operation: 'test.write', contractVersion: 'v1' },
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
      description: 'Test provider for unit tests',
      owner: 'Test Team',
      documentationRef: 'docs/test.md',
    },
    ...overrides,
  };
}

describe('ProviderRegistryImpl', () => {
  let registry: ProviderRegistryImpl;

  beforeEach(() => {
    registry = new ProviderRegistryImpl();
  });

  describe('register', () => {
    it('registers a provider', () => {
      const entry = sampleRegistration();
      registry.register(entry);
      expect(registry.isRegistered('test-provider')).toBe(true);
    });

    it('throws on duplicate registration', () => {
      registry.register(sampleRegistration());
      expect(() => registry.register(sampleRegistration())).toThrow(ProviderRegistryError);
      expect(() => registry.register(sampleRegistration())).toThrow(
        "Provider 'test-provider' is already registered",
      );
    });
  });

  describe('unregister', () => {
    it('unregisters a provider', () => {
      registry.register(sampleRegistration());
      registry.unregister('test-provider');
      expect(registry.isRegistered('test-provider')).toBe(false);
    });

    it('throws when unregistering a non-existent provider', () => {
      expect(() => registry.unregister('nonexistent')).toThrow(ProviderRegistryError);
      expect(() => registry.unregister('nonexistent')).toThrow(
        "Provider 'nonexistent' is not registered",
      );
    });
  });

  describe('get', () => {
    it('returns a registered provider', () => {
      registry.register(sampleRegistration());
      const entry = registry.get('test-provider');
      expect(entry).toBeDefined();
      expect(entry!.identity.id).toBe('test-provider');
    });

    it('returns undefined for unknown provider', () => {
      expect(registry.get('unknown')).toBeUndefined();
    });
  });

  describe('findByOperation', () => {
    it('finds providers by operation', () => {
      registry.register(sampleRegistration());
      const results = registry.findByOperation('test.read');
      expect(results).toHaveLength(1);
      expect(results[0].identity.id).toBe('test-provider');
    });

    it('returns empty array when no provider supports the operation', () => {
      registry.register(sampleRegistration());
      const results = registry.findByOperation('nonexistent.operation');
      expect(results).toHaveLength(0);
    });

    it('returns providers sorted by ID', () => {
      registry.register(sampleRegistration({ identity: { id: 'b-provider', name: 'B', version: '1.0.0' } }));
      registry.register(sampleRegistration({ identity: { id: 'a-provider', name: 'A', version: '1.0.0' } }));
      const results = registry.findByOperation('test.read');
      expect(results).toHaveLength(2);
      expect(results[0].identity.id).toBe('a-provider');
      expect(results[1].identity.id).toBe('b-provider');
    });
  });

  describe('findByLifecycle', () => {
    it('finds providers by lifecycle status', () => {
      registry.register(sampleRegistration());
      const certified = registry.findByLifecycle('CERTIFIED');
      expect(certified).toHaveLength(1);
      expect(certified[0].identity.id).toBe('test-provider');
    });

    it('returns empty array when no provider matches', () => {
      registry.register(sampleRegistration());
      const retired = registry.findByLifecycle('RETIRED');
      expect(retired).toHaveLength(0);
    });
  });

  describe('findByCapability', () => {
    it('finds providers by contract version', () => {
      registry.register(sampleRegistration());
      const results = registry.findByCapability('v1');
      expect(results).toHaveLength(1);
      expect(results[0].identity.id).toBe('test-provider');
    });

    it('returns empty array when no provider supports the version', () => {
      registry.register(sampleRegistration());
      const results = registry.findByCapability('v99');
      expect(results).toHaveLength(0);
    });
  });

  describe('list', () => {
    it('returns all registered providers sorted by ID', () => {
      registry.register(sampleRegistration({ identity: { id: 'z-provider', name: 'Z', version: '1.0.0' } }));
      registry.register(sampleRegistration({ identity: { id: 'a-provider', name: 'A', version: '1.0.0' } }));
      const all = registry.list();
      expect(all).toHaveLength(2);
      expect(all[0].identity.id).toBe('a-provider');
      expect(all[1].identity.id).toBe('z-provider');
    });

    it('returns empty array when no providers are registered', () => {
      expect(registry.list()).toHaveLength(0);
    });
  });

  describe('isRegistered', () => {
    it('returns true for registered provider', () => {
      registry.register(sampleRegistration());
      expect(registry.isRegistered('test-provider')).toBe(true);
    });

    it('returns false for unregistered provider', () => {
      expect(registry.isRegistered('unknown')).toBe(false);
    });
  });

  describe('createWithDefaultProviders', () => {
    it('creates a registry with Google Calendar pre-registered', () => {
      const reg = ProviderRegistryImpl.createWithDefaultProviders();
      const gc = reg.get('google-calendar');
      expect(gc).toBeDefined();
      expect(gc!.identity.name).toBe('Google Calendar');
      expect(gc!.lifecycle).toBe('CERTIFIED');
      expect(gc!.certification.governanceDecision).toBe('GOV-2026-PhaseIII-001');
      expect(gc!.certification.level).toBe('STAGE_3C');
      expect(gc!.capabilities).toHaveLength(5);
      expect(gc!.capabilities.map((c) => c.operation)).toEqual([
        'events.list', 'events.get', 'events.insert',
        'events.update', 'events.delete',
      ]);
    });

    it('supports lookup by operation for default Google Calendar', () => {
      const reg = ProviderRegistryImpl.createWithDefaultProviders();
      const results = reg.findByOperation('events.insert');
      expect(results).toHaveLength(1);
      expect(results[0].identity.id).toBe('google-calendar');
    });

    it('registers Google Calendar as available and ready', () => {
      const reg = ProviderRegistryImpl.createWithDefaultProviders();
      const gc = reg.get('google-calendar')!;
      expect(gc.health.available).toBe(true);
      expect(gc.health.ready).toBe(true);
      expect(gc.policy.sandboxSupported).toBe(true);
      expect(gc.policy.writeOperations).toBe(true);
    });
  });

  describe('immutability', () => {
    it('registration returned from get should not be affected by subsequent operations', () => {
      registry.register(sampleRegistration());
      const entry = registry.get('test-provider')!;
      registry.unregister('test-provider');
      expect(entry.identity.id).toBe('test-provider');
    });
  });
});
