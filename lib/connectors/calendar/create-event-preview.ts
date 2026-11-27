import { validateCreatePreviewInput, type MutationValidationContext } from './mutation-validator';
import { detectConflicts } from './conflict-preview';
import { buildChangeImpact } from './change-impact';
import type { CalendarEventRecord } from './types';
import type { CalendarMutationPreview, CreateEventPreviewInput, MutationRiskLevel } from './mutation-types';

function deterministicPreviewId(operation: string, calendarId: string, seed: string): string {
  return `preview_${operation}_${calendarId}_${seed.replace(/[^a-zA-Z0-9]/g, '').slice(0, 24)}`;
}

function classifyRisk(errors: number, warnings: number, conflicts: number): { score: number; level: MutationRiskLevel; requiredApproval: boolean } {
  const score = errors * 30 + warnings * 10 + conflicts * 20;
  if (score >= 80) return { score, level: 'critical', requiredApproval: true };
  if (score >= 50) return { score, level: 'high', requiredApproval: true };
  if (score >= 20) return { score, level: 'medium', requiredApproval: true };
  return { score, level: 'low', requiredApproval: false };
}

export function buildCreateEventPreview(params: {
  input: CreateEventPreviewInput;
  context: MutationValidationContext;
  existingEvents: CalendarEventRecord[];
  deterministicSeed: string;
}): CalendarMutationPreview {
  const validation = validateCreatePreviewInput(params.input, params.context);

  const proposedState: Partial<CalendarEventRecord> = {
    id: 'proposed',
    calendarId: params.input.calendarId,
    summary: params.input.summary,
    description: params.input.description,
    location: params.input.location,
    start: params.input.start,
    end: params.input.end,
    timezone: validation.normalizedTimezone,
    allDay: !!params.input.allDay,
    attendees: params.input.attendees || [],
    status: 'confirmed',
    updated: '1970-01-01T00:00:00.000Z',
  };

  const conflicts = detectConflicts({
    start: params.input.start,
    end: params.input.end,
    attendees: params.input.attendees,
    existingEvents: params.existingEvents,
  });

  const changeSummary = buildChangeImpact(null, proposedState);
  const risk = classifyRisk(validation.errors.length, validation.warnings.length, conflicts.length);

  return {
    previewId: deterministicPreviewId('create', params.input.calendarId, params.deterministicSeed),
    operation: 'create',
    calendarId: params.input.calendarId,
    beforeState: null,
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
    estimatedApiOperation: 'events.insert',
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
