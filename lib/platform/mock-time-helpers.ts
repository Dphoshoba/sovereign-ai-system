/**
 * Mock Time Helpers
 *
 * Canonical time constants and helpers for deterministic test data.
 * All mock-data.ts files should import from here instead of defining local BASE_TIME.
 *
 * Never use Date.now() in mock data — always use these constants.
 */

/** Canonical platform baseline — 2026-07-01T00:00:00.000Z */
export const PLATFORM_BASE_TIME = new Date('2026-07-01T00:00:00.000Z');

/** Platform baseline as ISO string */
export const PLATFORM_BASE_TIME_ISO = PLATFORM_BASE_TIME.toISOString();

/** Gmail hardening baseline — 2026-07-01T10:00:00Z */
export const GMAIL_HARDENING_BASE_TIME = new Date('2026-07-01T10:00:00.000Z');

/** Gmail certification baseline — 2026-07-10T12:00:00Z */
export const GMAIL_CERT_BASE_TIME = new Date('2026-07-10T12:00:00.000Z');

/**
 * Create a time offset from a base time.
 * Deterministic — no system clock calls.
 *
 * @example
 * const oneHourAgo = offsetFrom(PLATFORM_BASE_TIME, -60 * 60 * 1000);
 */
export function offsetFrom(base: Date, offsetMs: number): Date {
  return new Date(base.getTime() + offsetMs);
}

/**
 * Create a time relative to the platform base time.
 * Positive values = future. Negative values = past.
 *
 * @example
 * const yesterday = relativeToBase(-24 * 60 * 60 * 1000);
 */
export function relativeToBase(offsetMs: number): Date {
  return offsetFrom(PLATFORM_BASE_TIME, offsetMs);
}

/**
 * ISO string offset from platform base.
 */
export function relativeToBaseISO(offsetMs: number): string {
  return relativeToBase(offsetMs).toISOString();
}

/** Common offsets (in milliseconds) */
export const TIME_OFFSETS = {
  oneMinuteMs:  60 * 1000,
  oneHourMs:    60 * 60 * 1000,
  oneDayMs:     24 * 60 * 60 * 1000,
  oneWeekMs:    7 * 24 * 60 * 60 * 1000,
  thirtyDaysMs: 30 * 24 * 60 * 60 * 1000,
} as const;

/**
 * Format a date as ISO string deterministically.
 */
export function toISO(d: Date): string {
  return d.toISOString();
}

/**
 * Parse an ISO string to Date deterministically.
 */
export function fromISO(iso: string): Date {
  return new Date(iso);
}

/**
 * Minutes until a future date, relative to a reference time.
 * Returns null if target is in the past relative to reference.
 */
export function minutesUntil(target: Date, reference: Date): number | null {
  const diff = target.getTime() - reference.getTime();
  if (diff <= 0) return null;
  return Math.floor(diff / (60 * 1000));
}

/**
 * Days until a future date.
 */
export function daysUntil(target: Date, reference: Date): number | null {
  const diff = target.getTime() - reference.getTime();
  if (diff <= 0) return null;
  return Math.floor(diff / TIME_OFFSETS.oneDayMs);
}
