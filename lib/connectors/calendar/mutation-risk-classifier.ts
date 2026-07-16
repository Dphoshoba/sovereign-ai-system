import type {
  CalendarMutationPreview,
  MutationOperation,
  MutationRiskLevel,
  RecurrenceScope,
} from './mutation-types';

export interface MutationRiskFactor {
  code: string;
  weight: number;
  reason: string;
}

export interface MutationRiskAssessment {
  score: number;
  level: MutationRiskLevel;
  factors: MutationRiskFactor[];
}

function clampScore(score: number): number {
  if (score < 0) return 0;
  if (score > 100) return 100;
  return score;
}

function toRiskLevel(score: number): MutationRiskLevel {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

function recurrenceWeight(scope: RecurrenceScope): number {
  switch (scope) {
    case 'series':
      return 25;
    case 'this_and_following':
      return 20;
    case 'instance':
      return 10;
    case 'single':
    default:
      return 0;
  }
}

function operationWeight(operation: MutationOperation): number {
  switch (operation) {
    case 'delete':
      return 35;
    case 'cancel':
      return 30;
    case 'update':
      return 15;
    case 'create':
    default:
      return 10;
  }
}

export function classifyMutationRisk(
  preview: Pick<
    CalendarMutationPreview,
    | 'operation'
    | 'recurringScope'
    | 'attendees'
    | 'detectedConflicts'
    | 'changeSummary'
    | 'warnings'
    | 'validationErrors'
    | 'proposedState'
  >
): MutationRiskAssessment {
  const factors: MutationRiskFactor[] = [];

  factors.push({
    code: 'operation',
    weight: operationWeight(preview.operation),
    reason: `Operation ${preview.operation} carries baseline risk`,
  });

  const recurringWeight = recurrenceWeight(preview.recurringScope);
  if (recurringWeight > 0) {
    factors.push({
      code: 'recurrence_scope',
      weight: recurringWeight,
      reason: `Recurring scope ${preview.recurringScope} increases blast radius`,
    });
  }

  const externalAttendees = preview.attendees.filter(a => !a.email.endsWith('@example.com'));
  if (externalAttendees.length > 0) {
    factors.push({
      code: 'external_attendees',
      weight: Math.min(20, externalAttendees.length * 5),
      reason: `${externalAttendees.length} external attendee(s) impacted`,
    });
  }

  const resourceAttendees = preview.attendees.filter(
    a => (a as unknown as { resource?: boolean }).resource === true
  );
  if (resourceAttendees.length > 0) {
    factors.push({
      code: 'resource_attendees',
      weight: Math.min(10, resourceAttendees.length * 3),
      reason: `${resourceAttendees.length} resource attendee(s) impacted`,
    });
  }

  if (preview.detectedConflicts.length > 0) {
    factors.push({
      code: 'conflicts',
      weight: Math.min(20, preview.detectedConflicts.length * 6),
      reason: `${preview.detectedConflicts.length} conflict signal(s) detected`,
    });
  }

  if (preview.changeSummary.timezoneChanged) {
    factors.push({
      code: 'timezone_change',
      weight: 12,
      reason: 'Timezone change may alter participant expectations',
    });
  }

  if (preview.changeSummary.timeMoved) {
    factors.push({
      code: 'time_move',
      weight: 10,
      reason: 'Time shift can introduce coordination risk',
    });
  }

  if (preview.changeSummary.recurrenceChanged) {
    factors.push({
      code: 'recurrence_changed',
      weight: 12,
      reason: 'Recurrence changes impact future event schedule',
    });
  }

  if ((preview.validationErrors?.length || 0) > 0) {
    factors.push({
      code: 'validation_errors',
      weight: 25,
      reason: `${preview.validationErrors.length} validation error(s) present`,
    });
  }

  if ((preview.warnings?.length || 0) > 0) {
    factors.push({
      code: 'warnings',
      weight: Math.min(10, preview.warnings.length * 2),
      reason: `${preview.warnings.length} warning(s) detected`,
    });
  }

  const rawScore = factors.reduce((sum, f) => sum + f.weight, 0);
  const score = clampScore(rawScore);

  // Explicit hard-guards for destructive recurring operations.
  const destructiveRecurring =
    (preview.operation === 'delete' || preview.operation === 'cancel') &&
    (preview.recurringScope === 'series' || preview.recurringScope === 'this_and_following');

  if (destructiveRecurring && score < 80) {
    return {
      score: 80,
      level: 'critical',
      factors: [
        ...factors,
        {
          code: 'destructive_recurring_guard',
          weight: 0,
          reason: 'Destructive recurring mutation elevated to critical',
        },
      ],
    };
  }

  return {
    score,
    level: toRiskLevel(score),
    factors,
  };
}
