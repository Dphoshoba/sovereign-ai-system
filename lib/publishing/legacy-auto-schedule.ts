/**
 * EV-EDITORIAL-07-P0 — legacy automatic scheduling lockdown.
 * Explicit schedule (/api/articles/schedule) and due publish cron remain authorised.
 * The legacy +7-day auto-schedule packaging path is disabled.
 */

export const LEGACY_AUTO_SCHEDULE_DISABLED_CODE =
  "LEGACY_AUTO_SCHEDULE_DISABLED" as const

export const LEGACY_AUTO_SCHEDULE_DISABLED_BODY = {
  ok: false as const,
  code: LEGACY_AUTO_SCHEDULE_DISABLED_CODE,
  error:
    "Legacy automatic scheduling is disabled. Use the governed schedule route after Director approval, or the editorial stage runner which stops at review-required.",
  articleUnchanged: true as const,
  scheduled: false as const,
  published: false as const,
}

export function isLegacyAutoScheduleDisabled() {
  return true
}
