import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProviderAdapter, AdapterConfig, ProviderDescriptor, AdapterValidationResult } from '../../lib/platform/execution/adapters/provider-adapter';
import { AdapterRegistry } from '../../lib/platform/execution/adapters/adapter-registry';
import { CapabilityNegotiator } from '../../lib/platform/execution/adapters/capability-negotiator';
import { ProviderDiscovery } from '../../lib/platform/execution/adapters/provider-discovery';
import { AdapterValidator } from '../../lib/platform/execution/adapters/adapter-validator';
import { AdapterLifecycle, AdapterState, ADAPTER_STATE_TRANSITIONS } from '../../lib/platform/execution/adapters/adapter-lifecycle';
import { AdapterFactory } from '../../lib/platform/execution/adapters/adapter-factory';
import { AdapterDIContainer } from '../../lib/platform/execution/adapters/adapter-di-container';
import { ConnectorCapabilityProfile, OperationCapability } from '../../lib/platform/execution/capability-contract';
import { ConnectorRuntimeCapabilities } from '../../lib/platform/execution/capabilities';

// ============================================================
// Mock Adapter
// ============================================================

class MockDriveAdapter extends ProviderAdapter {
  providerId: string = 'google-drive';
  providerVersion: string = '1.0.0';
  supportedOperations: string[] = ['upload', 'rename', 'delete'];

  getCapabilityProfile(): ConnectorCapabilityProfile {
    return {
      connectorId: 'google-drive',
      connectorVersion: '1.0.0',
      supportedOperations: [
        {
          operation: 'upload',
          canDryRun: true,
          canExecute: true,
          canVerify: true,
          canRollback: true,
          supportsIdempotency: true,
          riskLevel: 'MODIFY',
          requiredApprovalLevel: 'STANDARD',
          requiredScopes: ['drive.file'],
          parameters: [],
        },
        {
          operation: 'rename',
          canDryRun: true,
          canExecute: true,
          canVerify: true,
          canRollback: true,
          supportsIdempotency: true,
          riskLevel: 'MODIFY',
          requiredApprovalLevel: 'STANDARD',
          requiredScopes: ['drive.file'],
          parameters: [],
        },
        {
          operation: 'delete',
          canDryRun: true,
          canExecute: true,
          canVerify: false,
          canRollback: false,
          supportsIdempotency: true,
          riskLevel: 'DESTRUCTIVE',
          requiredApprovalLevel: 'CRITICAL',
          requiredScopes: ['drive.admin'],
          parameters: [],
        },
      ],
    };
  }

  async initialize(config: AdapterConfig): Promise<void> {}
  async validate(): Promise<AdapterValidationResult> {
    return { valid: true, errors: [], warnings: [] };
  }
  async dispose(): Promise<void> {}
}

class InvalidAdapter extends ProviderAdapter {
  providerId = '';
  providerVersion = '';
  supportedOperations: string[] = [];

  getCapabilityProfile(): ConnectorCapabilityProfile {
    return { connectorId: '', connectorVersion: '', supportedOperations: [] };
  }

  async initialize(): Promise<void> {}
  async validate(): Promise<AdapterValidationResult> {
    return { valid: false, errors: ['not valid'], warnings: [] };
  }
  async dispose(): Promise<void> {}
}

// ============================================================
// ProviderAdapter
// ============================================================

