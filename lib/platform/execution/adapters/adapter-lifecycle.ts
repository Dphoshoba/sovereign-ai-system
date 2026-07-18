import { ProviderAdapter } from "./provider-adapter";

export type AdapterState =
  | 'CREATED'
  | 'INITIALIZED'
  | 'READY'
  | 'ACTIVE'
  | 'ERROR'
  | 'DISPOSED';

export const ADAPTER_STATE_TRANSITIONS: Record<AdapterState, AdapterState[]> = {
  CREATED: ['INITIALIZED', 'ERROR', 'DISPOSED'],
  INITIALIZED: ['READY', 'ERROR', 'DISPOSED'],
  READY: ['ACTIVE', 'ERROR', 'DISPOSED'],
  ACTIVE: ['READY', 'ERROR', 'DISPOSED'],
  ERROR: ['READY', 'DISPOSED'],
  DISPOSED: [],
};

export interface AdapterLifecycleEntry {
  adapterId: string;
  state: AdapterState;
  transitions: Array<{ from: AdapterState; to: AdapterState; timestamp: string }>;
}

export class AdapterLifecycle {
  private states = new Map<string, AdapterState>();
  private histories = new Map<string, AdapterLifecycleEntry>();

  getState(adapter: ProviderAdapter): AdapterState {
    return this.states.get(adapter.providerId) ?? 'CREATED';
  }

  getEntry(adapter: ProviderAdapter): AdapterLifecycleEntry | undefined {
    return this.histories.get(adapter.providerId);
  }

  getAllEntries(): AdapterLifecycleEntry[] {
    return Array.from(this.histories.values()).sort((a, b) =>
      a.adapterId.localeCompare(b.adapterId),
    );
  }

  transitionTo(adapter: ProviderAdapter, target: AdapterState): boolean {
    const current = this.getState(adapter);
    const allowed = ADAPTER_STATE_TRANSITIONS[current];

    if (!allowed.includes(target)) {
      return false;
    }

    const transition = {
      from: current,
      to: target,
      timestamp: '2026-01-01T00:00:00Z',
    };

    this.states.set(adapter.providerId, target);

    const existing = this.histories.get(adapter.providerId) ?? {
      adapterId: adapter.providerId,
      state: 'CREATED',
      transitions: [],
    };
    existing.state = target;
    existing.transitions.push(transition);
    this.histories.set(adapter.providerId, existing);

    return true;
  }

  reset(adapter: ProviderAdapter): void {
    this.states.set(adapter.providerId, 'CREATED');
    this.histories.set(adapter.providerId, {
      adapterId: adapter.providerId,
      state: 'CREATED',
      transitions: [],
    });
  }

  clear(): void {
    this.states.clear();
    this.histories.clear();
  }
}
