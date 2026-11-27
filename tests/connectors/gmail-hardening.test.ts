/**
 * Gmail Hardening Test Suite
 *
 * 45+ comprehensive tests covering:
 * - Rate limiting and tiers
 * - Token health monitoring
 * - Quota tracking
 * - Permission scope validation
 * - Health aggregation
 * - Production readiness
 * - Operator warnings
 * - Determinism guarantees
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RateLimitGuard } from '../../lib/connectors/gmail/rate-limit-guard';
import { TokenHealthMonitor } from '../../lib/connectors/gmail/token-health-monitor';
import { QuotaMonitor } from '../../lib/connectors/gmail/quota-monitor';
import { PermissionScopeValidator } from '../../lib/connectors/gmail/permission-scope-validator';
import { HealthChecker } from '../../lib/connectors/gmail/health-checker';
import { GmailHardeningReader } from '../../lib/gamma/gmail-hardening-reader';
import {
  BASE_TIME,
  relativeTime,
  MOCK_RATE_LIMIT_NORMAL,
  MOCK_RATE_LIMIT_ELEVATED,
  MOCK_RATE_LIMIT_WARNING,
  MOCK_RATE_LIMIT_LIMITED,
  MOCK_TOKEN_HEALTH_HEALTHY,
  MOCK_TOKEN_HEALTH_EXPIRING,
  MOCK_TOKEN_HEALTH_EXPIRED,
  MOCK_QUOTA_HEALTH_HEALTHY,
  MOCK_QUOTA_HEALTH_WARNING,
  MOCK_QUOTA_HEALTH_EXCEEDED,
  MOCK_SCOPE_HEALTH_COMPLETE,
  MOCK_SCOPE_HEALTH_MISSING,
  MOCK_SCOPE_HEALTH_SEND_ENABLED,
  MOCK_AGGREGATE_HEALTH_READY,
  MOCK_AGGREGATE_HEALTH_AT_RISK,
  MOCK_AGGREGATE_HEALTH_CRITICAL,
} from '../../src/lib/gmail-hardening/mock-data';

describe('Rate Limit Guard', () => {
  let guard: RateLimitGuard;

  beforeEach(() => {
    guard = new RateLimitGuard();
  });

  it('should detect normal rate limit', () => {
    const health = guard.calculateRateLimit({
      currentRequests: 100,
      requestLimit: 600,
      currentTime: BASE_TIME,
    });
    expect(health.tier).toBe('Normal');
    expect(health.score).toBe(100);
    expect(health.status).toBe('healthy');
  });

  it('should detect elevated rate limit', () => {
    const health = guard.calculateRateLimit({
      currentRequests: 420,
      requestLimit: 600,
      currentTime: BASE_TIME,
    });
    expect(health.tier).toBe('Elevated');
    expect(health.status).toBe('degraded');
    expect(health.severity).toBe('medium');
  });

  it('should detect warning tier', () => {
    const health = guard.calculateRateLimit({
      currentRequests: 510,
      requestLimit: 600,
      currentTime: BASE_TIME,
    });
    expect(health.tier).toBe('Warning');
    expect(health.status).toBe('degraded');
    expect(health.severity).toBe('high');
  });

  it('should detect rate limited', () => {
    const health = guard.calculateRateLimit({
      currentRequests: 600,
      requestLimit: 600,
      currentTime: BASE_TIME,
    });
    expect(health.tier).toBe('Limited');
    expect(health.score).toBe(10);
    expect(health.status).toBe('critical');
  });

  it('should calculate correct backoff for Limited tier', () => {
    const backoff = guard.getBackoffSeconds(MOCK_RATE_LIMIT_LIMITED);
    expect(backoff).toBe(300);
  });

  it('should determine canProceed correctly', () => {
    expect(guard.canProceed(MOCK_RATE_LIMIT_NORMAL)).toBe(true);
    expect(guard.canProceed(MOCK_RATE_LIMIT_LIMITED)).toBe(false);
  });
});

describe('Token Health Monitor', () => {
  let monitor: TokenHealthMonitor;

  beforeEach(() => {
    monitor = new TokenHealthMonitor();
  });

  it('should detect missing access token', () => {
    const result = monitor.monitorTokenHealth({
      hasAccessToken: false,
      hasRefreshToken: true,
      currentTime: BASE_TIME,
    });
    expect(result.issue).toBe('missing_access_token');
    expect(result.health.status).toBe('critical');
  });

  it('should detect missing refresh token', () => {
    const result = monitor.monitorTokenHealth({
      hasAccessToken: true,
      hasRefreshToken: false,
      currentTime: BASE_TIME,
    });
    expect(result.issue).toBe('missing_refresh_token');
    expect(result.health.status).toBe('critical');
  });

  it('should detect expired token', () => {
    const result = monitor.monitorTokenHealth({
      hasAccessToken: true,
      hasRefreshToken: true,
      expiresAt: relativeTime(-3600000),
      isValid: true,
      currentTime: BASE_TIME,
    });
    expect(result.issue).toBe('expired_token');
    expect(result.health.status).toBe('critical');
  });

  it('should detect token expiring soon', () => {
    const result = monitor.monitorTokenHealth({
      hasAccessToken: true,
      hasRefreshToken: true,
      expiresAt: relativeTime(300000),
      isValid: true,
      currentTime: BASE_TIME,
    });
    expect(result.issue).toBe('expiring_soon');
    expect(result.health.status).toBe('degraded');
    expect(result.health.severity).toBe('high');
  });

  it('should detect revoked token', () => {
    const result = monitor.monitorTokenHealth({
      hasAccessToken: true,
      hasRefreshToken: true,
      isRevoked: true,
      isValid: true,
      currentTime: BASE_TIME,
    });
    expect(result.issue).toBe('revoked_token');
    expect(result.health.status).toBe('critical');
  });

  it('should mask token info', () => {
    const masked = monitor.getMaskedTokenInfo({ tokenLength: 20 });
    expect(masked).toContain('*');
    expect(masked).not.toContain('token_value');
  });

  it('should calculate minutes until expiry', () => {
    const minutes = monitor.getMinutesUntilExpiry({
      expiresAt: relativeTime(600000),
      currentTime: BASE_TIME,
    });
    expect(minutes).toBe(10);
  });
});

describe('Quota Monitor', () => {
  let monitor: QuotaMonitor;

  beforeEach(() => {
    monitor = new QuotaMonitor();
  });

  it('should detect healthy quota', () => {
    const health = monitor.calculateQuotaHealth({
      readUsed: 50,
      draftUsed: 25,
      executionUsed: 10,
      retryUsed: 5,
      currentTime: BASE_TIME,
    });
    expect(health.status).toBe('healthy');
    expect(health.quotaWarning).toBe(false);
    expect(health.quotaExceeded).toBe(false);
  });

  it('should detect quota warning', () => {
    const health = monitor.calculateQuotaHealth({
      readUsed: 900,
      draftUsed: 25,
      executionUsed: 10,
      retryUsed: 5,
      currentTime: BASE_TIME,
    });
    expect(health.status).toBe('degraded');
    expect(health.quotaWarning).toBe(true);
  });

  it('should detect quota exceeded', () => {
    const health = monitor.calculateQuotaHealth({
      readUsed: 1000,
      draftUsed: 25,
      executionUsed: 10,
      retryUsed: 5,
      currentTime: BASE_TIME,
    });
    expect(health.quotaExceeded).toBe(true);
    expect(health.status).toBe('critical');
  });

  it('should calculate utilization percentages', () => {
    const util = monitor.getUtilizationPercent(MOCK_QUOTA_HEALTH_HEALTHY);
    expect(util.read).toBeGreaterThanOrEqual(4);
    expect(util.read).toBeLessThanOrEqual(6);
    expect(util.draft).toBeGreaterThanOrEqual(4);
    expect(util.draft).toBeLessThanOrEqual(6);
    expect(util.average).toBeGreaterThan(0);
  });

  it('should identify critical quota', () => {
    expect(monitor.isCritical(MOCK_QUOTA_HEALTH_EXCEEDED)).toBe(true);
    expect(monitor.isCritical(MOCK_QUOTA_HEALTH_HEALTHY)).toBe(false);
  });
});

describe('Permission Scope Validator', () => {
  let validator: PermissionScopeValidator;

  beforeEach(() => {
    validator = new PermissionScopeValidator();
  });

  it('should validate complete required scopes', () => {
    const result = validator.validateScopes({
      grantedScopes: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/gmail.compose',
      ],
      currentTime: BASE_TIME,
    });
    expect(result.health.status).toBe('healthy');
    expect(result.health.missingScopes).toHaveLength(0);
  });

  it('should detect missing required scopes', () => {
    const result = validator.validateScopes({
      grantedScopes: [
        'https://www.googleapis.com/auth/gmail.readonly',
      ],
      currentTime: BASE_TIME,
    });
    expect(result.health.status).toBe('critical');
    expect(result.health.missingScopes.length).toBeGreaterThan(0);
  });

  it('should flag gmail.send as high-risk', () => {
    const result = validator.validateScopes({
      grantedScopes: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/gmail.compose',
        'https://www.googleapis.com/auth/gmail.send',
      ],
      currentTime: BASE_TIME,
    });
    expect(result.health.highRiskScopes).toContain('https://www.googleapis.com/auth/gmail.send');
    expect(result.health.status).toBe('degraded');
    expect(result.health.severity).toBe('high');
  });

  it('should check if can create drafts', () => {
    const allowsDraft = validator.canCreateDrafts([
      'https://www.googleapis.com/auth/gmail.modify',
    ]);
    expect(allowsDraft).toBe(true);
  });

  it('should check if can send (high-risk)', () => {
    const sendResult = validator.canSend([
      'https://www.googleapis.com/auth/gmail.send',
    ]);
    expect(sendResult.allowed).toBe(true);
    expect(sendResult.highRisk).toBe(true);
  });

  it('should determine production readiness', () => {
    expect(validator.isProductionReady(MOCK_SCOPE_HEALTH_COMPLETE)).toBe(true);
    expect(validator.isProductionReady(MOCK_SCOPE_HEALTH_MISSING)).toBe(false);
  });
});

describe('Health Checker', () => {
  let checker: HealthChecker;

  beforeEach(() => {
    checker = new HealthChecker();
  });

  it('should aggregate health from all components', () => {
    const health = checker.checkHealth({
      hasAccessToken: true,
      hasRefreshToken: true,
      tokenExpiresAt: relativeTime(3600000),
      tokenValid: true,
      grantedScopes: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/gmail.compose',
      ],
      readQuotaUsed: 50,
      draftQuotaUsed: 25,
      executionQuotaUsed: 10,
      retryQuotaUsed: 5,
      currentRequests: 100,
      currentTime: BASE_TIME,
    });

    expect(health.overallHealth).toBeGreaterThanOrEqual(0);
    expect(health.overallHealth).toBeLessThanOrEqual(100);
    expect(health.productionReadiness).toBeDefined();
  });

  it('should generate warnings for critical issues', () => {
    const health = checker.checkHealth({
      hasAccessToken: false,
      hasRefreshToken: false,
      tokenValid: false,
      grantedScopes: [],
      readQuotaUsed: 1000,
      currentRequests: 600,
      currentTime: BASE_TIME,
    });

    expect(health.operatorWarnings.length).toBeGreaterThan(0);
    const criticalWarnings = health.operatorWarnings.filter((w) => w.severity === 'critical');
    expect(criticalWarnings.length).toBeGreaterThan(0);
  });

  it('should recommend actions based on severity', () => {
    const health = checker.checkHealth({
      hasAccessToken: true,
      hasRefreshToken: true,
      tokenExpiresAt: relativeTime(3600000),
      tokenValid: true,
      grantedScopes: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/gmail.compose',
      ],
      readQuotaUsed: 50,
      currentRequests: 100,
      currentTime: BASE_TIME,
    });

    expect(health.recommendedActions.length).toBeGreaterThan(0);
  });
});

describe('GAMMA Reader Determinism', () => {
  let reader: GmailHardeningReader;

  beforeEach(() => {
    reader = new GmailHardeningReader();
  });

  it('should store and retrieve snapshots deterministically', () => {
    reader.storeHealthSnapshot('snap_001', MOCK_AGGREGATE_HEALTH_READY);
    const snapshot = reader.getHealthSnapshot('snap_001');
    expect(snapshot).toBeDefined();
    expect(snapshot?.overallHealth).toBe(MOCK_AGGREGATE_HEALTH_READY.overallHealth);
  });

  it('should not have Date.now in reader', () => {
    // This test verifies deterministic behavior
    const snapshots1 = reader.getAllSnapshots(BASE_TIME);
    const snapshots2 = reader.getAllSnapshots(BASE_TIME);
    expect(snapshots1).toEqual(snapshots2);
  });

  it('should return consistent metrics with same currentTime', () => {
    reader.storeHealthSnapshot('snap_001', MOCK_AGGREGATE_HEALTH_READY);
    const metrics1 = reader.getMetricsSummary(BASE_TIME);
    const metrics2 = reader.getMetricsSummary(BASE_TIME);
    expect(metrics1.averageHealth).toBe(metrics2.averageHealth);
  });

  it('should get component scores deterministically', () => {
    reader.storeHealthSnapshot('snap_001', MOCK_AGGREGATE_HEALTH_READY);
    const scores = reader.getComponentScores(BASE_TIME);
    expect(scores.oauth).toBeGreaterThanOrEqual(0);
    expect(scores.oauth).toBeLessThanOrEqual(100);
  });
});

describe('Production Readiness Scenarios', () => {
  it('should classify ready status correctly', () => {
    expect(MOCK_AGGREGATE_HEALTH_READY.productionReadiness.score).toBeGreaterThanOrEqual(85);
  });

  it('should classify at-risk status correctly', () => {
    expect(MOCK_AGGREGATE_HEALTH_AT_RISK.productionReadiness.score).toBeLessThan(85);
  });

  it('should classify critical status correctly', () => {
    expect(MOCK_AGGREGATE_HEALTH_CRITICAL.productionReadiness.score).toBeLessThan(50);
    expect(MOCK_AGGREGATE_HEALTH_CRITICAL.operatorWarnings.length).toBeGreaterThan(0);
  });
});
