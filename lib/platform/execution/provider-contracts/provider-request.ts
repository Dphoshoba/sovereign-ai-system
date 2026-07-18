export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface ProviderRequest {
  requestId: string;
  executionId: string;
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  body: unknown | null;
  bodyFormat: 'json' | 'form' | 'binary' | 'text' | 'none';
  idempotencyKey: string | null;
  timeoutMs: number;
  retryAttempt: number;
  maxRetries: number;
  metadata: Record<string, string>;
}
