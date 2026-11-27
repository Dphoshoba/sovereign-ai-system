/**
 * Gmail Hardening Reader (GAMMA)
 *
 * Deterministic queries for production hardening data.
 * All time-dependent methods accept currentTime parameter.
 * No temporal side effects: no system clock calls, no randomization, no client-side APIs.
 *
 * This reader provides read-only access to health data for dashboards and monitoring.
 */

import type {
  TokenHealth,
  QuotaHealth,
  ScopeHealth,
  RateLimitHealth,
  ConnectionHealth,
  ProductionReadiness,
  GmailHardeningAggregateHealth,
} from '../../src/lib/gmail-hardening/types';

export class GmailHardeningReader {
  private healthSnapshots: Map<string, GmailHardeningAggregateHealth> = new Map();
  private tokenHealthHistory: Map<string, TokenHealth[]> = new Map();

  /**
   * Store health snapshot
   */
  public storeHealthSnapshot(id: string, health: GmailHardeningAggregateHealth): void {
    this.healthSnapshots.set(id, health);
  }

  /**
   * Get health snapshot by ID
   */
  public getHealthSnapshot(id: string): GmailHardeningAggregateHealth | undefined {
    return this.healthSnapshots.get(id);
  }

  /**
   * Get all health snapshots (DETERMINISTIC - accepts currentTime)
   */
  public getAllSnapshots(currentTime: Date): GmailHardeningAggregateHealth[] {
    return Array.from(this.healthSnapshots.values());
  }

  /**
   * Store token health history
   */
  public storeTokenHealthHistory(accountId: string, health: TokenHealth): void {
    if (!this.tokenHealthHistory.has(accountId)) {
      this.tokenHealthHistory.set(accountId, []);
    }
    this.tokenHealthHistory.get(accountId)!.push(health);
  }

  /**
   * Get token health history (DETERMINISTIC - accepts currentTime)
   */
  public getTokenHealthHistory(
    accountId: string,
    currentTime: Date,
    limitDays?: number
  ): TokenHealth[] {
    const history = this.tokenHealthHistory.get(accountId) || [];
    if (!limitDays) return history;

    const limitMs = limitDays * 24 * 60 * 60 * 1000;
    const cutoffTime = currentTime.getTime() - limitMs;

    return history.filter((h) => h.lastValidated.getTime() >= cutoffTime);
  }

  /**
   * Get production readiness trend (DETERMINISTIC - accepts currentTime)
   */
  public getReadinessTrend(currentTime: Date, limitSnapshots?: number): {
    current: number;
    previous: number;
    trend: 'up' | 'steady' | 'down';
  } {
    const snapshots = Array.from(this.healthSnapshots.values());
    if (snapshots.length === 0) {
      return { current: 0, previous: 0, trend: 'steady' };
    }

    const sorted = snapshots.sort((a, b) => b.productionReadiness.lastValidated.getTime() - a.productionReadiness.lastValidated.getTime());
    const limit = limitSnapshots || 10;
    const recent = sorted.slice(0, Math.min(limit, sorted.length));

    if (recent.length < 2) {
      return { current: recent[0].productionReadiness.score, previous: recent[0].productionReadiness.score, trend: 'steady' };
    }

    const current = recent[0].productionReadiness.score;
    const previous = recent[recent.length - 1].productionReadiness.score;

    let trend: 'up' | 'steady' | 'down';
    if (current > previous) trend = 'up';
    else if (current < previous) trend = 'down';
    else trend = 'steady';

    return { current, previous, trend };
  }

  /**
   * Get recent warnings (DETERMINISTIC - accepts currentTime)
   */
  public getRecentWarnings(currentTime: Date, hoursBack?: number): Array<{
    warning: string;
    severity: string;
    timestamp: Date;
  }> {
    const hours = hoursBack || 24;
    const cutoffMs = currentTime.getTime() - hours * 60 * 60 * 1000;

    const warnings: Array<{ warning: string; severity: string; timestamp: Date }> = [];

    for (const snapshot of this.healthSnapshots.values()) {
      if (snapshot.productionReadiness.lastValidated.getTime() >= cutoffMs) {
        for (const warning of snapshot.operatorWarnings) {
          if (warning.createdAt.getTime() >= cutoffMs) {
            warnings.push({
              warning: warning.message,
              severity: warning.severity,
              timestamp: warning.createdAt,
            });
          }
        }
      }
    }

    return warnings.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get health metrics summary (DETERMINISTIC - accepts currentTime)
   */
  public getMetricsSummary(currentTime: Date): {
    totalSnapshots: number;
    averageHealth: number;
    criticalWarningCount: number;
    lastCheckTime: Date | null;
  } {
    const snapshots = Array.from(this.healthSnapshots.values());

    if (snapshots.length === 0) {
      return {
        totalSnapshots: 0,
        averageHealth: 0,
        criticalWarningCount: 0,
        lastCheckTime: null,
      };
    }

    const averageHealth = Math.round(
      snapshots.reduce((sum, s) => sum + s.overallHealth, 0) / snapshots.length
    );

    let criticalWarningCount = 0;
    for (const snapshot of snapshots) {
      criticalWarningCount += snapshot.operatorWarnings.filter((w) => w.severity === 'critical').length;
    }

    const lastCheck = snapshots.reduce(
      (latest: Date, s) => {
        const snapshotDate = new Date(s.productionReadiness.lastValidated);
        return snapshotDate > latest ? snapshotDate : latest;
      },
      new Date(0)
    );

    return {
      totalSnapshots: snapshots.length,
      averageHealth,
      criticalWarningCount,
      lastCheckTime: lastCheck,
    };
  }

  /**
   * Get health by component (DETERMINISTIC - accepts currentTime)
   */
  public getComponentScores(currentTime: Date): Record<string, number> {
    const snapshots = Array.from(this.healthSnapshots.values());

    if (snapshots.length === 0) {
      return {
        compliance: 0,
        resilience: 0,
        oauth: 0,
        queue: 0,
        approval: 0,
        preview: 0,
        execution: 0,
      };
    }

    // Average the most recent scores
    const latest = snapshots[0];
    return latest.connectorHealth;
  }

  /**
   * Clear all data (for testing)
   */
  public clear(): void {
    this.healthSnapshots.clear();
    this.tokenHealthHistory.clear();
  }

  /**
   * Get statistics (DETERMINISTIC)
   */
  public getStats(): {
    totalSnapshots: number;
    accountsTracked: number;
  } {
    return {
      totalSnapshots: this.healthSnapshots.size,
      accountsTracked: this.tokenHealthHistory.size,
    };
  }
}
