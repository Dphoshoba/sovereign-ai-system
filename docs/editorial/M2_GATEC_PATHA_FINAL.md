# FINAL GATE C — Path A verification

**Status:** **BLOCKED**  
**Date:** 2026-11-18  
**RC branch:** `cursor/autonomous-pipeline-lockdown-1605`  
**Vercel project:** `davidoshoba-3659s-projects/sovereign-ai-executive` (`prj_ogfO2yCJl7motADB98mCobU2Aviq`)  
**Expected Preview project:** `emmzoeeaznhpwevqprkn`  
**Forbidden Production project:** `kqptdgbttfuqkzxzbazw`  
**Mutations / push / deploy:** none

## Verdict

**BLOCKED.** Path A could **not** fully verify that effective Preview `DATABASE_URL` (and `DIRECT_URL`) map to `emmzoeeaznhpwevqprkn`.

Reason: Preview `DATABASE_URL` is stored as Vercel type **`sensitive`**. Authorised read-only CLI/API access returns **no value** for Sensitive secrets after creation (list + per-id GET). Preview **`DIRECT_URL` does not exist**. Therefore the mandated positive mapping for both URLs cannot be completed without a Preview-only config change (Path B) or a future runtime diagnostic that is not present today.

Director is **not** asked to attest unread secret values.

---

## 1. What was verified (non-sensitive)

### 1.1 Effective env resolution for RC branch

| Variable | Preview rows | Branch override for RC? | Effective source for RC |
| --- | --- | --- | --- |
| `DATABASE_URL` | 1× Preview, `gitBranch: null`, type **sensitive** | **No** | **Generic Preview** |
| `DIRECT_URL` | Production only | n/a | **Missing on Preview** |
| `NEXT_PUBLIC_SUPABASE_URL` | Preview + Production/Development | **No** for RC | **Generic Preview** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Preview + Production/Development | **No** | **Generic Preview** |
| `NEXT_PUBLIC_APP_URL` | Preview generic + override on `preview/security-isolated` only | RC uses **generic** | Generic Preview |

`preview/security-isolated` does **not** override `DATABASE_URL`. RC would not be superseded by that branch’s DB config.

### 1.2 Public / Auth clients → isolated project

Authorised per-id Vercel env GET (encrypted, non-sensitive) and anon JWT `ref` claims:

| Scope | Evidence | Project ref |
| --- | --- | --- |
| Preview `NEXT_PUBLIC_SUPABASE_URL` | host `emmzoeeaznhpwevqprkn.supabase.co` | **`emmzoeeaznhpwevqprkn`** |
| Preview anon JWT | claim `ref` | **`emmzoeeaznhpwevqprkn`** |
| Production `NEXT_PUBLIC_SUPABASE_URL` | host `kqptdgbttfuqkzxzbazw.supabase.co` | **`kqptdgbttfuqkzxzbazw`** |
| Production anon JWT | claim `ref` | **`kqptdgbttfuqkzxzbazw`** |

### 1.3 Prisma runtime posture (partial, not Path A complete)

| Check | Result |
| --- | --- |
| App wiring | `lib/prisma.ts` / `src/lib/prisma.ts` use `databaseUrlForRuntime(process.env.DATABASE_URL)` only (no `DIRECT_URL` in runtime client) |
| Preview fail-closed | `src/lib/preview-postgres.ts` throws if Preview `DATABASE_URL` **contains** Production ref `kqptdgbttfuqkzxzbazw` |
| Live Preview DB connect | `vercel curl` → security-isolated Ready Preview `/api/health/db` → `database: connected`, `articles: 1` |
| Implication | Connected Preview runtime is **incompatible** with a Production-ref `DATABASE_URL` **when that guard is present in the deployment**. This is **negative** proof (not Production), **not** positive proof of `emmzoeeaznhpwevqprkn`. |

### 1.4 Sensitive secret read attempts (failed closed by platform)

| Attempt | Result for Preview `DATABASE_URL` |
| --- | --- |
| `vercel env ls` | Row present; value Hidden |
| `vercel env pull` / `env run` | Secrets not injected (`[SENSITIVE]` / absent) |
| API `GET /v9/projects/.../env?decrypt=true` | Sensitive value empty / placeholder |
| API `GET /v9/projects/.../env/{id}` | `hasValue: false` for Sensitive IDs |
| `vercel env pull --deployment <ready dpl>` | API error: Ready deployments not supported for this pull mode |

