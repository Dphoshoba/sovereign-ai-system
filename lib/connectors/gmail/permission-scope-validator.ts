/**
 * Permission Scope Validator
 *
 * Validates OAuth scopes against Build 139 requirements.
 * gmail.send is flagged as high-risk until Build 140 certification.
 * Ensures all required scopes are present.
 */

import type { ScopeHealth } from '../../../src/lib/gmail-hardening/types';

export class PermissionScopeValidator {
  /**
   * Required scopes for Build 139
   */
  private readonly REQUIRED_SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.compose',
  ];

  /**
   * Optional scopes (always flagged as high-risk until Build 140)
   */
  private readonly HIGH_RISK_SCOPES = [
    'https://www.googleapis.com/auth/gmail.send',
  ];

  /**
   * Validate scopes granted to the connector
   */
  public validateScopes(context: {
    grantedScopes: string[];
    currentTime?: Date;
  }): {
    health: ScopeHealth;
    scopeDetails: {
      required: { scope: string; granted: boolean }[];
      highRisk: { scope: string; granted: boolean }[];
    };
  } {
    const currentTime = context.currentTime || new Date();
    const granted = context.grantedScopes || [];

    // Check required scopes
    const missingScopes: string[] = [];
    const requiredStatus = this.REQUIRED_SCOPES.map((scope) => {
      const granted = context.grantedScopes.includes(scope);
      if (!granted) missingScopes.push(scope);
      return { scope, granted };
    });

    // Check high-risk scopes
    const highRiskScopes: string[] = [];
    const highRiskStatus = this.HIGH_RISK_SCOPES.map((scope) => {
      const granted = context.grantedScopes.includes(scope);
      if (granted) highRiskScopes.push(scope);
      return { scope, granted };
    });

    // Calculate scope coverage
    const requiredGranted = requiredStatus.filter((s) => s.granted).length;
    const scopeCoverage = Math.round((requiredGranted / this.REQUIRED_SCOPES.length) * 100);

    // Determine health
    let score = 100;
    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let recommendation = '';
    let healthTrend: 'up' | 'steady' | 'down' = 'steady';
    let scopeHealth = 100;

    if (missingScopes.length > 0) {
      // Critical: missing required scopes
      score = Math.round((requiredGranted / this.REQUIRED_SCOPES.length) * 30);
      status = 'critical';
      severity = 'critical';
      scopeHealth = scopeCoverage;
      recommendation =
        'Missing critical scope(s): ' +
        missingScopes.map((s) => s.split('/').pop()).join(', ') +
        '. Add scope(s) to enable draft creation.';
    } else if (highRiskScopes.length > 0) {
      // Warning: gmail.send present
      score = 50;
      status = 'degraded';
      severity = 'high';
      scopeHealth = 50;
      recommendation =
        'gmail.send scope is present but should not be used until Build 140 certification. Consider removing.';
    } else {
      // Healthy: all required scopes, no high-risk
      score = 95;
      status = 'healthy';
      severity = 'low';
      scopeHealth = 100;
      recommendation = 'All required scopes present. No missing scopes.';
    }

    return {
      health: {
        score,
        status,
        severity,
        recommendation,
        lastValidated: currentTime,
        healthTrend,
        scopeCoverage,
        missingScopes,
        recommendedScopes: [],
        highRiskScopes,
        scopeHealth,
      },
      scopeDetails: {
        required: requiredStatus,
        highRisk: highRiskStatus,
      },
    };
  }

  /**
   * Check if scopes allow draft creation
   */
  public canCreateDrafts(grantedScopes: string[]): boolean {
    const readonly = 'https://www.googleapis.com/auth/gmail.readonly';
    const modify = 'https://www.googleapis.com/auth/gmail.modify';
    const compose = 'https://www.googleapis.com/auth/gmail.compose';

    return (
      grantedScopes.includes(modify) ||
      (grantedScopes.includes(readonly) && grantedScopes.includes(compose))
    );
  }

  /**
   * Check if scopes allow sending (always high-risk)
   */
  public canSend(grantedScopes: string[]): {
    allowed: boolean;
    highRisk: boolean;
    message: string;
  } {
    const sendScope = 'https://www.googleapis.com/auth/gmail.send';
    const hasSendScope = grantedScopes.includes(sendScope);

    if (!hasSendScope) {
      return {
        allowed: false,
        highRisk: false,
        message: 'gmail.send scope not granted.',
      };
    }

    return {
      allowed: true,
      highRisk: true,
      message: 'gmail.send scope granted but HIGH RISK. Not certified until Build 140.',
    };
  }

  /**
   * Get required scope names (short form)
   */
  public getRequiredScopeNames(): string[] {
    return this.REQUIRED_SCOPES.map((s) => s.split('/').pop() || s);
  }

  /**
   * Get high-risk scope names
   */
  public getHighRiskScopeNames(): string[] {
    return this.HIGH_RISK_SCOPES.map((s) => s.split('/').pop() || s);
  }

  /**
   * Check overall scope readiness for production
   */
  public isProductionReady(health: ScopeHealth): boolean {
    return health.missingScopes.length === 0 && health.highRiskScopes.length === 0;
  }
}