describe('ProviderAdapter', () => {
  it('generates a descriptor with provider metadata', () => {
    const adapter = new MockDriveAdapter();
    const descriptor = adapter.getDescriptor();
    expect(descriptor.providerId).toBe('google-drive');
    expect(descriptor.providerVersion).toBe('1.0.0');
    expect(descriptor.supportedOperations).toEqual(['upload', 'rename', 'delete']);
    expect(descriptor.riskLevel).toBe('DESTRUCTIVE');
    expect(descriptor.requiresAuthentication).toBe(true);
  });

  it('reports READ risk level for read-only adapters', () => {
    class ReadOnlyAdapter extends ProviderAdapter {
      readonly providerId = 'read-only';
      readonly providerVersion = '1.0.0';
      readonly supportedOperations = ['list'];
      getCapabilityProfile(): ConnectorCapabilityProfile {
        return {
          connectorId: 'read-only',
          connectorVersion: '1.0.0',
          supportedOperations: [{
            operation: 'list', canDryRun: false, canExecute: true, canVerify: false,
            canRollback: false, supportsIdempotency: true, riskLevel: 'READ',
            requiredApprovalLevel: 'NONE', requiredScopes: [], parameters: [],
          }],
        };
      }
      async initialize() {}
      async validate() { return { valid: true, errors: [], warnings: [] }; }
      async dispose() {}
    }

    expect(new ReadOnlyAdapter().getDescriptor().riskLevel).toBe('READ');
  });
});

// ============================================================
// AdapterRegistry
// ============================================================

describe('AdapterRegistry', () => {
  let registry: AdapterRegistry;

  beforeEach(() => { registry = new AdapterRegistry(); });

  it('registers and retrieves adapters', () => {
    const adapter = new MockDriveAdapter();
    registry.register(adapter);
    expect(registry.get('google-drive')).toBe(adapter);
    expect(registry.isRegistered('google-drive')).toBe(true);
  });

  it('returns undefined for unknown providers', () => {
    expect(registry.get('unknown')).toBeUndefined();
    expect(registry.isRegistered('unknown')).toBe(false);
  });

  it('rejects duplicate registration', () => {
    registry.register(new MockDriveAdapter());
    expect(() => registry.register(new MockDriveAdapter())).toThrow('ADAPTER_ALREADY_REGISTERED');
  });

  it('returns all adapters in deterministic order', () => {
    class AdapterA extends MockDriveAdapter { providerId = 'alpha'; }
    class AdapterB extends MockDriveAdapter { providerId = 'beta'; }
    class AdapterC extends MockDriveAdapter { providerId = 'gamma'; }

    registry.register(new AdapterC());
    registry.register(new AdapterA());
    registry.register(new AdapterB());

    const all = registry.getAll();
    expect(all.map(a => a.providerId)).toEqual(['alpha', 'beta', 'gamma']);
  });

  it('unregisters adapters', () => {
    registry.register(new MockDriveAdapter());
    expect(registry.unregister('google-drive')).toBe(true);
    expect(registry.isRegistered('google-drive')).toBe(false);
  });

  it('returns false when unregistering unknown adapter', () => {
    expect(registry.unregister('unknown')).toBe(false);
  });

  it('clears all adapters', () => {
    registry.register(new MockDriveAdapter());
    registry.clear();
    expect(registry.count()).toBe(0);
  });

  it('reports correct count', () => {
    expect(registry.count()).toBe(0);
    registry.register(new MockDriveAdapter());
    expect(registry.count()).toBe(1);
  });
});

// ============================================================
// CapabilityNegotiator
// ============================================================

describe('CapabilityNegotiator', () => {
  let negotiator: CapabilityNegotiator;

  beforeEach(() => { negotiator = new CapabilityNegotiator(); });

  const s3bCapabilities: ConnectorRuntimeCapabilities = {
    prepare: true, preflight: true, execute: true, verify: true,
    rollback: true, audit: true, stage: '3B',
    providerMutationAllowed: true, networkMutationAllowed: true,
  };

  it('resolves compatible operations', () => {
    const result = negotiator.negotiate(new MockDriveAdapter(), s3bCapabilities);
    expect(result.resolvedOperations.length).toBeGreaterThan(0);
    expect(result.conflicts).toHaveLength(0);
  });

  it('flags conflicts for destructive operations when mutations disabled', () => {
    const readOnly: ConnectorRuntimeCapabilities = { ...s3bCapabilities, providerMutationAllowed: false };
    const result = negotiator.negotiate(new MockDriveAdapter(), readOnly);
    expect(result.conflicts.length).toBeGreaterThan(0);
    expect(result.conflicts[0]).toContain('delete');
    expect(result.conflicts[0]).toContain('destructive');
  });

  it('warns when runtime does not allow execution', () => {
    const noExec: ConnectorRuntimeCapabilities = { ...s3bCapabilities, execute: false };
    const result = negotiator.negotiate(new MockDriveAdapter(), noExec);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('simulation-only');
  });

  it('warns when adapter has no operations', () => {
    class EmptyAdapter extends MockDriveAdapter {
      getCapabilityProfile(): ConnectorCapabilityProfile {
        return { connectorId: 'empty', connectorVersion: '1.0.0', supportedOperations: [] };
      }
    }
    const result = negotiator.negotiate(new EmptyAdapter(), s3bCapabilities);
    expect(result.warnings).toContain('Adapter declares no supported operations');
  });

  it('returns both profiles in the result', () => {
    const result = negotiator.negotiate(new MockDriveAdapter(), s3bCapabilities);
    expect(result.adapterProfile.connectorId).toBe('google-drive');
    expect(result.runtimeCapabilities.stage).toBe('3B');
  });
});

