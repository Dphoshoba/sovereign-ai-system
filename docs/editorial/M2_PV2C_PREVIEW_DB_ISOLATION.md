# M2-PV2-C — Preview Database Isolation Remediation

**Status:** **BLOCKED** (awaiting Director attestation) — no env apply / push / deploy  
**Evidence baseline:** `7854a0dd4627d54fd83a7ae033b8118abe2b737b`  
**Branch under programme:** `cursor/autonomous-pipeline-lockdown-1605`  
**Preferred reuse target:** `preview/security-isolated`  
**Vercel project:** `davidoshoba-3659s-projects/sovereign-ai-executive`  
**Production:** remains **NO-GO**

## Verdict

| Question | Result |
| --- | --- |
| Gate C PASS this run? | **No — BLOCKED** |
| Public Preview ≠ Production Supabase project verified without mutation? | **Yes** |
| Prisma `DATABASE_URL` secret fingerprint verified? | **No** (Vercel CLI will not inject/pull encrypted Secrets into `env run` / `env pull`) |
| New infra required? | **Not if** Preview `DATABASE_URL` already targets the Preview project (see attestation) |
| Env mutations applied? | **None** |

---

## 1. Investigation method (no secrets printed)

1. Listed Vercel env rows (names / targets / git-branch only).  
2. Temporarily moved local `.env` / `.env.local` aside so fingerprints were not contaminated by workstation Production URLs, then restored them.  
3. Ran `vercel env run` for:
   - `production`
   - `preview`
   - `preview` + `--git-branch preview/security-isolated`
   - `preview` + `--git-branch cursor/autonomous-pipeline-lockdown-1605`  
4. Emitted **public** fingerprints only (`NEXT_PUBLIC_SUPABASE_URL` project ref, `NEXT_PUBLIC_APP_URL` host).  
5. Confirmed encrypted Secrets (`DATABASE_URL`, `DIRECT_URL`, `CRON_SECRET`, Twitter keys, etc.) are **not** available to this agent via CLI pull/run (“Secret values cannot be pulled”).

Temporary pulled `.env` files under `%TEMP%\m2-pv2c-env` were deleted after analysis.

---

## 2. Verified public / auth isolation (mutation-free)

| Scope | `NEXT_PUBLIC_SUPABASE_URL` project ref | `NEXT_PUBLIC_APP_URL` host (when non-secret) |
| --- | --- | --- |
| Production | `kqptdgbttfuqkzxzbazw` | _(Production value is Secret type — not injected by CLI)_ |
| Preview (generic) | `emmzoeeaznhpwevqprkn` | `sovereign-ai-executive-git-gamma-davidoshoba-3659s-projects.vercel.app` |
| Preview + `preview/security-isolated` | `emmzoeeaznhpwevqprkn` | `sovereign-ai-executive-git-pr-94926f-davidoshoba-3659s-projects.vercel.app` |
| Preview + `cursor/autonomous-pipeline-lockdown-1605` | `emmzoeeaznhpwevqprkn` | same as generic Preview (`…-git-gamma-…`) |

**Conclusions from public config:**

- Production Supabase project ref **≠** Preview Supabase project ref.  
- Generic Preview, `preview/security-isolated`, and the RC branch name all resolve to the **same** Preview Supabase project `emmzoeeaznhpwevqprkn`.  
- `preview/security-isolated` branch overrides observed in `vercel env ls` are **only** `OPENAI_API_KEY` and `NEXT_PUBLIC_APP_URL` — **not** `DATABASE_URL`.  
- Therefore DB isolation, if present, is a **Preview-environment** property, not a property unique to `preview/security-isolated`. The RC branch can **reuse** that Preview isolation **without new branch env rows**, provided Preview `DATABASE_URL` matches the Preview project.

Supporting in-repo proposal text (unexecuted SQL; not applied): `docs/security/proposed/20261105_preview_revoke_public_data_api.sql` names Preview target `emmzoeeaznhpwevqprkn` and prohibits Production `kqptdgbttfuqkzxzbazw`.

Prior programme note: local `preview/security-isolated` commit `0b2e71d2` documents RQ-03K isolated Preview acceptance against deployment `dpl_FVfhsD9n6SexZxWfrEx4MZoQ1Jm5` (research-only; not a DATABASE_URL proof).

---

## 3. Why Gate C is not yet PASS

Gate C requires proven **database** isolation (Prisma/`DATABASE_URL`), not only public Supabase URL divergence.

