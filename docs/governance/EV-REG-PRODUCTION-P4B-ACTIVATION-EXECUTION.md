# EV-REG Production P4B — Controlled Verifier Activation

Status: **EXECUTED — Production versioned verifier activated.**  
Does **not** authorise article Prepare, approval, scheduling, publication, DDL, push, or retagging.  
Next gate: **certification review / programme closure** (separate human approval).

**Supersedes:** the “not executed” activation steps in `EV-REG-PRODUCTION-P4-ACTIVATION-READINESS.md` for execution outcome only (P4A readiness remains the pre-activation baseline).  
**Linked from:** `.agents/skills/echoes-visions-autonomous-engineering/SKILL.md` and `docs/governance/EV-REG-PRODUCTION-ROLLOUT-PLAN.md`.  
**User instruction (verbatim):** “Execute this instruction only after explicit human approval of P4B.” / “Enable the versioned editorial verifier in Production.” / “Redeploy the exact approved application revision.” / “Commit evidence locally only. Do not push.” / “Stop after P4B.”

## Preflight (passed)

| Check | Result |
|---|---|
| Prior deployment | `dpl_69y1DZGtH3X74UsVB4i91QLAp85L` Ready @ `8be3605f…` |
| Aliases (before) | www / apex / vercel.app on prior deployment |
| Health (before) | `200` `versionedEditorialVerifierEnabled=false` / `article-grounded-v14` |
| `/api/articles` | `401` |
| Flag on Production | **absent** (Preview only) |
| `DATABASE_URL` / `DIRECT_URL` | present on Production |
| P2 columns | present; 107 audits; 0 versioned rows |
| Cron in pin `vercel.json` | `/api/cron/run-pipeline` @ `0 0 * * *` |
| Local docs HEAD | `65835f14…` (not deployed) |

## Activation actions

### 1. Environment variable (Production only)

| Field | Value |
|---|---|
| Name | `VERSIONED_EDITORIAL_VERIFIER_ENABLED` |
| Value | `true` (set via `npx vercel env add … --environment production --value true`) |
| Target | **Production** only |
| Preview | unchanged (still present) |
| Other env vars | unchanged (`DATABASE_URL` / `DIRECT_URL` timestamps unchanged in listing) |

Secret values cannot be re-pulled from Production. Exact `true` was confirmed by staged and public health reporting `versionedEditorialVerifierEnabled: true` (runtime gate is `=== "true"`).

### 2. Redeploy approved pin

| Field | Value |
|---|---|
| Source SHA | `8be3605f93da8df77d5cb54db9d69f71ef3f5761` |
| Method | Clean detached worktree at pin → `npx vercel deploy --prod --skip-domain --yes --project sovereign-ai-executive` |
| Staged deployment | `dpl_7Kdm6gQxWDnFGpyRVpzmXhqzwpb7` |
| Staged URL | `https://sovereign-ai-executive-pv2lkayma-davidoshoba-3659s-projects.vercel.app` |
| Staged Ready | Ready |
| Staged SHA (API) | `8be3605f93da8df77d5cb54db9d69f71ef3f5761` |
| Staged health (`vercel curl`) | `{"ok":true,"versionedEditorialVerifierEnabled":true,"researchAuditEngineRevision":"article-grounded-ev-reg-1"}` |
| Public aliases before promote | still on prior deploy (`false` / `v14`) |
| Promote | `npx vercel promote dpl_7Kdm6gQxWDnFGpyRVpzmXhqzwpb7 --yes` → Success |

Docs HEAD was **not** deployed.

## Post-activation verification

| Check | Result |
|---|---|
| Production target | `dpl_7Kdm6gQxWDnFGpyRVpzmXhqzwpb7` (project `targets.production`) |
| Ready | **READY** |
| Source SHA | `8be3605f93da8df77d5cb54db9d69f71ef3f5761` |
| Domains verified | `www.echoesandvisions.com`, `echoesandvisions.com`, `sovereign-ai-executive.vercel.app` |
| Health www | `200` `{"ok":true,"versionedEditorialVerifierEnabled":true,"researchAuditEngineRevision":"article-grounded-ev-reg-1"}` |
| Health vercel.app | `200` same payload |
| `/api/articles` | `401` |
| Flag listing | Present on Production + Preview; no other env changes observed |
| DB identity | Production ref `kqptdgbttfuqkzxzbazw`; `transaction_read_only=on` |
| P2 columns | still present |
| Audits | **107** rows; **0** versioned / disputes non-null (intact; no Prepare) |
| Cron | unchanged `0 0 * * *` → `/api/cron/run-pipeline` |
| Article ops | **none** initiated |
| Rollback performed | **No** |

## Rollback reference (unused)

1. Remove or set Production `VERSIONED_EDITORIAL_VERIFIER_ENABLED` away from `true`.
2. Redeploy approved pin `8be3605f…` (or restore prior Ready deploy `dpl_69y1DZGtH3X74UsVB4i91QLAp85L` / documented `dpl_DnQpxYFh…` @ `3ade3125…` if application rollback required).
3. Verify health `false` / `article-grounded-v14` and `/api/articles` `401`.
4. Leave P2 columns; do not delete audits.

## Out of scope (not done)

- Prepare for Review / approve / schedule / publish
- Database migrations / DDL
- Additional environment changes beyond the single Production flag
- Remote push / release retagging

## Remaining risks

1. Future authorised Prepare will write versioned audits under the fail-closed publication guard.
2. Midnight UTC cron continues and can publish already-eligible approved/scheduled articles.
3. Certification / programme closure still required before treating Production as EV-REG certified.

## Verdict

**EV-REG PRODUCTION P4B ACTIVATION COMPLETE — CERTIFICATION REVIEW REQUIRED**