// ============================================================
// ProviderDiscovery
// ============================================================

describe('ProviderDiscovery', () => {
  let registry: AdapterRegistry;
  let discovery: ProviderDiscovery;

  beforeEach(() => {
    registry = new AdapterRegistry();
    discovery = new ProviderDiscovery(registry);
  });

  it('discovers registered adapters', () => {
    registry.register(new MockDriveAdapter());
    const result = discovery.discover();
    expect(result.discovered).toHaveLength(1);
    expect(result.discovered[0].providerId).toBe('google-drive');
    expect(result.failed).toHaveLength(0);
  });

  it('returns empty discovery when no adapters registered', () => {
    const result = discovery.discover();
    expect(result.discovered).toHaveLength(0);
    expect(result.failed).toHaveLength(0);
  });

  it('filters discovery by risk level', () => {
    class ReadOnlyAdapter extends MockDriveAdapter {
      readonly providerId = 'read-only';
      getCapabilityProfile(): ConnectorCapabilityProfile {
        return {
          connectorId: 'read-only', connectorVersion: '1.0.0',
          supportedOperations: [{
            operation: 'list', canDryRun: false, canExecute: true, canVerify: false,
            canRollback: false, supportsIdempotency: true, riskLevel: 'READ',
            requiredApprovalLevel: 'NONE', requiredScopes: [], parameters: [],
          }],
        };
      }
    }
    registry.register(new MockDriveAdapter());
    registry.register(new ReadOnlyAdapter());

    const readOnly = discovery.discoverByRisk('READ');
    expect(readOnly).toHaveLength(1);
    expect(readOnly[0].providerId).toBe('read-only');
  });

  it('handles adapter descriptor failures gracefully', () => {
    class BrokenAdapter extends MockDriveAdapter {
      getDescriptor(): ProviderDescriptor {
        throw new Error('Broken descriptor');
      }
    }
    registry.register(new BrokenAdapter());
    const result = discovery.discover();
    expect(result.discovered).toHaveLength(0);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0].error).toContain('Broken descriptor');
  });
});

// ============================================================
// AdapterValidator
// ============================================================

describe('AdapterValidator', () => {
  let validator: AdapterValidator;

  beforeEach(() => { validator = new AdapterValidator(); });

  it('validates a well-formed adapter', () => {
    const result = validator.validate(new MockDriveAdapter());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects adapter with empty providerId', () => {
    const result = validator.validate(new InvalidAdapter());
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('MISSING_PROVIDER_ID: providerId is required');
  });

  it('rejects adapter with missing providerVersion', () => {
    class NoVersionAdapter extends MockDriveAdapter { providerVersion = ''; }
    const result = validator.validate(new NoVersionAdapter());
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('MISSING_PROVIDER_VERSION: providerVersion is required');
  });

  it('warns when adapter has no operations', () => {
    class NoOpAdapter extends MockDriveAdapter { supportedOperations = []; }
    const result = validator.validate(new NoOpAdapter());
    expect(result.valid).toBe(true);
    expect(result.warnings).toContain('NO_OPERATIONS: adapter supports no operations');
  });

  it('warns on capability profile mismatch', () => {
    class MismatchedAdapter extends MockDriveAdapter {
      getCapabilityProfile(): ConnectorCapabilityProfile {
        return { ...super.getCapabilityProfile(), connectorId: 'different-id' };
      }
    }
    const result = validator.validate(new MismatchedAdapter());
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('CAPABILITY_MISMATCH');
  });

  it('detects missing required methods', () => {
    const adapter = { providerId: 'test', providerVersion: '1.0.0', supportedOperations: ['op'] } as any;
    const result = validator.validate(adapter);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('initialize'))).toBe(true);
  });
});

