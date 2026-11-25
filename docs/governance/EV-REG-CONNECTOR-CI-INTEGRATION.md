# Connector CI maintenance integration

Status: **integrated into `integrate/production-research-integrity`.** Certified tag `ev-reg-1.0.0-preview-certified` remains at `d8f59aceac3bdc775760a8bc4d076eb1e1d9074d`. Not Production authorised.

Closes the open maintenance sequence from `EV-REG-CI-CONNECTOR-BUILD-FIX.md` and `EV-REG-CALENDAR-READ-REMEDIATION.md`. Linked from the integration branch after merge of PRs #1 and #2.

## Pull requests

| PR | Title | Merge commit |
|---|---|---|
| [#1](https://github.com/Dphoshoba/sovereign-ai-system/pull/1) | CI Supabase build placeholders + `workflow_dispatch` | `15e9ed817f526a7864acb88d64846ba85e053872` |
| [#2](https://github.com/Dphoshoba/sovereign-ai-system/pull/2) | Calendar `ApiClient.read()` remediation | `a5b876a66042516fe3fb24ee2ce12ae201ff048e` |

Integration HEAD after both merges: `a5b876a66042516fe3fb24ee2ce12ae201ff048e`.

## Files on integrate (vs certified tag)

- `.github/workflows/calendar-validate.yml`
- `.github/workflows/slack-validate.yml`
- `docs/governance/EV-REG-CI-CONNECTOR-BUILD-FIX.md`
- `docs/governance/EV-REG-CALENDAR-READ-REMEDIATION.md`
- `lib/connectors/calendar/api-client.ts`
- `tests/connectors/calendar.test.ts`

## Verification

- Local Calendar + Slack unit tests: 58 passed
- Local `connector:validate` calendar: **100/100**
- Local `connector:validate` slack: **100/100**
- GitHub Actions Calendar on integrate: [43702960411](https://github.com/Dphoshoba/sovereign-ai-system/actions/runs/43702960411) **success**
- GitHub Actions Slack on integrate: [43702963354](https://github.com/Dphoshoba/sovereign-ai-system/actions/runs/43702963354) **success**
- `main` / `gamma`: unchanged (`d564ce13` / `235ea52a`)
- Certified tag: unchanged (`d8f59ace…`)
- Production deployments: none for these SHAs (latest Production records remain May 2026)
- Preview deployments observed for merge of PR #1 (`15e9ed81`): `Preview – sovereign-ai-executive`, `Preview – sovereign-ai-system` (and possibly other linked Preview projects). No Production alias change.

## Remaining limitations

- Unrelated Vercel Preview projects linked to the GitHub repo may still fail or succeed independently; they are not Production.
- Live Google Calendar HTTP beyond mocked connector tests is not claimed.
- Production enablement, Production deploy, and EV-REG Production flag remain separate human decisions.
