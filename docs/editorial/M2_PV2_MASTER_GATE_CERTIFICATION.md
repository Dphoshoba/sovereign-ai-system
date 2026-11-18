# M2-PV2 MASTER — Gate Certification

**Date:** 2026-11-18  
**Director path:** **Path B APPROVED** (executed under mandate constraints)  
**RC app baseline:** `4ec255b8493e4b58b604d8f699c536a0fde7a996`  
**Evidence / HEAD at certification:** `58706c5c2dfd7b8ad9830c8db2f8a88879b0341b`  
**Branch:** `cursor/autonomous-pipeline-lockdown-1605`  
**Vercel project:** `davidoshoba-3659s-projects/sovereign-ai-executive`  
**Expected Preview Supabase:** `emmzoeeaznhpwevqprkn`  
**Forbidden Production Supabase:** `kqptdgbttfuqkzxzbazw`

### Master decision

**BLOCKED**

Production remains **NO-GO**.  
Preview remains **not authorised** for push / Preview deploy.

---

## A. Gate A — RC ancestry & worktree hygiene

| Check | Result | Evidence |
| --- | --- | --- |
| HEAD | `58706c5c` | `git rev-parse HEAD` |
| RC app baseline is ancestor of HEAD | **PASS** | `git merge-base --is-ancestor 4ec255b8 HEAD` → exit 0 |
| Remote tracking for RC branch | **ABSENT** | `git branch -r --list '*autonomous-pipeline*'` empty; local branch only |
| Dirty worktree | **Present (excluded)** | 31 porcelain lines of unrelated local WIP; **not** part of this certification commit |
| Push this run | **Not performed** | Mandate: no push / PR / Preview / Production deploy |

**Gate A verdict:** **PASS** for ancestry on certified commits; dirty tree is recorded and **excluded** from release scope. Remote absence is a **downstream blocker for Path B branch-specific env** (see §C), not an ancestry failure.

---

## B. Gate B — Preview Deployment Protection

| Probe | Result |
| --- | --- |
| Production `https://sovereign-ai-executive.vercel.app` | **307** → `/sovereign-ai` (public app redirect) |
| Team Preview host `https://sovereign-ai-executive-davidoshoba-3659s-projects.vercel.app` | **302** → `https://vercel.com/sso-api?...` + `X-Robots-Tag: noindex` |

**Gate B verdict:** **PASS** — anonymous Preview surface remains Vercel Authentication / SSO protected. (RC-specific Preview URL does not exist yet because the branch was never pushed; protection confirmed on the project Preview host.)

---

## C. Gate C — Preview DB isolation & Path B apply

### C.1 Pre-change inventory (unchanged after attempt)

| Variable | Preview | Production | RC branch override |
| --- | --- | --- | --- |
| `DATABASE_URL` | 1× **sensitive**, `gitBranch: null` | 1× **sensitive** | **None** |
| `DIRECT_URL` | **Missing** | 1× **sensitive** | **None** |
| `NEXT_PUBLIC_SUPABASE_URL` / anon | Present (maps to Preview project — prior Path A) | Production project | Generic Preview for RC |

### C.2 Path B execution (Director-approved)

**Intent:** Preview-only `DATABASE_URL` + `DIRECT_URL` for `emmzoeeaznhpwevqprkn`, prefer **RC branch-specific**, never Production `kqptdgbttfuqkzxzbazw`.

**Credential source (local, non-Vercel):** `C:\Users\David\echoes-visions-preview-security\.env.local`

| Candidate | Project ref | Host (masked) | Port | identitySha12 |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | `emmzoeeaznhpwevqprkn` | `***.pooler.supabase.com` | 5432 | `987cb5a976e5` |
| Derived `DIRECT_URL` | `emmzoeeaznhpwevqprkn` | `db.emmzoeeaznhpwevqprkn.supabase.co` | 5432 | `d22cae1dc678` |

Neither candidate contains Production ref `kqptdgbttfuqkzxzbazw`. **Secrets were not printed or committed.**

**Apply attempt:**

```text
vercel env add DATABASE_URL --environment preview --git-branch cursor/autonomous-pipeline-lockdown-1605 --sensitive
vercel env add DIRECT_URL   --environment preview --git-branch cursor/autonomous-pipeline-lockdown-1605 --sensitive
```

**CLI result (both):** **FAILED**

```text
remoteMessage: Branch "cursor/autonomous-pipeline-lockdown-1605" not found in the connected Git repository.
```

### C.3 Scope conflict / STOP

| Option | Allowed by mandate? | Outcome |
| --- | --- | --- |
| RC branch-specific Preview env | **Preferred** | **Impossible** until branch exists on connected Git remote |
| Push branch to create remote ref | **Forbidden** this run | Not done |
| Generic Preview `DATABASE_URL` / `DIRECT_URL` change | Would hit **all** Preview branches (no RC-only scope) | **STOP** — scope conflict; **not applied** |
| Production env change | **Forbidden** | Not touched (Production rows unchanged) |

**Post-change verify:** N/A — **zero** env mutations succeeded. Inventory after attempt identical to pre-change: Preview `DATABASE_URL` still generic Sensitive; Preview `DIRECT_URL` still missing.

**Gate C verdict:** **FAIL / BLOCKED**

---

