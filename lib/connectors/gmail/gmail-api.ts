/**
 * Gmail API Client Base
 * Handles API communication with Gmail REST API
 * Part of Build 136: Gmail Draft API Integration
 */

import { GmailApiException, GmailApiError } from '../../../src/lib/gmail-api/types';

export interface GmailApiClientConfig {
  baseUrl?: string;
  timeout?: number;
  enableRealExecution: boolean;
}

const DEFAULT_CONFIG: GmailApiClientConfig = {
  baseUrl: 'https://gmail.googleapis.com/gmail/v1',
  timeout: 30000,
  enableRealExecution: false,
};

export class GmailApiClient {
  private baseUrl: string;
  private timeout: number;
  private enableRealExecution: boolean;

  constructor(config: Partial<GmailApiClientConfig> = {}) {
    const mergedConfig = { ...DEFAULT_CONFIG, ...config };
    this.baseUrl = mergedConfig.baseUrl!;
    this.timeout = mergedConfig.timeout!;
    this.enableRealExecution = mergedConfig.enableRealExecution;
  }

  /**
   * Get current execution mode
   */
  getExecutionMode(): 'simulation' | 'real' {
    return this.enableRealExecution ? 'real' : 'simulation';
  }

  /**
   * Make authenticated request to Gmail API
   * In simulation mode, returns mock responses
   * In real mode, makes actual API calls
   */
  async request<T>(
    method: 'GET' | 'POST' | 'DELETE' | 'PATCH',
    endpoint: string,
    accessToken: string,
    body?: unknown,
  ): Promise<T> {
    if (!this.enableRealExecution) {
      throw new Error(
        'Simulation mode does not support direct API calls. Use draft-api.ts methods instead.',
      );
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData: GmailApiError = await response.json().catch(() => ({
          code: response.status,
          message: response.statusText,
        }));

        throw new GmailApiException(response.status, errorData);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof GmailApiException) {
        throw error;
      }
      if (error instanceof Error && error.name === 'AbortError') {
        throw new GmailApiException(408, {
          code: 408,
          message: 'Request timeout',
        });
      }
      throw new GmailApiException(500, {
        code: 500,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Validate access token format
   */
  validateToken(accessToken: string): boolean {
    return (
      typeof accessToken === 'string' &&
      accessToken.length > 0 &&
      accessToken.startsWith('ya29_')
    );
  }

  /**
   * Extract account email from token (not possible, but we store it separately)
   * This is a placeholder for actual JWT parsing if needed
   */
  isTokenExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }

  /**
   * Check if token needs refresh (expires within 5 minutes)
   */
  needsRefresh(expiresAt: Date): boolean {
    const fiveMinutesMs = 5 * 60 * 1000;
    const timeUntilExpiry = expiresAt.getTime() - new Date().getTime();
    return timeUntilExpiry < fiveMinutesMs;
  }
}
