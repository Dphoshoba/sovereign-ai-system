/**
 * Calendar Read Audit Receipt Builder
 */

import type { CalendarAuditReceipt } from './types';

export function buildCalendarReadAuditReceipt(params: {
  action: string;
  success: boolean;
  details?: Record<string, unknown>;
}): CalendarAuditReceipt {
  return {
    connectorId: 'calendar',
    action: params.action,
    success: params.success,
    timestamp: new Date().toISOString(),
    details: params.details || {},
  };
}
