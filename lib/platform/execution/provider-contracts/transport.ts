import { ProviderRequest } from './provider-request';
import { ProviderResponse } from './provider-response';

export type TransportProtocol = 'HTTPS' | 'HTTP' | 'GRPC';

export interface TransportConfig {
  protocol: TransportProtocol;
  baseUrl: string;
  timeoutMs: number;
  retryOnTimeout: boolean;
  validateTls: boolean;
}

export interface Transport {
  readonly transportId: string;

  send(request: ProviderRequest): Promise<ProviderResponse>;

  isAvailable(): Promise<boolean>;
}
