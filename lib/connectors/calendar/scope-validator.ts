/**
 * Calendar Scope Validator
 */

const REQUIRED_READ_SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events.readonly',
];

export function validateCalendarReadScopes(grantedScopes: string[]): {
  valid: boolean;
  missing: string[];
} {
  const granted = new Set(grantedScopes || []);
  const missing = REQUIRED_READ_SCOPES.filter((scope) => !granted.has(scope));
  return {
    valid: missing.length === 0,
    missing,
  };
}
