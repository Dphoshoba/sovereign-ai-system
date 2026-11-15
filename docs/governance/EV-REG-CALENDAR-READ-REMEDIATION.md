# Calendar connector `read()` remediation

Status: **local verification complete; push approval required.** Does not modify tag `ev-reg-1.0.0-preview-certified`, EV-REG specification, or Production.

Supersedes the open Calendar 95/100 gap noted in `docs/governance/EV-REG-CI-CONNECTOR-BUILD-FIX.md`. Linked from maintenance branch `fix/calendar-connector-read` (and PR #1 follow-up if approved).

## Root cause

`scripts/connector-validate.ts` requires the literal `async read(` in `lib/connectors/calendar/api-client.ts`.

Calendar already had authenticated GET helpers on `GoogleCalendarApiClient` (`listCalendars`, `listEvents`, `getEvent`, …) but no platform `ApiClient.read()` surface. The exported `CalendarClient` metadata object also lacked `async read(`. Detection was correct — `read()` was missing, not falsely flagged.

## Fix

On branch `fix/calendar-connector-read`:

- Added `GoogleCalendarApiClient.read()` routing to existing GET paths with token checks, resource/param validation, 404 → `null`, and 401/403 → `CalendarApiError`.
- Exposed `async read()` on `CalendarClient` (requires the authenticated class; does not invent credentials).
- Tightened `getEvent` so permission errors are no longer swallowed as missing.
- Extended `tests/connectors/calendar.test.ts` for success, missing, invalid input, empty token, and permission failure.

## Verification

| Check | Result |
|---|---|
| `npm run connector:validate -- --name=calendar` | **100/100 VALID** |
| `tests/connectors/calendar.test.ts` + `slack.test.ts` | 2 files / 58 passed |
| `tsc --noEmit` | exit 0 |
| CI Supabase placeholders in connector workflows | unchanged |
| Certified tag `ev-reg-1.0.0-preview-certified` | unchanged at `d8f59ace…` |

## Remaining risks

- `CalendarClient.read` on the metadata object still requires constructing `GoogleCalendarApiClient(accessToken)`; it does not perform network I/O itself.
- Live Google Calendar HTTP behaviour beyond mocked status codes is not exercised here.
- Push/merge into PR #1 or a new PR needs separate approval.
