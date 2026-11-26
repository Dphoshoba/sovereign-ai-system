import { validateUpdatePreviewInput, type MutationValidationContext } from './mutation-validator';
import { detectConflicts } from './conflict-preview';
import { buildChangeImpact } from './change-impact';
import type { CalendarEventRecord } from './types';
import type { CalendarMutationPreview, MutationRiskLevel, UpdateEventPreviewInput } from './mutation-types';

function deterministicPreviewId(calendarId: string, eventId: string, seed: string): string {
  return `preview_update_${calendarId}_${eventId}_${seed.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)}`;
}

function classifyRisk(errors: number, warnings: number, conflicts: number): { score: number; level: MutationRiskLevel; requiredApproval: boolean } {
  const score = errors * 30 + warnings * 8 + conflicts * 20;
  if (score >= 80) return { score, level: 'critical', requiredApproval: true };
  if (score >= 50) return { score, level: 'high', requiredApproval: true };
  if (score >= 20) return { score, level: 'medium', requiredApproval: true };
  return { score, level: 'low', requiredApproval: false };
}

export function buildUpdateEventPreview(params: {
  input: UpdateEventPreviewInput;
  context: MutationValidationContext;
  beforeState: CalendarEventRecord;
  existingEvents: CalendarEventRecord[];
  deterministicSeed: string;
}): CalendarMutationPreview {
  const validation = validateUpdatePreviewInput(params.input, params.context);

  const proposedState: Partial<CalendarEventRecord> = {
    ...params.beforeState,
    ...params.input.patch,
    timezone: params.input.patch.timezone || validation.normalizedTimezone,
  };

  const conflicts = detectConflicts({
    start: proposedState.start || params.beforeState.start,
    end: proposedState.end || params.beforeState.end,
    attendees: proposedState.attendees || params.beforeState.attendees,
    existingEvents: params.existingEvents.filter((e) => e.id !== params.beforeState.id),
  });

  const changeSummary = buildChangeImpact(params.beforeState, proposedState);
  const risk = classifyRisk(validation.errors.length, validation.warnings.length, conflicts.length);

  return {
    previewId: deterministicPreviewId(params.input.calendarId, params.input.eventId, params.deterministicSeed),
    operation: 'update',
    calendarId: params.input.calendarId,
    eventId: params.input.eventId,
    beforeState: params.beforeState,
    proposedState,
    normalizedTimezone: validation.normalizedTimezone,
    attendees: proposedState.attendees || [],
    recurringScope: validation.recurringScope,
    detectedConflicts: conflicts,
    validationErrors: validation.errors,
    warnings: validation.warnings,
    riskScore: risk.score,
    riskLevel: risk.level,
    requiredApproval: risk.requiredApproval,
    requiredScopes: ['https://www.googleapis.com/auth/calendar.events'],
    estimatedApiOperation: 'events.patch',
    changeSummary,
    auditMetadata: {
      connectorId: 'calendar',
      stage: 'stage2a-preview',
      generatedAt: '1970-01-01T00:00:00.000Z',
      deterministicSeed: params.deterministicSeed,
    },
    previewOnly: true,
    executionAllowed: false,
  };
}
