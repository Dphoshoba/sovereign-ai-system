/**
 * Calendar Health Adapter
 */

import type { CalendarHealthStatus } from './types';
import type { QuotaSnapshot } from './quota-adapter';

export function evaluateCalendarHealth(params: {
  tokenMinutesUntilExpiry: number;
  scopeValid: boolean;
  quota: QuotaSnapshot;
  upstreamReachable: boolean;
}): CalendarHealthStatus {
  const warnings: string[] = [];

  if (!params.scopeValid) warnings.push('scope_invalid');
  if (params.quota.status === 'warning') warnings.push('quota_warning');
  if (params.quota.status === 'exceeded') warnings.push('quota_exceeded');
  if (!params.upstreamReachable) warnings.push('upstream_unreachable');
  if (params.tokenMinutesUntilExpiry < 10) warnings.push('token_near_expiry');

  let status: CalendarHealthStatus['status'] = 'healthy';
  if (!params.scopeValid || params.quota.status === 'exceeded') {
    status = 'blocked';
  } else if (warnings.length > 0) {
    status = 'warning';
  }

  return {
    status,
    quotaUsedPercent: params.quota.usedPercent,
    tokenMinutesUntilExpiry: Math.max(0, params.tokenMinutesUntilExpiry),
    scopeHealthy: params.scopeValid,
    warnings,
  };
}
