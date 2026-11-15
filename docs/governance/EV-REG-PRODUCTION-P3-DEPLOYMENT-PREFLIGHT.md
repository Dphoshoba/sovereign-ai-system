# EV-REG Production P3 — deployment preflight

Status: **PREFLIGHT PASSED; deployment recorded separately.**  
Execution evidence: `docs/governance/EV-REG-PRODUCTION-P3-DEPLOYMENT-EXECUTION.md`. This preflight remains the reviewed plan. It does **not** authorise P4 flag enablement or article operations.

Linked from `.agents/skills/echoes-visions-autonomous-engineering/SKILL.md` and `docs/governance/EV-REG-PRODUCTION-ROLLOUT-PLAN.md`.  
Supersedes: nothing — new P3 preflight package after P2 execution (`EV-REG-PRODUCTION-P2-MIGRATION-EXECUTION.md`).  
User: “Prepare a controlled Production application deployment… Do not deploy until explicit human approval.” / “Create: docs/governance/EV-REG-PRODUCTION-P3-DEPLOYMENT-PREFLIGHT.md”

## 1. Repository and governance

| Field | Value |
|---|---|
| Worktree | `C:\Users\David\echoes-visions-preview-security` |
| Branch | `integrate/production-research-integrity` |
| Local HEAD at preflight | `055a816f11dfd5a8cf9ade20f8c3d26e52ae2199` (clean) |
| Certified Preview tag | `ev-reg-1.0.0-preview-certified` → `d8f59aceac3bdc775760a8bc4d076eb1e1d9074d` |
| Spec SHA-256 | `9D3C34F1689BBC0DB673A5E0A3B79A11B343C2792D4F9179BFA8E29E5ECC2419` (unchanged) |
| Previously proposed application candidate | `8be3605f93da8df77d5cb54db9d69f71ef3f5761` |

### Commits since certified Preview (`d8f59ace…` → HEAD)

Application / CI (before candidate pin):

- Connector CI Supabase placeholders + `workflow_dispatch`
- Calendar `ApiClient.read()` + tests
- Governance docs for those remediations

After candidate `8be3605f…` → HEAD `055a816f…`: **documentation and skills only** (P0–P2 Production programme evidence). **No further application code.**

### Exact deployable commit

**Proposed Production deploy SHA: `8be3605f93da8df77d5cb54db9d69f71ef3f5761`**

Do **not** treat local HEAD `055a816f…` as the approved application pin: it only adds governance docs/skills on top of the candidate. The **authoritative application pin remains `8be3605f…`**.

## 2. Production baseline (verified this preflight)

| Check | Result |
|---|---|
| Vercel project | `sovereign-ai-executive` (`prj_ogfO2yCJl7motADB98mCobU2Aviq`) |
| Current Production deployment | `dpl_DnQpxYFhBihvAuhmGRqxoLrP6XXE` (`5b2doqdfl`) — **Ready** |
| Production commit | `3ade3125afda7399bb23874d840e03abb5ff0b11` |
| Aliases | `www.echoesandvisions.com`, `echoesandvisions.com`, `sovereign-ai-executive.vercel.app` |
| Health | `GET /api/health` → `200` `{"ok":true}` (no verifier keys — pre-candidate binary) |
| Protected API | `GET /api/articles` → `401` |
| `VERSIONED_EDITORIAL_VERIFIER_ENABLED` | Preview only — **absent from Production** |
| `DATABASE_URL` Production | present; last updated `2026-11-15T11:11:43Z` (value not retrieved) |
| `DIRECT_URL` Production | present; last updated `2026-11-15T11:56:46Z` (value not retrieved) |
| Schema compatibility | P2 executed: nullable `specificationVersion` / `disputes` present on Production `ArticleResearchAudit` — compatible with Prisma model on the candidate |

Secrets were not printed or pulled.

## 3. Deployment effects review (`3ade3125…` → `8be3605f…`)

Production is an ancestor of the candidate. Deploying `8be3605f…` introduces the certified EV-REG application stack plus connector CI remediations relative to the live Production binary.

| Area | Effect | Risk |
|---|---|---|
| Versioned research / Prepare | Code present; **runtime path stays `article-grounded-v14` while flag ≠ `true`** | Low if flag remains unset |
| Health payload | Adds `versionedEditorialVerifierEnabled` and `researchAuditEngineRevision` | Expected; must read `false` / `article-grounded-v14` after P3 |
| Publication guard | Calls `versionedPublicationMetadataProblem` only when `specificationVersion` is non-null | Compatible with P2 null baseline audits |
| Calendar connector | Adds authenticated `ApiClient.read()` for contract validation | Unrelated to editorial Prepare; known candidate delta |
| Prisma | Schema already declares nullable versioned fields; **build runs `prisma generate` only** — no migrate/deploy in `npm run build` | Schema already migrated in P2 |
| Cron / schedulers | `vercel.json` still `0 0 * * *` → `/api/cron/run-pipeline` | No new schedule; existing midnight UTC cron continues |
| Auth / private APIs | No intentional auth-bypass changes identified; anonymous `/api/articles` must remain `401` | Verify in post-deploy smoke |
| Other Vercel projects | Deploy must target **only** `sovereign-ai-executive` | Do not retarget Preview/other projects |
| Verifier enablement | Compile-time constant `false`; env gate requires exact `"true"` | Must **not** add Production flag during P3 |

