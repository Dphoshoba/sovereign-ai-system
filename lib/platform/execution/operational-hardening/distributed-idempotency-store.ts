import { IdempotencyService, IdempotencyEntry, IdempotencyCheckResult, IdempotencyStatus } from '../provider-contracts/idempotency-service';

export interface IdempotencyStoreConfig {
  ttlMs: number;
  cleanupIntervalMs: number;
}

export const DEFAULT_IDEMPOTENCY_CONFIG: IdempotencyStoreConfig = {
  ttlMs: 3600000,
  cleanupIntervalMs: 60000,
};

export class DistributedIdempotencyStore implements IdempotencyService {
  private store = new Map<string, IdempotencyEntry>();
  private config: IdempotencyStoreConfig;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<IdempotencyStoreConfig> = {}) {
    this.config = { ...DEFAULT_IDEMPOTENCY_CONFIG, ...config };
  }

  async put(key: string, entry: IdempotencyEntry): Promise<void> {
    this.store.set(key, { ...entry, updatedAt: new Date().toISOString() });
  }

  async get(key: string): Promise<IdempotencyEntry | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (new Date(entry.expiresAt) < new Date()) {
      this.store.delete(key);
      return null;
    }
    return { ...entry };
  }

  async check(key: string): Promise<IdempotencyCheckResult> {
    const entry = await this.get(key);
    if (!entry) {
      return { status: 'NOT_SEEN', isReplay: false, existingResult: null, existingError: null };
    }
    return {
      status: entry.status,
      isReplay: entry.status === 'COMPLETED' || entry.status === 'FAILED',
      existingResult: entry.result,
      existingError: entry.error,
    };
  }

  async complete(key: string, result: Record<string, unknown>): Promise<void> {
    const entry = this.store.get(key);
    if (entry) {
      entry.status = 'COMPLETED';
      entry.result = result;
      entry.updatedAt = new Date().toISOString();
    }
  }

  async fail(key: string, error: string): Promise<void> {
    const entry = this.store.get(key);
    if (entry) {
      entry.status = 'FAILED';
      entry.error = error;
      entry.updatedAt = new Date().toISOString();
    }
  }

  async cleanup(olderThan: string): Promise<number> {
    const cutoff = new Date(olderThan).getTime();
    let removed = 0;
    for (const [key, entry] of this.store.entries()) {
      if (new Date(entry.createdAt).getTime() < cutoff) {
        this.store.delete(key);
        removed++;
      }
    }
    return removed;
  }

  startCleanupTimer(): void {
    if (this.cleanupTimer) return;
    this.cleanupTimer = setInterval(() => {
      const cutoff = new Date(Date.now() - this.config.ttlMs).toISOString();
      this.cleanup(cutoff);
    }, this.config.cleanupIntervalMs);
  }

  stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  getEntryCount(): number {
    return this.store.size;
  }

  reset(): void {
    this.store.clear();
  }
}
