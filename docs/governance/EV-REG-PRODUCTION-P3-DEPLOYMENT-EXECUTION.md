# EV-REG Production P3 — deployment execution

Status: **EXECUTED — Production application deployed with verifier disabled.**  
Does **not** authorise P4 flag enablement, article operations, database DDL, or env changes. Next gate: **P4**.

Linked from `.agents/skills/echoes-visions-autonomous-engineering/SKILL.md` and `docs/governance/EV-REG-PRODUCTION-ROLLOUT-PLAN.md`.  
Supersedes the “not deployed” status in `EV-REG-PRODUCTION-P3-DEPLOYMENT-PREFLIGHT.md` for execution outcome only.  
User: “Deploy exactly: 8be3605f… To the Vercel Production project: sovereign-ai-executive” / “Record… Commit evidence locally only.”

## Deployment identity

| Field | Value |
|---|---|
| Vercel project | `sovereign-ai-executive` (`prj_ogfO2yCJl7motADB98mCobU2Aviq`) |
| Team / account | `team_ZcCbd7y5UO4K9YHwaLGg6qug` / `davidoshoba-3659` |
| Deployed source SHA | `8be3605f93da8df77d5cb54db9d69f71ef3f5761` |
| Deployment ID | `dpl_69y1DZGtH3X74UsVB4i91QLAp85L` |
| Deployment URL | `https://sovereign-ai-executive-a9547ntdn-davidoshoba-3659s-projects.vercel.app` |
| Ready state | Ready |
| Target | production |
| Method | Clean detached worktree at pin → `npx vercel deploy --prod --yes --project sovereign-ai-executive` |
| Local docs HEAD (not deployed) | docs commits after the pin (including P3 preflight) |

## Alias state

Production aliases point at the new deployment:

- `www.echoesandvisions.com`
- `echoesandvisions.com`
- `sovereign-ai-executive.vercel.app`
- `sovereign-ai-executive-davidoshoba-3659s-projects.vercel.app`

## Preflight (reconfirmed before deploy)

- Candidate SHA present; worktree HEAD = `8be3605f…`; no `.env*` / `.next` in upload tree
- Prior Production: `dpl_DnQpxYFhBihvAuhmGRqxoLrP6XXE` @ `3ade3125…`
- Flag absent from Production; `DATABASE_URL` / `DIRECT_URL` Production timestamps unchanged from credential cleanup
- Health `200`; `/api/articles` `401`
- Build script is `prisma generate` + Next build — **no** migrate/db push
- Cron unchanged (`0 0 * * *` → `/api/cron/run-pipeline`)

## Post-deployment verification

| Check | Result |
|---|---|
| New deployment Ready | Yes — `dpl_69y1DZGtH3X74UsVB4i91QLAp85L` |
| Source SHA | `8be3605f93da8df77d5cb54db9d69f71ef3f5761` |
| Aliases on new deploy | Yes |
| Health (www + vercel.app) | `200` `{"ok":true,"versionedEditorialVerifierEnabled":false,"researchAuditEngineRevision":"article-grounded-v14"}` |
| `/api/articles` | `401` |
| Verifier env on Production | still absent (Preview only) |
| Calendar / Slack `connector:validate` | 100/100 each |
| Env URL timestamps | `DATABASE_URL` / `DIRECT_URL` unchanged (`2026-11-15T11:11:43Z` / `11:56:46Z`) |
| DB identity (read-only) | `postgres.kqptdgbttfuqkzxzbazw` @ Session pooler; P2 columns still present; no DDL this phase |
| Rollback performed | **No** |

## Out of scope (not done)

- `VERSIONED_EDITORIAL_VERIFIER_ENABLED` on Production (P4)
- Article Prepare / approve / schedule / publish
- Prisma migrate / db push / schema DDL
- Environment variable changes
- Remote push / release retagging

## Rollback target (unused)

`dpl_DnQpxYFhBihvAuhmGRqxoLrP6XXE` @ `3ade3125afda7399bb23874d840e03abb5ff0b11`  
Leave P2 nullable columns in place if rollback is ever required.

## Remaining risks

1. EV-REG codepath is live but dormant — P4 must not proceed without separate approval and smoke proof of current dormancy.
2. Existing midnight UTC cron continues on the new binary.
3. Calendar `ApiClient.read()` shipped with the candidate (accepted P3 pin scope).

## Verdict

**EV-REG PRODUCTION P3 DEPLOYMENT COMPLETE — P4 APPROVAL REQUIRED**