| Check | Result |
| --- | --- |
| Preview has a distinct `DATABASE_URL` Secret row vs Production | Visible in `vercel env ls` (separate rows) |
| Preview `DATABASE_URL` value fingerprint vs Production | **UNVERIFIABLE** with current CLI (Secrets not pulled/injected) |
| Risk if misconfigured | Preview could theoretically keep public URL on `emmzoeeaznhpwevqprkn` while `DATABASE_URL` still pointed at Production — **not disproven without secret attestation** |

Per programme rules: do not assume Hidden dual rows prove distinct connection strings; do not print secrets; do not share Production DB without Director approval.

---

## 4. Prepared remediation package (DO NOT APPLY until Director approves)

### Path A — Preferred (no mutation) if attestation succeeds

Director (or authorised operator) confirms **one** of:

1. Vercel Dashboard → Project `sovereign-ai-executive` → Preview `DATABASE_URL` username/host identifies project **`emmzoeeaznhpwevqprkn`** and **not** `kqptdgbttfuqkzxzbazw`; or  
2. Local one-time fingerprint with Secrets available (not to be committed), showing Preview `userProjectGuess === emmzoeeaznhpwevqprkn` and Production `=== kqptdgbttfuqkzxzbazw`.

**If Path A confirmed:** Gate C → **PASS** with **zero** env changes. Resume M2-PV2 using Preview env as-is for `cursor/autonomous-pipeline-lockdown-1605` (no need to rename branch to `preview/security-isolated` for DB reasons). Optional: use `preview/security-isolated` only if the APP_URL override is desired.

### Path B — Env mutation (only if Path A fails / Preview DB points at Production)

**STOP — requires explicit Director approval before any `vercel env` write.** Exact intended changes (values supplied by Director; agent must not invent credentials):

| Action | Environment | Git branch | Name | Intent |
| --- | --- | --- | --- | --- |
| Update or replace | Preview | _(none — generic Preview)_ | `DATABASE_URL` | Pooler URL for Supabase project **`emmzoeeaznhpwevqprkn`** only |
| Add or update | Preview | _(none)_ | `DIRECT_URL` | Direct/session URL for **`emmzoeeaznhpwevqprkn`** only ( presently listed for Production; Preview row was not listed) |
| Do **not** change | Production | — | `DATABASE_URL` / `DIRECT_URL` | Leave Production untouched |
| Do **not** require | Preview | `cursor/autonomous-pipeline-lockdown-1605` | branch-scoped DB overrides | Unnecessary if generic Preview DB is corrected |
| Optional only | Preview | `preview/security-isolated` | existing `OPENAI_API_KEY` / `NEXT_PUBLIC_APP_URL` | Leave unless Director wants APP_URL parity |

**Explicitly out of scope / prohibited without separate approval:** new Supabase project creation, migrations, proposed RLS SQL execution, Production env edits, push/deploy.

### Path C — Shared Production DB

**Not prepared.** Requires explicit Director written acceptance of shared-DB risk. Not recommended for M2-PV2.

---

## 5. Required Director actions (checklist)

1. **Choose Path A attestation** (preferred) or acknowledge Path B mutation need.  
2. If Path A: record attestation that Preview `DATABASE_URL` → `emmzoeeaznhpwevqprkn`.  
3. If Path B: approve the env table in §4 and supply secret values out-of-band for an authorised operator to apply.  
4. **Do not** authorise Production promote.  
5. After Gate C PASS, re-run M2-PV2 gates before any push (push still auto-deploys Preview).

---

## 6. Actions this agent took / did not take

| Done | Not done |
| --- | --- |
| Read-only Vercel env listing + public fingerprinting | Print or commit secrets |
| Restored local `.env` / `.env.local` after probe | Apply any `vercel env add/update` |
| Documented reuse of Preview isolation vs `preview/security-isolated` | Push / Preview deploy / Production deploy |
| Prepared Path A/B Director package | Create new infrastructure |

---

## 7. Final decision

**BLOCKED** for Gate C until Director completes Path A attestation (or Path B approval).  

Public Preview isolation evidence is strong and **reusable for the RC branch without new infra**; full Gate C PASS still requires Prisma `DATABASE_URL` confirmation that this agent cannot obtain via non-secret channels.

**STOP for Director approval / attestation.**

**Update:** FINAL Path A attempt recorded in `docs/editorial/M2_GATEC_PATHA_FINAL.md` — Gate C remains **BLOCKED**; Sensitive Preview `DATABASE_URL` is unreadable via authorised API/CLI; Preview `DIRECT_URL` missing. Path B Preview-only changes prepared (not applied). Director is not asked to attest unread secrets.