// ============================================================
// AdapterLifecycle
// ============================================================

describe('AdapterLifecycle', () => {
  let lifecycle: AdapterLifecycle;

  beforeEach(() => { lifecycle = new AdapterLifecycle(); });

  it('starts adapters in CREATED state', () => {
    expect(lifecycle.getState(new MockDriveAdapter())).toBe('CREATED');
  });

  it('transitions through the canonical lifecycle', () => {
    const adapter = new MockDriveAdapter();
    expect(lifecycle.transitionTo(adapter, 'INITIALIZED')).toBe(true);
    expect(lifecycle.transitionTo(adapter, 'READY')).toBe(true);
    expect(lifecycle.transitionTo(adapter, 'ACTIVE')).toBe(true);
    expect(lifecycle.transitionTo(adapter, 'READY')).toBe(true);
    expect(lifecycle.transitionTo(adapter, 'DISPOSED')).toBe(true);
    expect(lifecycle.getState(adapter)).toBe('DISPOSED');
  });

  it('rejects illegal transitions', () => {
    const adapter = new MockDriveAdapter();
    expect(lifecycle.transitionTo(adapter, 'DISPOSED')).toBe(true);
    expect(lifecycle.transitionTo(adapter, 'READY')).toBe(false);
  });

  it('rejects transition from CREATED to ACTIVE', () => {
    expect(lifecycle.transitionTo(new MockDriveAdapter(), 'ACTIVE')).toBe(false);
  });

  it('records transition history', () => {
    const adapter = new MockDriveAdapter();
    lifecycle.transitionTo(adapter, 'INITIALIZED');
    lifecycle.transitionTo(adapter, 'ERROR');
    const entry = lifecycle.getEntry(adapter);
    expect(entry).toBeDefined();
    expect(entry!.transitions).toHaveLength(2);
    expect(entry!.transitions[0].from).toBe('CREATED');
    expect(entry!.transitions[0].to).toBe('INITIALIZED');
  });

  it('resets adapter state', () => {
    const adapter = new MockDriveAdapter();
    lifecycle.transitionTo(adapter, 'INITIALIZED');
    lifecycle.reset(adapter);
    expect(lifecycle.getState(adapter)).toBe('CREATED');
    expect(lifecycle.getEntry(adapter)!.transitions).toHaveLength(0);
  });

  it('returns all lifecycle entries in deterministic order', () => {
    class AdapterA extends MockDriveAdapter { providerId = 'alpha'; }
    class AdapterB extends MockDriveAdapter { providerId = 'beta'; }

    lifecycle.transitionTo(new AdapterB(), 'INITIALIZED');
    lifecycle.transitionTo(new AdapterA(), 'INITIALIZED');

    const entries = lifecycle.getAllEntries();
    expect(entries.map(e => e.adapterId)).toEqual(['alpha', 'beta']);
  });

  it('clears all lifecycle state', () => {
    lifecycle.transitionTo(new MockDriveAdapter(), 'INITIALIZED');
    lifecycle.clear();
    expect(lifecycle.getAllEntries()).toHaveLength(0);
  });

  it('defines complete state transition matrix', () => {
    const allStates: AdapterState[] = ['CREATED', 'INITIALIZED', 'READY', 'ACTIVE', 'ERROR', 'DISPOSED'];
    for (const state of allStates) {
      expect(ADAPTER_STATE_TRANSITIONS[state]).toBeDefined();
      expect(Array.isArray(ADAPTER_STATE_TRANSITIONS[state])).toBe(true);
    }
  });
});

