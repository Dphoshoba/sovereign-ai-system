/**
 * Health Helpers
 *
 * Shared utilities for health scoring and display across all connectors.
 * Eliminates duplicated score-to-color and score-to-label mappings.
 */

export type HealthStatus = 'healthy' | 'degraded' | 'critical';
export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';

export interface HealthScore {
  score: number;
  status: HealthStatus;
  label: string;
  recommendation: string;
}

/**
 * Convert a 0-100 score to a HealthScore descriptor.
 * Thresholds: 90+ healthy, 70-89 degraded, <70 critical.
 */
export function scoreToHealth(
  score: number,
  recommendations?: { healthy?: string; degraded?: string; critical?: string }
): HealthScore {
  if (score >= 90) {
    return {
      score,
      status: 'healthy',
      label: 'Healthy',
      recommendation: recommendations?.healthy ?? 'No action required.',
    };
  } else if (score >= 70) {
    return {
      score,
      status: 'degraded',
      label: 'Degraded',
      recommendation: recommendations?.degraded ?? 'Monitor closely.',
    };
  } else {
    return {
      score,
      status: 'critical',
      label: 'Critical',
      recommendation: recommendations?.critical ?? 'Immediate operator action required.',
    };
  }
}

/**
 * Tailwind CSS background color class for a health score.
 * Used consistently across all dashboards.
 */
export function scoreToColorClass(score: number): string {
  if (score >= 90) return 'bg-green-500';
  if (score >= 70) return 'bg-yellow-500';
  return 'bg-red-500';
}

/**
 * Tailwind CSS text color class for a health score.
 */
export function scoreToTextClass(score: number): string {
  if (score >= 90) return 'text-green-700';
  if (score >= 70) return 'text-yellow-700';
  return 'text-red-700';
}

/**
 * Tailwind CSS badge class (bg + text) for a health score.
 */
export function scoreToBadgeClass(score: number): string {
  if (score >= 90) return 'bg-green-100 text-green-800';
  if (score >= 70) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
}

/**
 * Tailwind CSS border class for a health score.
 */
export function scoreToBorderClass(score: number): string {
  if (score >= 90) return 'border-green-200';
  if (score >= 70) return 'border-yellow-200';
  return 'border-red-200';
}

/**
 * Color classes for severity levels.
 */
export function severityToColorClass(severity: SeverityLevel): string {
  switch (severity) {
    case 'critical': return 'bg-red-100 text-red-800 border-red-200';
    case 'high':     return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium':   return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':      return 'bg-blue-100 text-blue-800 border-blue-200';
  }
}

/**
 * Compute average health score from an array of scores.
 */
export function averageScore(scores: number[]): number {
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

/**
 * Compute weighted average health score.
 * weights must sum to 1.0
 */
export function weightedScore(
  scores: Array<{ score: number; weight: number }>
): number {
  if (scores.length === 0) return 0;
  const total = scores.reduce((sum, s) => sum + s.score * s.weight, 0);
  return Math.round(total);
}

/**
 * Determine if a score represents production-readiness.
 * Threshold: 70 (degraded is still acceptable for production with monitoring).
 */
export function isProductionReady(score: number): boolean {
  return score >= 70;
}

/**
 * Human-readable summary for a health score.
 */
export function healthSummary(score: number): string {
  if (score >= 90) return `Healthy (${score}/100) — No action required`;
  if (score >= 70) return `Degraded (${score}/100) — Monitor closely`;
  if (score >= 50) return `Critical (${score}/100) — Action required`;
  return `Failing (${score}/100) — Immediate action required`;
}