## D. Gate D — No live social / Production-only social credentials

| Check | Result |
| --- | --- |
| Live social publish / OAuth exercise this run | **None** |
| `TWITTER_*` env rows | **Production only** (5 keys); **no Preview Twitter secrets** |
| `CRON_SECRET` | **Production only** |
| Facebook / Threads Preview secrets in env inventory | **Not listed** among 35 project env rows |

**Gate D verdict:** **PASS (process)** — no live social; Preview lacks Twitter credential rows.

---

## E. Cross-gate security & governance

| Control | Status |
| --- | --- |
| Publishing spine / Director gates (prior M2) | Unchanged this run; not weakened |
| Preview fail-closed guard `src/lib/preview-postgres.ts` | Still throws if Preview `DATABASE_URL` contains Production ref |
| Prisma datasource | `provider = postgresql` only; runtime uses `DATABASE_URL` via `databaseUrlForRuntime` |
| Agent auth surface (M2-SR1) | Prior remediation remains; not regressively edited this run |
| Sensitive secret policy | Unreadable Sensitive values **not** attested; Director not asked to guess unread secrets |
| Production promote / migration | **Not performed** |

Governance note: Path B approval was exercised **only** within branch-specific bounds. Generic Preview mutation was correctly **refused** to protect unrelated Preview branches.

---

## F. Tests, TypeScript, production build

| Gate | Result | Detail |
| --- | --- | --- |
| `npx tsc --noEmit` | **PASS** | exit 0 |
| `npm run build` | **PASS** | Next.js production build completed; exit 0 |
| `npm test -- --run` | **PARTIAL** | 3843 passed / 8 failed / 23 skipped across 280 files |

### F.1 Failed tests (not introduced by Path B; env unchanged)

| Suite | Failure class |
| --- | --- |
| `tests/editorial/research-audit-claim-selection-v15.test.ts` | 7 assertion failures (claim selection / dedupe expectations) |
| `tests/build/persistent-scheduler.test.ts` | 1 failure (scheduler start-on-import behaviour) |
| `tests/editorial/article-governance-postgres.concurrency.test.ts` | Suite fail: Docker Desktop engine unavailable (`dockerDesktopLinuxEngine` pipe missing) |

These failures do **not** clear Gate C. Even with green tests, Gate C would still block Preview authorisation until Path B lands safely.

---

## G. Prepared Preview deploy procedure (**DO NOT EXECUTE**)

Execute **only** after Director clears blockers and explicitly authorises Preview.

1. **Create remote RC branch** (required for branch-specific env): push `cursor/autonomous-pipeline-lockdown-1605` when authorised. Until then, Vercel rejects `--git-branch` overrides.
2. **Apply Path B branch-specific Preview env** (not generic):
   - Add/update Preview `DATABASE_URL` for git branch `cursor/autonomous-pipeline-lockdown-1605` → `emmzoeeaznhpwevqprkn` only.
   - Add Preview `DIRECT_URL` for the same git branch → same project.
   - **Do not** modify Production `DATABASE_URL` / `DIRECT_URL`.
3. **Verify (non-secret):** `vercel env ls` shows both rows with `gitBranch = cursor/autonomous-pipeline-lockdown-1605`; fingerprints / project-ref checks from the operator-held source; confirm Production rows untouched.
4. **Re-run Gates A–D** on the post-env state.
5. **Deploy Preview** only after Gate C **PASS** (push or `vercel deploy` per Director). Auto-deploy on push is expected — do not push early.
6. **Reconfirm Gate B** on the new RC Preview URL (anonymous **302** SSO).
7. **Keep Gate D:** no live social; no Production promote.

**This MASTER run stopped before step 1.**

---

## H. Decision record

| Axis | Decision |
| --- | --- |
| Path B apply | **Not completed** — branch-specific rejected (remote branch missing); generic Preview **STOP** |
| Gate A | **PASS** (ancestry + dirty exclusion) |
| Gate B | **PASS** (SSO 302) |
| Gate C | **FAIL / BLOCKED** |
| Gate D | **PASS (process)** |
| Tests / tsc / build | tsc **PASS**, build **PASS**, tests **PARTIAL** (8 fail) |
| Preview authorisation | **BLOCKED** — not READY FOR PREVIEW AUTHORISATION |
| Production | **NO-GO** |

### What would unblock READY FOR PREVIEW AUTHORISATION

1. Authorised **push** (or other Git presence) of `cursor/autonomous-pipeline-lockdown-1605` on the connected repository **or** Director-written acceptance of a **scoped** alternative that does not blanket all Preview branches.  
2. Successful Path B Preview-only `DATABASE_URL` + `DIRECT_URL` for `emmzoeeaznhpwevqprkn` with post-change verification.  
3. Gate C **PASS**, then Gates A/B/D reconfirm, then explicit Preview deploy authorisation.

### Mutations this run

| Action | Done? |
| --- | --- |
| Vercel env add/update/rm | **No** (attempts failed; no successful write) |
| Git push / PR | **No** |
| Preview deploy | **No** |
| Production deploy / promote | **No** |
| Local commit of this certificate | **Yes** (cert doc only) |

---

**Final line:** **BLOCKED.** Production **NO-GO.** Awaiting remote RC branch presence + completed Path B isolation before Preview authorisation.