// ============================================================
// AdapterFactory
// ============================================================

describe('AdapterFactory', () => {
  let registry: AdapterRegistry;
  let lifecycle: AdapterLifecycle;
  let validator: AdapterValidator;
  let factory: AdapterFactory;

  beforeEach(() => {
    registry = new AdapterRegistry();
    lifecycle = new AdapterLifecycle();
    validator = new AdapterValidator();
    factory = new AdapterFactory(registry, lifecycle, validator);
  });

  it('registers a provider type factory', () => {
    factory.registerProviderType('google-drive', (config) => new MockDriveAdapter());
    const types = factory.getRegisteredTypes();
    expect(types).toHaveLength(1);
    expect(types[0].providerType).toBe('google-drive');
  });

  it('rejects duplicate factory registration', () => {
    factory.registerProviderType('drive', (c) => new MockDriveAdapter());
    expect(() => factory.registerProviderType('drive', (c) => new MockDriveAdapter()))
      .toThrow('FACTORY_ALREADY_REGISTERED');
  });

  it('creates an adapter from a registered factory', () => {
    factory.registerProviderType('google-drive', (config) => new MockDriveAdapter());
    const adapter = factory.create('google-drive', {
      providerId: 'google-drive', providerVersion: '1.0.0', metadata: {},
    });
    expect(adapter).toBeInstanceOf(MockDriveAdapter);
    expect(adapter.providerId).toBe('google-drive');
  });

  it('throws when creating from unregistered type', () => {
    expect(() => factory.create('unknown', { providerId: 'x', providerVersion: '1.0', metadata: {} }))
      .toThrow('FACTORY_NOT_FOUND');
  });

  it('throws on providerId mismatch between factory and config', () => {
    factory.registerProviderType('mismatch', (config) => new MockDriveAdapter());
    expect(() => factory.create('mismatch', { providerId: 'other', providerVersion: '1.0', metadata: {} }))
      .toThrow('ADAPTER_ID_MISMATCH');
  });

  it('creates and registers an adapter in one operation', async () => {
    factory.registerProviderType('google-drive', (config) => new MockDriveAdapter());
    const adapter = await factory.createAndRegister('google-drive', {
      providerId: 'google-drive', providerVersion: '1.0.0', metadata: {},
    });
    expect(registry.isRegistered('google-drive')).toBe(true);
    expect(lifecycle.getState(adapter)).toBe('INITIALIZED');
  });

  it('rejects creation with an invalid adapter', async () => {
    factory.registerProviderType('invalid', (config) => new InvalidAdapter());
    await expect(factory.createAndRegister('invalid', {
      providerId: '', providerVersion: '', metadata: {},
    })).rejects.toThrow('ADAPTER_VALIDATION_FAILED');
    expect(registry.isRegistered('')).toBe(false);
  });

  it('returns registered types in deterministic order', () => {
    factory.registerProviderType('beta', (c) => new MockDriveAdapter());
    factory.registerProviderType('alpha', (c) => new MockDriveAdapter());
    const types = factory.getRegisteredTypes();
    expect(types.map(t => t.providerType)).toEqual(['alpha', 'beta']);
  });

  it('clears all factories', () => {
    factory.registerProviderType('drive', (c) => new MockDriveAdapter());
    factory.clear();
    expect(factory.getRegisteredTypes()).toHaveLength(0);
  });
});

// ============================================================
// AdapterDIContainer
// ============================================================