**No secrets or full URLs were printed or committed.**

---

## 2. Client consistency summary

| Client | Config | Isolation vs Production | Maps to `emmzoeeaznhpwevqprkn`? |
| --- | --- | --- | --- |
| Supabase public URL | Preview encrypted env | **Yes** (verified host/ref) | **Yes** |
| Supabase anon Auth JWT | Preview encrypted env | **Yes** (`ref` claim) | **Yes** |
| Prisma Postgres | Preview **Sensitive** `DATABASE_URL` | Not Production **if** Preview guard + connected (runtime) | **Unverified** (secret unreadable) |
| Prisma `DIRECT_URL` | **Absent** on Preview | n/a | **N/A / missing** |
| `SUPABASE_SERVICE_ROLE_KEY` | Preview Sensitive | Unreadable | **Unverified** |

---

## 3. Path B — exact Preview-only changes (**DO NOT APPLY** until Director approves)

Goal: make Gate C PASS with verifiable, isolated Preview DB config. **No Production env changes.**

### B1. Replace Preview `DATABASE_URL` (required)

| Field | Value |
| --- | --- |
| Project | `sovereign-ai-executive` |
| Environment | **Preview only** |
| Git branch | **none** (generic Preview — covers RC + most Preview branches) |
| Name | `DATABASE_URL` |
| Action | Update/replace existing Preview secret `Zd0El3VHgnP45DtC` |
| Required content (Director supplies password) | Postgres pooler URL whose username/project identifies **`emmzoeeaznhpwevqprkn`** and **must not** contain `kqptdgbttfuqkzxzbazw` |
| Suggested shape (placeholder only) | `postgresql://postgres.emmzoeeaznhpwevqprkn:***@aws-*-*.pooler.supabase.com:6543/postgres?...` |
| Type | Prefer **encrypted** (readable for future Path A audits) if policy allows; else Sensitive after one verified set |

CLI sketch (values not embedded; operator pastes secret interactively):

```bash
vercel env rm DATABASE_URL preview --scope davidoshoba-3659s-projects --yes
vercel env add DATABASE_URL preview --scope davidoshoba-3659s-projects
# paste isolated Preview connection string when prompted
```

### B2. Add Preview `DIRECT_URL` (required to satisfy “both URLs” Gate C language)

| Field | Value |
| --- | --- |
| Environment | **Preview only** |
| Git branch | none |
| Name | `DIRECT_URL` |
| Action | **Add** (no Preview row today) |
| Required content | Same Supabase project **`emmzoeeaznhpwevqprkn`** (typically port `5432` session mode / direct host as used for that project) |
| Production | **Do not modify** existing Production `DIRECT_URL` |

```bash
vercel env add DIRECT_URL preview --scope davidoshoba-3659s-projects
# paste isolated Preview direct/session URL when prompted
```

### B3. Post-apply verification (after approval)

1. Per-id/env read or encrypted pull fingerprint: `projectRefGuess === emmzoeeaznhpwevqprkn` for both URLs; `matchesProduction === false`.  
2. Confirm still **no** RC branch override.  
3. `vercel curl` Preview `/api/health` + `/api/health/db` → connected.  
4. Re-run Gate C → expected **PASS**, then resume M2-PV2.

### B4. Explicitly out of scope

- Production `DATABASE_URL` / `DIRECT_URL` edits  
- New Supabase project creation (reuse `emmzoeeaznhpwevqprkn`)  
- Migrations / proposed SQL  
- Push / Preview deploy / live social  
- Shared Production DB acceptance

---

## 4. Required Director action (precise)

**Approve Path B1 + B2** (Preview-only `DATABASE_URL` replace + Preview `DIRECT_URL` add) with connection secrets supplied out-of-band to an authorised operator.

Until then: Gate C remains **BLOCKED**; no push/deploy.

---

## 5. Final decision

| Item | Result |
| --- | --- |
| Path A full PASS | **No** |
| Public/Auth isolation | Verified for `emmzoeeaznhpwevqprkn` |
| Prisma `DATABASE_URL` → `emmzoeeaznhpwevqprkn` | **Unverifiable** (Sensitive) |
| Preview `DIRECT_URL` | **Missing** |
| Consolidated Gate C | **BLOCKED** |
| Next step | Director approval of Path B Preview-only env changes |
