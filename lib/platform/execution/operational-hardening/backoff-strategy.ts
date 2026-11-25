export type BackoffAlgorithm = 'EXPONENTIAL' | 'LINEAR' | 'FIXED';

export interface BackoffConfig {
  algorithm: BackoffAlgorithm;
  baseDelayMs: number;
  maxDelayMs: number;
  jitterFactor: number;
  multiplier: number;
}

export const DEFAULT_BACKOFF: BackoffConfig = {
  algorithm: 'EXPONENTIAL',
  baseDelayMs: 1000,
  maxDelayMs: 60000,
  jitterFactor: 0.1,
  multiplier: 2,
};

export class BackoffStrategy {
  private config: BackoffConfig;

  constructor(config: Partial<BackoffConfig> = {}) {
    this.config = { ...DEFAULT_BACKOFF, ...config };
  }

  getConfig(): BackoffConfig {
    return { ...this.config };
  }

  computeDelay(attempt: number): number {
    const raw = this.computeRawDelay(attempt);
    const clamped = Math.min(raw, this.config.maxDelayMs);
    const jitter = this.computeJitter(clamped);
    return Math.round(clamped + jitter);
  }

  getMaxAttempts(_errorCode?: string): number {
    return 3;
  }

  shouldRetry(attempt: number, _errorCode?: string): boolean {
    return attempt < this.getMaxAttempts();
  }

  private computeRawDelay(attempt: number): number {
    switch (this.config.algorithm) {
      case 'EXPONENTIAL':
        return this.config.baseDelayMs * Math.pow(this.config.multiplier, attempt);
      case 'LINEAR':
        return this.config.baseDelayMs + (this.config.baseDelayMs * attempt);
      case 'FIXED':
        return this.config.baseDelayMs;
    }
  }

  private computeJitter(delay: number): number {
    if (this.config.jitterFactor <= 0) return 0;
    const maxJitter = Math.round(delay * this.config.jitterFactor);
    return Math.round((Math.random() - 0.5) * 2 * maxJitter);
  }
}