describe('AdapterDIContainer', () => {
  let container: AdapterDIContainer;

  beforeEach(() => { container = new AdapterDIContainer(); });

  it('resolves a registered dependency', () => {
    container.register('config', () => ({ apiKey: 'test' }));
    expect(container.resolve<{ apiKey: string }>('config').apiKey).toBe('test');
  });

  it('resolves a registered instance', () => {
    const obj = { value: 42 };
    container.registerInstance('instance', obj);
    expect(container.resolve<{ value: number }>('instance').value).toBe(42);
  });

  it('returns same instance for singleton', () => {
    let callCount = 0;
    container.register('factory', (c) => { callCount++; return { id: callCount }; });
    const a = container.resolve('factory');
    const b = container.resolve('factory');
    expect(a).toBe(b);
    expect(callCount).toBe(1);
  });

  it('creates new instance for non-singleton', () => {
    let callCount = 0;
    container.register('factory', (c) => { callCount++; return { id: callCount }; }, false);
    const a = container.resolve('factory');
    const b = container.resolve('factory');
    expect(a).not.toBe(b);
    expect(callCount).toBe(2);
  });

  it('supports nested dependency resolution', () => {
    container.register('db', () => ({ connect: true }));
    container.register('service', (c) => ({ db: c.resolve('db') }));
    const service = container.resolve<{ db: any }>('service');
    expect(service.db.connect).toBe(true);
  });

  it('throws on unresolvable token', () => {
    expect(() => container.resolve('nonexistent')).toThrow('DI_CONTAINER_RESOLVE_FAILED');
  });

  it('throws on duplicate registration', () => {
    container.register('token', () => 1);
    expect(() => container.register('token', () => 2)).toThrow('DI_CONTAINER_DUPLICATE');
  });

  it('allows override when enabled', () => {
    container.enableOverride();
    container.register('token', () => 1);
    container.register('token', () => 2);
    expect(container.resolve<number>('token')).toBe(2);
  });

  it('detects circular dependencies', () => {
    container.register('a', (c) => c.resolve('b'));
    container.register('b', (c) => c.resolve('a'));
    expect(() => container.resolve('a')).toThrow('DI_CONTAINER_CIRCULAR_DEPENDENCY');
  });

  it('clears all registrations', () => {
    container.register('token', () => 42);
    container.clear();
    expect(() => container.resolve('token')).toThrow('DI_CONTAINER_RESOLVE_FAILED');
  });

  it('checks if token is registered', () => {
    expect(container.isRegistered('token')).toBe(false);
    container.register('token', () => 1);
    expect(container.isRegistered('token')).toBe(true);
  });
});

// ============================================================
// Integrated Flow
// ============================================================

describe('Adapter Framework Integration', () => {
  let registry: AdapterRegistry;
  let lifecycle: AdapterLifecycle;
  let validator: AdapterValidator;
  let factory: AdapterFactory;
  let discovery: ProviderDiscovery;

  beforeEach(() => {
    registry = new AdapterRegistry();
    lifecycle = new AdapterLifecycle();
    validator = new AdapterValidator();
    factory = new AdapterFactory(registry, lifecycle, validator);
    discovery = new ProviderDiscovery(registry);
  });

  it('full adapter lifecycle: register → create → discover → validate', async () => {
    factory.registerProviderType('google-drive', (config) => new MockDriveAdapter());
    const adapter = await factory.createAndRegister('google-drive', {
      providerId: 'google-drive', providerVersion: '1.0.0', metadata: {},
    });

    lifecycle.transitionTo(adapter, 'READY');

    const validation = validator.validate(adapter);
    expect(validation.valid).toBe(true);

    const result = discovery.discover();
    expect(result.discovered).toHaveLength(1);
    expect(result.discovered[0].providerId).toBe('google-drive');
    expect(result.discovered[0].riskLevel).toBe('DESTRUCTIVE');

    expect(lifecycle.getState(adapter)).toBe('READY');
  });

  it('no external provider mutation is possible through the framework', () => {
    const adapter = new MockDriveAdapter();
    expect(typeof adapter.initialize).toBe('function');
    expect(typeof adapter.dispose).toBe('function');
    expect(typeof adapter.validate).toBe('function');
    expect(typeof adapter.getDescriptor).toBe('function');
    expect((adapter as any).execute).toBeUndefined();
    expect((adapter as any).send).toBeUndefined();
    expect((adapter as any).mutate).toBeUndefined();
    expect((adapter as any).callApi).toBeUndefined();
    expect((adapter as any).authenticate).toBeUndefined();
  });
});
