# M2-PR3 — Database Compatibility Certification & Release Closure

**Date:** 2026-11-18  
**App RC (Preview-certified):** `6258cada` · dpl `dpl_2qScTYYwxAycMF1c74z6yomcgfgK`  
**Prior:** PR2 `6d397b39` (HOLD on schema)  
**Branch:** `cursor/autonomous-pipeline-lockdown-1605`  
**Nature:** Schema reconcile + read-only compare + prepared migration. **No** Production/Preview SQL apply, push, social, or Production deploy.

### Final verdict (for Director)

| Axis | Result |
| --- | --- |
| Schema delta reconciled | **PASS** — exact additive SQL generated (`main` → `6258cada`) |
| Preview DB vs RC schema | **PASS** — Connector\* + `isTest` **already present** (read-only) |
| Production DB vs RC schema | **GAP CONFIRMED** (prior audit) / **fresh probe blocked** (stale local Production password) |
| Smallest migration prepared | **YES** — not applied |
| Isolated Docker apply verify | **NOT RUN** — Docker Desktop engine **Stopped** |
| RC app integrity | **PRESERVED** — no change to `6258cada` app tree; proposed SQL is docs artefact |
| Production promote now | **HOLD / NO-GO** until §7 cleared |
| Recommendation | **HOLD** |

**STOP.** Awaiting Director **GO / HOLD / NO-GO**.

---

## 1. Schema reconciliation (`origin/main` → `6258cada`)

| Item | Detail |
| --- | --- |
| Diff method | `prisma migrate diff --from-schema <main> --to-schema <6258cada> --script` |
| Migration files in `main..RC` | **None** |
| Schema file delta | **+198 lines** |
| Objects | 6× `isTest BOOLEAN NOT NULL DEFAULT false` on Client\*/Creator\* tables; 7× `Connector*` tables + indexes + FKs |
| SQL classification | **Additive only** — no `DROP` / `TRUNCATE` / `DELETE` |

Prepared artefacts (unapplied):

- `docs/security/proposed/20261118_add_connectors_and_istest.sql`
- `docs/security/proposed/20261118_add_connectors_and_istest_rollback.sql`

---

## 2. Read-only structure compare

### 2.1 Preview (`emmzoeeaznhpwevqprkn`) — **PASS**

`BEGIN TRANSACTION READ ONLY` … `ROLLBACK` via Preview `DATABASE_URL` from preview-security worktree:

| Object class | Present? |
| --- | --- |
| `Connector`, `ConnectorConnection`, `ConnectorAction`, `ConnectorExecution`, `ConnectorApproval`, `ConnectorAudit`, `ConnectorCredential` | **All true** |
| `isTest` on ClientProfile/Project/Task/Invoice + CreatorLead/Proposal | **All true** |

Preview RC runtime and Preview DB are **schema-compatible** for this delta (explains healthy Preview without a new migration on that project).

### 2.2 Production (`kqptdgbttfuqkzxzbazw`) — **GAP / probe limited**

| Source | Finding |
| --- | --- |
| Prior audit `review-artifacts/production-prisma-reconciliation-audit.md` | Production **lacks** the seven Connector tables and six `isTest` columns; also missing `_prisma_migrations` ledger historically |
| Fresh probe this run | Local Production URL in repo `.env` failed auth (`28P01 password authentication failed`); configured path `~/.config/echoes-visions/production-db.env` is **not** a usable KEY=value secret file (110-byte non-kv). **No Production DDL attempted.** |

**Conclusion:** Treat Production as **still requiring** the prepared forward migration unless Director supplies working read-only credentials and a new probe shows objects already present.

---

## 3. Isolated verification status

| Check | Result |
| --- | --- |
| SQL generate from schemas | **PASS** |
| Additive-only static review | **PASS** |
| Disposable Docker PostgreSQL apply | **BLOCKED** — `com.docker.service` **Stopped**; daemon pipe missing |
| Apply to Preview | **Not authorised / not done** |
| Apply to Production | **Not authorised / not done** |

Next authorised verify path: start Docker → apply proposed SQL to disposable PG16 → smoke Prisma client against Connector/`isTest` → only then schedule Production apply under Director auth.

---

## 4. RC integrity

| Check | Result |
| --- | --- |
| Remote app SHA | Still `6258cada` |
| Prisma schema / migrations on RC tip | Unchanged by this certification |
| Proposed SQL location | `docs/security/proposed/*` only (not inserted into `prisma/migrations` on the certified tip) |
| Dirty unrelated WIP | Still present locally — **exclude** from any promote package |

Landing the SQL into `prisma/migrations` on the branch would create a **new app SHA** and require a **new Preview** before Production GO. That was intentionally avoided to preserve the Preview-certified tip.

---

## 5. Carry-forward from PR2 (unchanged dispositions)

| Item | Status |
| --- | --- |
| Claim-selection-v15 | **WAIVED** (intentional gap suite) |
| Concurrency Docker suite | **WAIVED** (env) |
| Twitter/CRON safety plan | **DOCUMENTED** — still no invoke |
| SR1 / Preview PASS | **Stand** |

---

## 6. Release closure plan (authorised sequence only)

1. **Director** refreshes usable Production DB credentials (read-only first).  
2. Re-run structure probe; if objects already exist → skip apply; else continue.  
3. **Director authorises** disposable/local apply verify of `20261118_add_connectors_and_istest.sql`.  
4. **Director authorises** Production apply of the same SQL (maintenance window; social/cron freeze from PR2).  
5. Read-only confirm Production Connector/`isTest` present; keep rollback SQL ready.  
6. **Director authorises** Production promote of app SHA **`6258cada`** only.  
7. Post-promote smoke (health, auth 401s, no social). Rollback app deploy if needed; schema rollback only under separate emergency auth.

---

## 7. Conditions for Production **GO**

| # | Condition | Status |
| --- | --- | --- |
| 1 | Director Production promote auth naming `6258cada` | Open |
| 2 | Dirty WIP excluded | Plan ready |
| 3–5 | PR2 waivers / SQL exclusion of unrelated proposals | Accepted in PR2/PR3 |
| 6 | Behavioural delta accepted | Open |
| 7 | Social/cron freeze | Plan ready |
| 8 | Smoke + rollback owner | Open |
| 9 | Production schema has Connector\* + `isTest` (apply proposed SQL or prove present) | **OPEN — HOLD** |
| 10 | Isolated apply verify completed (Docker/disposable) **or** Director explicit waive | **OPEN — HOLD** |

---

## 8. Decision request

1. **GO** — only after §7.9 (and preferably §7.10) cleared, then promote `6258cada`.  
2. **HOLD** — keep Production; authorise credential refresh + migration verify/apply programme next (**recommended**).  
3. **NO-GO** — stop release track; Preview RC remains validation-only.

**PR3 recommendation:** **HOLD**. Preview DB is compatible; Production is not certified without migration apply or a successful fresh structure attestation.

---

## 9. Mutations this run

| Action | Done? |
| --- | --- |
| Production/Preview SQL apply | **No** |
| Push / social / Production deploy | **No** |
| App code / RC SHA change | **No** |
| Proposed SQL + certification docs (local commit) | **Yes** |

---

**Final line:** Production **HOLD / NO-GO**. Migration **prepared**, **not applied**. Preview schema **compatible**. **STOP** for Director decision.
