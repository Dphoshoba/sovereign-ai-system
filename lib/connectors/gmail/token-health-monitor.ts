/**
 * Token Health Monitor
 *
 * Detects token health issues without exposing token values.
 * Always masks sensitive information.
 * Provides operator-readable recommendations.
 */

import type { TokenHealth } from '../../../src/lib/gmail-hardening/types';

export type TokenIssue =
  | 'missing_access_token'
  | 'missing_refresh_token'
  | 'expired_token'
  | 'expiring_soon'
  | 'refresh_available'
  | 'invalid_token'
  | 'revoked_token'
  | 'none';

export class TokenHealthMonitor {
  /**
   * Monitor token health without exposing token values
   */
  public monitorTokenHealth(context: {
    hasAccessToken?: boolean;
    hasRefreshToken?: boolean;
    expiresAt?: Date;
    isValid?: boolean;
    isRevoked?: boolean;
    currentTime?: Date;
  }): {
    health: TokenHealth;
    issue: TokenIssue;
  } {
    const currentTime = context.currentTime || new Date();

    // Check for missing tokens
    if (!context.hasAccessToken) {
      return {
        health: {
          score: 0,
          status: 'critical',
          severity: 'critical',
          recommendation: 'Missing access token. Re-authentication required.',
          lastValidated: currentTime,
          healthTrend: 'down',
          tokenHealthScore: 0,
          refreshRequired: true,
          refreshPossible: false,
          connectionRisk: 100,
        },
        issue: 'missing_access_token',
      };
    }

    if (!context.hasRefreshToken) {
      return {
        health: {
          score: 30,
          status: 'critical',
          severity: 'critical',
          recommendation: 'Missing refresh token. Cannot refresh access token. Re-authentication required.',
          lastValidated: currentTime,
          healthTrend: 'down',
          tokenHealthScore: 30,
          refreshRequired: true,
          refreshPossible: false,
          connectionRisk: 100,
        },
        issue: 'missing_refresh_token',
      };
    }

    // Check if token is revoked
    if (context.isRevoked) {
      return {
        health: {
          score: 0,
          status: 'critical',
          severity: 'critical',
          recommendation: 'Token has been revoked. Re-authentication required.',
          lastValidated: currentTime,
          healthTrend: 'down',
          tokenHealthScore: 0,
          refreshRequired: true,
          refreshPossible: false,
          connectionRisk: 100,
        },
        issue: 'revoked_token',
      };
    }

    // Check if token is invalid
    if (!context.isValid) {
      return {
        health: {
          score: 0,
          status: 'critical',
          severity: 'critical',
          recommendation: 'Token is invalid. Manual re-authentication required.',
          lastValidated: currentTime,
          healthTrend: 'down',
          tokenHealthScore: 0,
          refreshRequired: true,
          refreshPossible: false,
          connectionRisk: 100,
        },
        issue: 'invalid_token',
      };
    }

    // Check token expiry
    if (context.expiresAt) {
      const expiresAtMs = context.expiresAt.getTime();
      const currentMs = currentTime.getTime();
      const msUntilExpiry = expiresAtMs - currentMs;
      const minutesUntilExpiry = msUntilExpiry / 60000;

      // Already expired
      if (msUntilExpiry <= 0) {
        return {
          health: {
            score: 0,
            status: 'critical',
            severity: 'critical',
            recommendation: 'Token expired. No authentication possible. Refresh token or re-authenticate.',
            lastValidated: currentTime,
            healthTrend: 'down',
            tokenHealthScore: 0,
            refreshRequired: true,
            refreshPossible: context.hasRefreshToken ?? false,
            connectionRisk: 100,
          },
          issue: 'expired_token',
        };
      }

      // Expiring soon (within 10 minutes)
      if (minutesUntilExpiry < 10) {
        return {
          health: {
            score: 50,
            status: 'degraded',
            severity: 'high',
            recommendation: `Token expires in ${Math.round(minutesUntilExpiry)} minutes. Refresh immediately to prevent auth failures.`,
            lastValidated: currentTime,
            healthTrend: 'down',
            tokenHealthScore: 50,
            refreshRequired: true,
            refreshPossible: true,
            connectionRisk: 60,
          },
          issue: 'expiring_soon',
        };
      }

      // Still valid, but refresh available
      return {
        health: {
          score: 95,
          status: 'healthy',
          severity: 'low',
          recommendation: `Token is valid and will expire in ${Math.round(minutesUntilExpiry)} minutes.`,
          lastValidated: currentTime,
          healthTrend: 'steady',
          tokenHealthScore: 95,
          refreshRequired: false,
          refreshPossible: true,
          connectionRisk: 5,
        },
        issue: 'refresh_available',
      };
    }

    // No expiry info but token exists
    return {
      health: {
        score: 80,
        status: 'healthy',
        severity: 'low',
        recommendation: 'Token exists and appears valid. Monitor for expiry.',
        lastValidated: currentTime,
        healthTrend: 'steady',
        tokenHealthScore: 80,
        refreshRequired: false,
        refreshPossible: true,
        connectionRisk: 10,
      },
      issue: 'none',
    };
  }

  /**
   * Get masked token info for logging (never expose actual token)
   */
  public getMaskedTokenInfo(context: { tokenLength?: number; tokenPrefix?: string }): string {
    const length = context.tokenLength || 20;
    const prefix = context.tokenPrefix || 'oauth2_';
    const mask = '*'.repeat(Math.max(1, length - 4));
    return `${prefix}${mask}xxxx`;
  }

  /**
   * Check if token needs refresh
   */
  public needsRefresh(health: TokenHealth): boolean {
    return health.refreshRequired && health.refreshPossible;
  }

  /**
   * Get time until token expires (in minutes, -1 if expired, null if unknown)
   */
  public getMinutesUntilExpiry(context: {
    expiresAt?: Date;
    currentTime?: Date;
  }): number | null {
    if (!context.expiresAt) return null;
    const currentTime = context.currentTime || new Date();
    const msUntilExpiry = context.expiresAt.getTime() - currentTime.getTime();
    return msUntilExpiry / 60000;
  }
}
