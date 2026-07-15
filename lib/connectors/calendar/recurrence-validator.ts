import type { CalendarMutationValidationIssue, RecurrenceScope } from './mutation-types';

const SUPPORTED_FREQ = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];

export interface RecurrenceValidationInput {
  recurrence?: string[];
  scope?: RecurrenceScope;
  maxOccurrences?: number;
}

export interface RecurrenceValidationResult {
  errors: CalendarMutationValidationIssue[];
  warnings: CalendarMutationValidationIssue[];
  normalizedRecurrence: string[];
}

export function validateRecurrence(input: RecurrenceValidationInput): RecurrenceValidationResult {
  const errors: CalendarMutationValidationIssue[] = [];
  const warnings: CalendarMutationValidationIssue[] = [];
  const normalizedRecurrence = (input.recurrence || []).map((r) => r.trim().toUpperCase());

  if (normalizedRecurrence.length === 0) {
    return { errors, warnings, normalizedRecurrence };
  }

  const rule = normalizedRecurrence.find((r) => r.startsWith('RRULE:'));
  if (!rule) {
    errors.push({
      code: 'missing_rrule',
      message: 'Recurrence provided without RRULE',
      field: 'recurrence',
    });
    return { errors, warnings, normalizedRecurrence };
  }

  const body = rule.replace('RRULE:', '');
  const parts = body.split(';').map((p) => p.trim());
  const kv = new Map<string, string>();
  for (const p of parts) {
    const [k, v] = p.split('=');
    if (!k || !v) {
      errors.push({
        code: 'malformed_rrule',
        message: `Malformed RRULE component: ${p}`,
        field: 'recurrence',
      });
      continue;
    }
    kv.set(k, v);
  }

  const freq = kv.get('FREQ');
  if (!freq || !SUPPORTED_FREQ.includes(freq)) {
    errors.push({
      code: 'unsupported_frequency',
      message: `Unsupported or missing FREQ: ${freq || 'none'}`,
      field: 'recurrence',
    });
  }

  const hasUntil = kv.has('UNTIL');
  const hasCount = kv.has('COUNT');
  if (!hasUntil && !hasCount) {
    warnings.push({
      code: 'missing_end_condition',
      message: 'RRULE has no COUNT or UNTIL; recurrence may be unbounded',
      field: 'recurrence',
    });
  }

  if (hasCount) {
    const count = Number(kv.get('COUNT'));
    if (!Number.isFinite(count) || count <= 0) {
      errors.push({
        code: 'invalid_count',
        message: `Invalid recurrence COUNT: ${kv.get('COUNT')}`,
        field: 'recurrence',
      });
    } else if (count > (input.maxOccurrences ?? 365)) {
      warnings.push({
        code: 'excessive_recurrence',
        message: `High recurrence COUNT: ${count}`,
        field: 'recurrence',
      });
    }
  }

  if (input.scope === 'single' && normalizedRecurrence.length > 0) {
    warnings.push({
      code: 'scope_mismatch',
      message: 'Single-instance scope with recurring rule may indicate mismatch',
      field: 'scope',
    });
  }

  return { errors, warnings, normalizedRecurrence };
}
