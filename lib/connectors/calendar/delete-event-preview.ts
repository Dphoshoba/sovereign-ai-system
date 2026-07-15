import { validateDeletePreviewInput, type MutationValidationContext } from './mutation-validator';
import { buildChangeImpact } from './change-impact';
import type { CalendarEventRecord } from './types';
import type { CalendarMutationPreview, DeleteEventPreviewInput, MutationRiskLevel } from './mutation-types';

function deterministicPreviewId(calendarId: string, eventId: string, seed: string): string {
  return `preview_delete_${calendarId}_${eventId}_${seed.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)}`;
}

function riskFromScope(scope: string, warnings: number, errors: number): { score: number; level: MutationRiskLevel; requiredApproval: boolean } {
  const base = scope === 'series' || scope === 'this_and_following' ? 60 : 30;
  const score = base + warnings * 10 + errors * 30;
  if (score >= 80) return { score, level: 'critical', requiredApproval: true };
  if (score >= 50) return { score, level: 'high', requiredApproval: true };
  if (score >= 20) return { score, level: 'medium', requiredApproval: true };
  return { score, level: 'low', requiredApproval: false };
}

export function buildDeleteEventPreview(params: {
  input: DeleteEventPreviewInput;
  context: MutationValidationContext;
  beforeState: CalendarEventRecord;
  affectedEventCount: number;
  deterministicSeed: string;
}): CalendarMutationPreview {
  const validation = validateDeletePreviewInput(params.input, params.context);
  const recurringScope = validation.recurringScope;
  const risk = riskFromScope(recurringScope, validation.warnings.length, validation.errors.length);

  const changeSummary = buildChangeImpact(params.beforeState, null);
  changeSummary.impactNotes.push(`Affected events: ${params.affectedEventCount}`);
  if (params.input.cancelOnly) {
    changeSummary.impactNotes.push('Cancel-only mode preview');
  } else {
    changeSummary.impactNotes.push('Delete mode preview (irreversible risk)');
  }

  return {
    previewId: deterministicPreviewId(params.input.calendarId, params.input.eventId, params.deterministicSeed),
    operation: params.input.cancelOnly ? 'cancel' : 'delete',
    calendarId: params.input.calendarId,
    eventId: params.input.eventId,
    beforeState: params.beforeState,
    proposedState: null,
    normalizedTimezone: validation.normalizedTimezone,
    attendees: params.beforeState.attendees,
    recurringScope,
    detectedConflicts: [],
    validationErrors: validation.errors,
    warnings: validation.warnings,
    riskScore: risk.score,
    riskLevel: risk.level,
    requiredApproval: true,
    requiredScopes: ['https://www.googleapis.com/auth/calendar.events'],
    estimatedApiOperation: 'events.delete',
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
