/**
 * Calendar Quota Adapter
 */

export type QuotaStatus = 'healthy' | 'warning' | 'exceeded';

export interface QuotaSnapshot {
  limit: number;
  used: number;
  usedPercent: number;
  status: QuotaStatus;
}

export function evaluateCalendarQuota(params: { limit: number; used: number }): QuotaSnapshot {
  const limit = Math.max(1, params.limit);
  const used = Math.max(0, params.used);
  const usedPercent = Math.min(100, Math.round((used / limit) * 100));

  let status: QuotaStatus = 'healthy';
  if (usedPercent >= 100) status = 'exceeded';
  else if (usedPercent >= 85) status = 'warning';

  return {
    limit,
    used,
    usedPercent,
    status,
  };
}
