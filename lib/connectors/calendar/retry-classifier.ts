/**
 * Calendar Retry-Safe Read Classifier
 */

export type CalendarRetryDecision = 'retryable' | 'non_retryable';

export function classifyCalendarReadError(error: unknown): {
  decision: CalendarRetryDecision;
  reason: string;
} {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (
    message.includes('timeout') ||
    message.includes('temporarily unavailable') ||
    message.includes('rate limit') ||
    message.includes('429') ||
    message.includes('503')
  ) {
    return { decision: 'retryable', reason: 'transient_or_rate_limit' };
  }

  if (
    message.includes('401') ||
    message.includes('403') ||
    message.includes('invalid_grant') ||
    message.includes('insufficient permissions')
  ) {
    return { decision: 'non_retryable', reason: 'auth_or_scope' };
  }

  return { decision: 'non_retryable', reason: 'unknown_or_permanent' };
}
