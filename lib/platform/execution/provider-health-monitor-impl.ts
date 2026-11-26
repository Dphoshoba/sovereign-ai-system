import { ProviderHealth } from "./provider-registry";
import { ProviderRegistry } from "./provider-registry";
import {
  HealthEventType,
  HealthEventHandler,
  ProviderHealthEvent,
  ProviderHealthMonitor,
  ProviderHealthStatus,
} from "./provider-health-monitor";

const MAX_HISTORY = 100;

export class ProviderHealthMonitorImpl implements ProviderHealthMonitor {
  private readonly statuses = new Map<string, ProviderHealthStatus>();
  private readonly histories = new Map<string, ProviderHealthEvent[]>();
  private readonly subscribers = new Set<HealthEventHandler>();

  constructor(private readonly registry: ProviderRegistry) {}

  async check(providerId: string, baseline?: ProviderHealth): Promise<ProviderHealthStatus> {
    const provider = this.registry.get(providerId);
    if (!provider) {
      throw new Error(`Provider '${providerId}' is not registered`);
    }

    const health = baseline ?? provider.health;
    const startTime = Date.now();
    const current = this.statuses.get(providerId);
    const wasAvailable = current?.available ?? true;
    const wasReady = current?.ready ?? true;

    const available = health.available;
    const ready = health.ready;
    const latencyMs = Date.now() - startTime;

    let eventType: HealthEventType;
    let detail: string;

    if (available && ready) {
      if (!wasAvailable || !wasReady) {
        eventType = 'RECOVERED';
        detail = 'Provider recovered';
      } else {
        eventType = 'CHECK_PASSED';
        detail = 'Health check passed';
      }
    } else {
      if (wasAvailable && wasReady) {
        eventType = 'DEGRADED';
        detail = available ? 'Provider not ready' : 'Provider unavailable';
      } else {
        eventType = 'CHECK_FAILED';
        detail = available ? 'Provider not ready' : 'Provider unavailable';
      }
    }

    const successiveFailures = available && ready
      ? 0
      : (current?.successiveFailures ?? 0) + 1;

    const status: ProviderHealthStatus = {
      providerId,
      available,
      ready,
      lastChecked: new Date().toISOString(),
      lastError: available && ready ? null : detail,
      successiveFailures,
      latencyMs,
    };

    this.statuses.set(providerId, status);
    this.recordEvent(providerId, eventType, detail, latencyMs);

    return status;
  }

  async checkAll(): Promise<readonly ProviderHealthStatus[]> {
    const results: ProviderHealthStatus[] = [];
    for (const provider of this.registry.list()) {
      const status = await this.check(provider.identity.id, provider.health);
      results.push(status);
    }
    return results;
  }

  getStatus(providerId: string): ProviderHealthStatus | undefined {
    return this.statuses.get(providerId);
  }

  getHistory(providerId: string): readonly ProviderHealthEvent[] {
    return this.histories.get(providerId) ?? [];
  }

  subscribe(handler: HealthEventHandler): () => void {
    this.subscribers.add(handler);
    return () => this.subscribers.delete(handler);
  }

  private recordEvent(
    providerId: string,
    eventType: HealthEventType,
    detail: string,
    latencyMs: number | null,
  ): void {
    const event: ProviderHealthEvent = {
      timestamp: new Date().toISOString(),
      providerId,
      eventType,
      detail,
      latencyMs,
    };

    let history = this.histories.get(providerId);
    if (!history) {
      history = [];
      this.histories.set(providerId, history);
    }
    history.push(event);
    if (history.length > MAX_HISTORY) {
      history.shift();
    }

    for (const handler of this.subscribers) {
      handler(event);
    }
  }
}
