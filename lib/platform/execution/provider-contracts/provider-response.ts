export interface ProviderResponse {
  requestId: string;
  statusCode: number;
  headers: Record<string, string>;
  body: unknown | null;
  bodyFormat: 'json' | 'text' | 'binary' | 'none';
  etag: string | null;
  revisionId: string | null;
  receivedAt: string;
  durationMs: number;
  metadata: Record<string, string>;
}
