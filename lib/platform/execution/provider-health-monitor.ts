import { ProviderHealth } from "./provider-registry";

export type HealthEventType =
  | 'CHECK_PASSED'
  | 'CHECK_FAILED'
  | 'RECOVERED'
  | 'DEGRADED'
  | 'REGISTERED';

export interface ProviderHealthStatus {
  readonly providerId: string;
  readonly available: boolean;
  readonly ready: boolean;
  readonly lastChecked: string;
  readonly lastError: string | null;
  readonly successiveFailures: number;
  readonly latencyMs: number | null;
}

export interface ProviderHealthEvent {
  readonly timestamp: string;
  readonly providerId: string;
  readonly eventType: HealthEventType;
  readonly detail: string;
  readonly latencyMs: number | null;
}

export type HealthEventHandler = (event: ProviderHealthEvent) => void;

export interface ProviderHealthMonitor {
  check(providerId: string, baseline?: ProviderHealth): Promise<ProviderHealthStatus>;
  checkAll(): Promise<readonly ProviderHealthStatus[]>;
  getStatus(providerId: string): ProviderHealthStatus | undefined;
  getHistory(providerId: string): readonly ProviderHealthEvent[];
  subscribe(handler: HealthEventHandler): () => void;
}
