export type IdempotencyStatus = 'NOT_SEEN' | 'EXECUTING' | 'COMPLETED' | 'FAILED';

export interface IdempotencyEntry {
  idempotencyKey: string;
  status: IdempotencyStatus;
  executionId: string;
  operation: string;
  requestHash: string;
  result: Record<string, unknown> | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface IdempotencyCheckResult {
  status: IdempotencyStatus;
  isReplay: boolean;
  existingResult: Record<string, unknown> | null;
  existingError: string | null;
}

export interface IdempotencyService {
  put(key: string, entry: IdempotencyEntry): Promise<void>;

  get(key: string): Promise<IdempotencyEntry | null>;

  check(key: string): Promise<IdempotencyCheckResult>;

  complete(key: string, result: Record<string, unknown>): Promise<void>;

  fail(key: string, error: string): Promise<void>;

  cleanup(olderThan: string): Promise<number>;
}
