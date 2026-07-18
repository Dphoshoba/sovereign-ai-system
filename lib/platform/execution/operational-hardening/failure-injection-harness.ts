import { Transport } from '../provider-contracts/transport';
import { ProviderRequest } from '../provider-contracts/provider-request';
import { ProviderResponse } from '../provider-contracts/provider-response';

export type InjectionMode = 'TIMEOUT' | 'RATE_LIMIT' | 'SERVER_ERROR' | 'MALFORMED_RESPONSE' | 'NETWORK_PARTITION';

export interface InjectionRule {
  mode: InjectionMode;
  probability: number;
  operationPattern?: string;
  statusCode?: number;
  delayMs?: number;
}

export interface InjectionReport {
  rule: InjectionRule;
  triggered: boolean;
  requestUrl: string;
  timestamp: string;
}

export class FailureInjectionHarness implements Transport {
  readonly transportId = 'failure-injection-harness';
  private rules: InjectionRule[] = [];
  private injectionsTriggered: InjectionReport[] = [];
  private bypassed = false;

  constructor(private realTransport: Transport) {}

  addRule(rule: InjectionRule): void {
    this.rules.push(rule);
  }

  clearRules(): void {
    this.rules = [];
  }

  setBypass(bypass: boolean): void {
    this.bypassed = bypass;
  }

  getInjectionReport(): InjectionReport[] {
    return [...this.injectionsTriggered];
  }

  clearReport(): void {
    this.injectionsTriggered = [];
  }

  async send(request: ProviderRequest): Promise<ProviderResponse> {
    if (this.bypassed) {
      return this.realTransport.send(request);
    }

    for (const rule of this.rules) {
      if (this.matchesRule(rule, request)) {
        if (Math.random() < rule.probability) {
          this.injectionsTriggered.push({
            rule,
            triggered: true,
            requestUrl: request.url,
            timestamp: new Date().toISOString(),
          });
          return this.createInjectedResponse(rule, request);
        }
      }
    }

    return this.realTransport.send(request);
  }

  async isAvailable(): Promise<boolean> {
    if (this.bypassed) return this.realTransport.isAvailable();
    const partitionRule = this.rules.find(r => r.mode === 'NETWORK_PARTITION');
    if (partitionRule && Math.random() < partitionRule.probability) {
      return false;
    }
    return this.realTransport.isAvailable();
  }

  private matchesRule(rule: InjectionRule, request: ProviderRequest): boolean {
    if (rule.operationPattern && !request.url.includes(rule.operationPattern)) {
      return false;
    }
    return true;
  }

  private async createInjectedResponse(rule: InjectionRule, request: ProviderRequest): Promise<ProviderResponse> {
    const base = {
      requestId: `injected-${request.requestId}`,
      headers: {},
      bodyFormat: 'json' as const,
      etag: null,
      revisionId: null,
      receivedAt: new Date().toISOString(),
      durationMs: rule.delayMs ?? 0,
      metadata: { injectionMode: rule.mode },
    };

    switch (rule.mode) {
      case 'TIMEOUT':
        throw new Error('INJECTED_TIMEOUT: Simulated network timeout');
      case 'RATE_LIMIT':
        return {
          ...base,
          statusCode: rule.statusCode ?? 429,
          headers: { 'Retry-After': '60', 'Content-Type': 'application/json' },
          body: { error: { code: 429, message: 'Rate Limit Exceeded' } },
        };
      case 'SERVER_ERROR':
        return {
          ...base,
          statusCode: rule.statusCode ?? 500,
          body: { error: { code: 500, message: 'Internal Server Error' } },
        };
      case 'MALFORMED_RESPONSE':
        if (rule.statusCode === 204) {
          return { ...base, statusCode: 204, body: null, bodyFormat: 'none' };
        }
        return {
          ...base,
          statusCode: rule.statusCode ?? 200,
          body: { unexpected_field: 'malformed', kind: 'unknown' },
        };
      case 'NETWORK_PARTITION':
        throw new Error('INJECTED_NETWORK_PARTITION: Simulated network partition');
      default:
        return await this.realTransport.send(request);
    }
  }
}
