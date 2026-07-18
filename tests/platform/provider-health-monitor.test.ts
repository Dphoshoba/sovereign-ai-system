import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProviderRegistryImpl } from '../../lib/platform/execution/provider-registry-impl';
import { ProviderHealthMonitorImpl } from '../../lib/platform/execution/provider-health-monitor-impl';

describe('ProviderHealthMonitorImpl', () => {
  let registry: ProviderRegistryImpl;
  let monitor: ProviderHealthMonitorImpl;

  beforeEach(() => {
    registry = ProviderRegistryImpl.createWithDefaultProviders();
    monitor = new ProviderHealthMonitorImpl(registry);
  });

  describe('check', () => {
    it('returns health status for a registered provider', async () => {
      const status = await monitor.check('google-calendar');
      expect(status.providerId).toBe('google-calendar');
      expect(status.available).toBe(true);
      expect(status.ready).toBe(true);
      expect(status.latencyMs).toBeGreaterThanOrEqual(0);
      expect(status.lastChecked).toBeDefined();
    });

    it('throws for unregistered provider', async () => {
      await expect(monitor.check('unknown')).rejects.toThrow(
        "Provider 'unknown' is not registered",
      );
    });

    it('tracks successive failures', async () => {
      await monitor.check('google-calendar', { available: false, ready: false });
      const s1 = monitor.getStatus('google-calendar')!;
      expect(s1.successiveFailures).toBe(1);

      await monitor.check('google-calendar', { available: false, ready: false });
      const s2 = monitor.getStatus('google-calendar')!;
      expect(s2.successiveFailures).toBe(2);
    });

    it('resets successive failures on recovery', async () => {
      await monitor.check('google-calendar', { available: false, ready: false });
      await monitor.check('google-calendar', { available: true, ready: true });
      const status = monitor.getStatus('google-calendar')!;
      expect(status.successiveFailures).toBe(0);
    });

    it('reports last error on failure', async () => {
      await monitor.check('google-calendar', { available: false, ready: false });
      const status = monitor.getStatus('google-calendar')!;
      expect(status.lastError).toBe('Provider unavailable');
    });

    it('reports null last error on success', async () => {
      await monitor.check('google-calendar');
      const status = monitor.getStatus('google-calendar')!;
      expect(status.lastError).toBeNull();
    });
  });

  describe('checkAll', () => {
    it('checks all registered providers', async () => {
      const results = await monitor.checkAll();
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some((r) => r.providerId === 'google-calendar')).toBe(true);
    });

    it('all results have required fields', async () => {
      const results = await monitor.checkAll();
      for (const r of results) {
        expect(r.lastChecked).toBeDefined();
        expect(r.latencyMs).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('getStatus', () => {
    it('returns undefined before first check', () => {
      expect(monitor.getStatus('google-calendar')).toBeUndefined();
    });

    it('returns status after check', async () => {
      await monitor.check('google-calendar');
      expect(monitor.getStatus('google-calendar')).toBeDefined();
    });
  });

  describe('getHistory', () => {
    it('returns empty array before any checks', () => {
      expect(monitor.getHistory('google-calendar')).toHaveLength(0);
    });

    it('records events after checks', async () => {
      await monitor.check('google-calendar');
      const history = monitor.getHistory('google-calendar');
      expect(history).toHaveLength(1);
      expect(history[0].eventType).toBe('CHECK_PASSED');
      expect(history[0].providerId).toBe('google-calendar');
    });

    it('records RECOVERED event when provider returns to health', async () => {
      await monitor.check('google-calendar', { available: false, ready: false });
      await monitor.check('google-calendar', { available: true, ready: true });
      const history = monitor.getHistory('google-calendar');
      expect(history.some((e) => e.eventType === 'RECOVERED')).toBe(true);
    });

    it('records DEGRADED event on first failure', async () => {
      await monitor.check('google-calendar', { available: false, ready: false });
      const history = monitor.getHistory('google-calendar');
      expect(history.some((e) => e.eventType === 'DEGRADED')).toBe(true);
    });
  });

  describe('subscribe', () => {
    it('notifies subscribers on health events', async () => {
      const handler = vi.fn();
      monitor.subscribe(handler);
      await monitor.check('google-calendar');
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          providerId: 'google-calendar',
          eventType: 'CHECK_PASSED',
        }),
      );
    });

    it('unsubscribe removes handler', async () => {
      const handler = vi.fn();
      const unsubscribe = monitor.subscribe(handler);
      unsubscribe();
      await monitor.check('google-calendar');
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('integration with registry', () => {
    it('uses provider health metadata from registry', async () => {
      const status = await monitor.check('google-calendar');
      expect(status.available).toBe(true);
      expect(status.ready).toBe(true);
    });

    it('reflects custom health baseline', async () => {
      const status = await monitor.check('google-calendar', { available: false, ready: true });
      expect(status.available).toBe(false);
      expect(status.ready).toBe(true);
      expect(status.lastError).toBe('Provider unavailable');
    });
  });
});
