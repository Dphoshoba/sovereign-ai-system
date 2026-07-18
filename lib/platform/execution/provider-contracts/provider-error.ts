export type ProviderErrorCategory = 'TRANSIENT' | 'PERMANENT' | 'AMBIGUOUS';

export type ProviderErrorCode =
  | 'NETWORK_TIMEOUT'
  | 'NETWORK_UNAVAILABLE'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INVALID_ARGUMENT'
  | 'QUOTA_EXCEEDED'
  | 'TIMEOUT_NO_RESPONSE'
  | 'SUCCESS_WITH_ERROR'
  | 'DUPLICATE_DETECTED'
  | 'UNKNOWN';

export interface ProviderErrorInfo {
  code: ProviderErrorCode;
  category: ProviderErrorCategory;
  retryable: boolean;
  statusCode: number | null;
  providerCode: string | null;
  providerMessage: string | null;
  retryAfterMs: number | null;
  details: Record<string, unknown>;
}

export interface ProviderErrorClassifier {
  classify(
    statusCode: number,
    errorBody: Record<string, unknown> | null,
    context: ErrorClassificationContext,
  ): ProviderErrorInfo;
}

export interface ErrorClassificationContext {
  executionId: string;
  operation: string;
  requestId: string;
  attemptNumber: number;
}

export const RETRYABLE_ERROR_CODES: readonly ProviderErrorCode[] = [
  'NETWORK_TIMEOUT',
  'NETWORK_UNAVAILABLE',
  'RATE_LIMITED',
  'SERVER_ERROR',
  'SERVICE_UNAVAILABLE',
] as const;

export const MAX_RETRIES: Record<ProviderErrorCode, number> = {
  NETWORK_TIMEOUT: 3,
  NETWORK_UNAVAILABLE: 2,
  RATE_LIMITED: 3,
  SERVER_ERROR: 3,
  SERVICE_UNAVAILABLE: 3,
  BAD_REQUEST: 0,
  UNAUTHORIZED: 0,
  FORBIDDEN: 0,
  NOT_FOUND: 0,
  CONFLICT: 0,
  INVALID_ARGUMENT: 0,
  QUOTA_EXCEEDED: 0,
  TIMEOUT_NO_RESPONSE: 0,
  SUCCESS_WITH_ERROR: 0,
  DUPLICATE_DETECTED: 0,
  UNKNOWN: 0,
};