**No blocker** identified that prevents seeking P3 deployment approval, provided the flag stays unset and the deploy pin is `8be3605f…`.

## 4. Candidate verification (ran at worktree HEAD; app identical to `8be3605f…`)

| Check | Result |
|---|---|
| EV-REG regression (7 files) | **54 passed** |
| Connector unit tests (calendar + slack) | **58 passed** |
| `connector:validate --name=calendar` | **100/100** |
| `connector:validate --name=slack` | **100/100** |
| `tsc --noEmit --incremental false` | **exit 0** |
| `npm run build` (CI placeholders; `VERSIONED_EDITORIAL_VERIFIER_ENABLED` unset) | **exit 0** — compiled; 656 static pages |

Build credentials used only `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` CI placeholders — not Production or Preview secrets.

## 5. Proposed deployment procedure (for approval — not executed)

### Pin and target

- **Commit:** `8be3605f93da8df77d5cb54db9d69f71ef3f5761`
- **Project:** `sovereign-ai-executive`
- **Environment:** Production (`--prod` only after explicit approval)
- **Method:** controlled Vercel Production deploy from a **clean isolated checkout** of the pin. Prefer `npx vercel deploy --prod --yes` against the linked project **only when human-approved**. Reconfirm aliases before/after.

### Required environment configuration (no changes in P3)

| Variable | Required Production state |
|---|---|
| `VERSIONED_EDITORIAL_VERIFIER_ENABLED` | **absent / not `true`** |
| `DATABASE_URL` / `DIRECT_URL` | unchanged (already rotated) |
| Public Supabase pair | existing Production values |

Do **not** modify Vercel env during P3.

### Expected post-deploy effects

- Health becomes `{"ok":true,"versionedEditorialVerifierEnabled":false,"researchAuditEngineRevision":"article-grounded-v14"}` (or equivalent)
- Anonymous `/api/articles` remains `401`
- Prepare continues to write `article-grounded-v14`
- Existing audits with null `specificationVersion` remain under legacy publication rules (versioned metadata gate no-ops)
- Production aliases move to the new Ready deployment

### Production smoke tests (after approved deploy)

1. Deployment Ready; commit SHA = `8be3605f…`
2. Aliases still on `www.echoesandvisions.com` / `echoesandvisions.com` / `sovereign-ai-executive.vercel.app`
3. `GET /api/health` → `200` with verifier **false** and revision **v14**
4. `GET /api/articles` → `401`
5. Confirm Production flag still absent
6. Spot-check logs for DB auth failures (no secret print)
7. Stop — no Prepare / publish / flag enablement

### Rollback target

- **Immediate rollback deployment:** `dpl_DnQpxYFhBihvAuhmGRqxoLrP6XXE` @ `3ade3125afda7399bb23874d840e03abb5ff0b11`
- Leave nullable columns in place
- Flag must remain unset

### Stop conditions

- Deploy SHA ≠ approved pin
- Production flag present or health shows verifier enabled / `article-grounded-ev-reg-1`
- Health not `200` / DB disconnected
- Protected routes no longer return expected auth denial
- Aliases drift to unexpected deployment
- Any article Prepare/approve/schedule/publish requested as part of P3
- Pressure to run Prisma migrate or schema DDL during deploy

### Recovery

1. Redeploy/promote rollback target `dpl_DnQpxYFhBihvAuhmGRqxoLrP6XXE` with human approval
2. Re-run health + 401 smoke tests
3. Leave P2 columns in place
4. Do not delete audits; do not retag certified Preview release

## 6. Remaining risks

1. **Large behavioural surface** vs live Production (`3ade3125…`) — entire EV-REG codepath ships dormant behind the flag; smoke must prove dormancy.
2. **Calendar `read()`** ships with the candidate — accepted candidate scope unless approval narrows the pin.
3. **Midnight UTC cron** continues unchanged — monitor if cutover is near the window.
4. Local HEAD docs commits are **not** the runtime pin — operators must deploy `8be3605f…` explicitly.

## 7. Approval gate

| Gate | Authorises | Does not authorise |
|---|---|---|
| **P3 preflight** (this document) | Documentation + validation evidence | Any Production deploy |
| **P3 deployment** (required next) | Production deploy of `8be3605f…` with flag unset | Flag enablement, article ops, env changes |
| **P4** | Flag enablement after P3 verification | Editorial Prepare/approve/schedule/publish |

**Required human approval:** **P3 — deploy Production candidate `8be3605f93da8df77d5cb54db9d69f71ef3f5761` with `VERSIONED_EDITORIAL_VERIFIER_ENABLED` unset.**

## Verdict

**EV-REG PRODUCTION P3 PREFLIGHT PASSED — DEPLOYMENT APPROVAL REQUIRED**
