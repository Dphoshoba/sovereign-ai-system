/**
 * Calendar Timezone Normalizer (deterministic, read-only utility)
 */

export interface NormalizedTimeRange {
  start: string;
  end: string;
  timezone: string;
}

function toIsoOrThrow(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid datetime: ${value}`);
  }
  return d.toISOString();
}

export function normalizeTimeRange(params: {
  start: string;
  end: string;
  timezone?: string;
}): NormalizedTimeRange {
  const startIso = toIsoOrThrow(params.start);
  const endIso = toIsoOrThrow(params.end);

  if (new Date(startIso).getTime() >= new Date(endIso).getTime()) {
    throw new Error('Invalid range: start must be before end');
  }

  return {
    start: startIso,
    end: endIso,
    timezone: params.timezone || 'UTC',
  };
}
