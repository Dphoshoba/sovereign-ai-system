export interface SandboxGuardResult {
  allowed: boolean;
  reason: string | null;
}

const PRODUCTION_CALENDAR_PATTERNS = [
  'primary',
  /^[a-zA-Z0-9._%+-]+@(gmail\.com|googlemail\.com)$/,
];

const PRODUCTION_CREDENTIAL_PATTERNS = [
  /^ya29\./,
];

export class SandboxResourceGuard {
  constructor(private sandboxCalendarId: string) {}

  checkCalendarId(calendarId: string): SandboxGuardResult {
    if (calendarId === this.sandboxCalendarId) {
      return { allowed: true, reason: null };
    }

    for (const pattern of PRODUCTION_CALENDAR_PATTERNS) {
      if (pattern instanceof RegExp) {
        if (pattern.test(calendarId)) {
          return {
            allowed: false,
            reason: `PRODUCTION_RESOURCE: Calendar '${calendarId}' matches production pattern`,
          };
        }
      } else if (calendarId === pattern) {
        return {
          allowed: false,
          reason: `PRODUCTION_RESOURCE: Calendar '${calendarId}' is a production calendar`,
        };
      }
    }

    if (calendarId.startsWith('sandbox-') || calendarId.includes('sandbox')) {
      return { allowed: true, reason: null };
    }

    return {
      allowed: false,
      reason: `UNKNOWN_RESOURCE: Calendar '${calendarId}' is not in sandbox or production allowlist`,
    };
  }

  checkAccessToken(token: string): SandboxGuardResult {
    for (const pattern of PRODUCTION_CREDENTIAL_PATTERNS) {
      if (pattern.test(token)) {
        return {
          allowed: false,
          reason: 'PRODUCTION_CREDENTIAL: Token matches production credential pattern',
        };
      }
    }
    return { allowed: true, reason: null };
  }
}
