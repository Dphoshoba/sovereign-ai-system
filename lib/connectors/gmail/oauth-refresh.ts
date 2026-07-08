/**
 * OAuth Token Refresh Manager
 * Handles automatic token refresh for expired access tokens
 * Part of Build 136: Gmail Draft API Integration
 */

import { OAuthToken, OAuthRefreshRequest, OAuthRefreshResponse } from '../../../src/lib/gmail-api/types';
import { ExecutionAuditLog } from './execution-audit';

export interface OAuthRefreshConfig {
  enableRealExecution: boolean;
}

export class OAuthRefreshManager {
  private auditLog: ExecutionAuditLog;
  private enableRealExecution: boolean;
  private refreshCount = 0;
  private lastRefreshTime?: Date;
  private nextRefreshTime?: Date;

  constructor(config: OAuthRefreshConfig) {
    this.enableRealExecution = config.enableRealExecution;
    this.auditLog = new ExecutionAuditLog();
  }

  /**
   * Check if token needs refresh (expires within 5 minutes)
   */
  needsRefresh(token: OAuthToken): boolean {
    const fiveMinutesMs = 5 * 60 * 1000;
    const timeUntilExpiry = token.expiresAt.getTime() - new Date().getTime();
    return timeUntilExpiry < fiveMinutesMs;
  }

  /**
   * Check if token is expired
   */
  isExpired(token: OAuthToken): boolean {
    return new Date() > token.expiresAt;
  }

  /**
   * Refresh access token using refresh token
   * In simulation mode, returns simulated token
   * In real mode, calls OAuth provider
   */
  async refresh(
    token: OAuthToken,
    config: OAuthRefreshRequest,
    executionId: string,
  ): Promise<OAuthToken> {
    const startTime = Date.now();

    try {
      if (this.enableRealExecution) {
        return await this.refreshReal(token, config, executionId, startTime);
      } else {
        return this.refreshSimulated(token, executionId, startTime);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.auditLog.recordEvent(
        executionId,
        'gmail_api_failed' as any,
        'system',
        new Date(),
        {
          draftReceiptId: `receipt_${Date.now()}`,
          operation: 'oauth_refresh',
          error: errorMessage,
        }
      );

      throw error;
    }
  }

  /**
   * Refresh token in real mode (call OAuth provider)
   */
  private async refreshReal(
    token: OAuthToken,
    config: OAuthRefreshRequest,
    executionId: string,
    startTime: number,
  ): Promise<OAuthToken> {
    if (!token.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(config.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          refresh_token: config.refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        throw new Error(`OAuth refresh failed: ${response.statusText}`);
      }

      const data = (await response.json()) as OAuthRefreshResponse;
      const latencyMs = Date.now() - startTime;

      const newToken: OAuthToken = {
        accessToken: data.accessToken,
        tokenType: data.tokenType,
        expiresIn: data.expiresIn,
        expiresAt: new Date(Date.now() + data.expiresIn * 1000),
        refreshToken: token.refreshToken, // Keep existing refresh token
        scope: token.scope,
        accountId: token.accountId,
      };

      this.refreshCount++;
      this.lastRefreshTime = new Date();
      this.nextRefreshTime = new Date(Date.now() + data.expiresIn * 1000 - 5 * 60 * 1000);

      // Record audit event
      this.auditLog.recordEvent(
        executionId,
        'gmail_token_refreshed' as any,
        'system',
        new Date(),
        {
          draftReceiptId: `receipt_${Date.now()}`,
          accountId: token.accountId,
          expiresIn: data.expiresIn,
          latencyMs,
        }
      );

      return newToken;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Refresh token in simulation mode (simulated response)
   */
  private async refreshSimulated(
    token: OAuthToken,
    executionId: string,
    startTime: number,
  ): Promise<OAuthToken> {
    // Simulate network latency (100-500ms)
    const simulatedLatency = Math.random() * 400 + 100;
    await new Promise((resolve) => setTimeout(resolve, simulatedLatency));

    const latencyMs = Date.now() - startTime;

    const newToken: OAuthToken = {
      accessToken: `ya29_sim_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      tokenType: 'Bearer',
      expiresIn: 3600,
      expiresAt: new Date(Date.now() + 3600 * 1000),
      refreshToken: token.refreshToken,
      scope: token.scope,
      accountId: token.accountId,
    };

    this.refreshCount++;
    this.lastRefreshTime = new Date();
    this.nextRefreshTime = new Date(Date.now() + 3600 * 1000 - 5 * 60 * 1000);

    // Record audit event
    this.auditLog.recordEvent(
      executionId,
      'gmail_token_refreshed' as any,
      'system',
      new Date(),
      {
        draftReceiptId: `receipt_${Date.now()}`,
        accountId: token.accountId,
        expiresIn: 3600,
        latencyMs,
        simulated: true,
      }
    );

    return newToken;
  }

  /**
   * Get refresh metrics
   */
  getMetrics() {
    return {
      totalRefreshes: this.refreshCount,
      lastRefreshTime: this.lastRefreshTime,
      nextRefreshTime: this.nextRefreshTime,
      healthScore: this.refreshCount > 0 ? 95 : 100,
    };
  }
}
