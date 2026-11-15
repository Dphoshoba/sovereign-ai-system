---
name: echoes-visions-autonomous-engineering
description: Autonomous engineering workflow for Echoes & Visions research-governance milestones. Use when implementing an approved EV-REG milestone, inspecting the release worktree, or handing work to Grok, BlackBoxAI, Cursor, Codex, or a later engineering agent. Read this before changing research, audit, or publication code.
---

# Echoes & Visions — Autonomous Engineering and Governance Workflow

Release worktree: `C:\Users\David\echoes-visions-preview-security`. Branch: `integrate/production-research-integrity`. Editorial publication safety stays in `.agents/skills/echoes-visions-editorial-operations/SKILL.md`. Governing contract: `docs/governance/EV-REG-SPEC-1.0.0.md`. Do not copy that specification into this skill.

## A. Operating principles

Impact over automation, then scalability. Inspect the repository before changing it. The production baseline at `d654d85c1583b1fe426d65052d991c3a5c967a14` stays frozen until an authorised Production programme replaces it. Preserve the adopted specification bytes. Finish the authorised milestone before asking for routine approval. Human approval remains at genuine authority boundaries: remote push, deployment, unverified database access, persistent migrations, production data, specification edits, publication thresholds, historical audit rewrites, Prepare for Review, article approval, scheduling, and publication.

## B. Repository discovery

Confirm the worktree, branch, full HEAD, and whether the tree is clean. Confirm the specification SHA-256 is `9D3C34F1689BBC0DB673A5E0A3B79A11B343C2792D4F9179BFA8E29E5ECC2419`. Read the implementation that already exists before proposing a new one.

Completed and must not be restarted:

- EV-REG Preview milestones 3N–4D, Preview schema migration, Preview activation, and Preview programme closure
- Connector CI maintenance (PR #1) and Calendar `read()` remediation (PR #2) merged into the integration branch

Evidence roots:

- Certified Preview: `docs/releases/EV-REG-1.0.0-PREVIEW-CERTIFIED.md` (tag `ev-reg-1.0.0-preview-certified` → `d8f59aceac3bdc775760a8bc4d076eb1e1d9074d`)
- Preview activation: `docs/governance/EV-REG-PREVIEW-ACTIVATION.md`
- Preview migration: `docs/governance/EV-REG-3Y-MIGRATION-EXECUTION.md`
- Connector integration: `docs/governance/EV-REG-CONNECTOR-CI-INTEGRATION.md`
- Production programme plan: `docs/governance/EV-REG-PRODUCTION-ROLLOUT-PLAN.md`

Do not treat the current integration HEAD as Production-certified. Production keep the versioned flag unset until an explicit Production activation gate.

## C. Research governance

Follow EV-REG-SPEC-1.0.0 for publisher identity, canonicalisation, independent corroboration, full-claim substantiation, primary-source restrictions, dispute precedence, resolution and expiry, historical audit compatibility, publication thresholds, and separate human approval. Baseline audits stay on the baseline gate. A primary-source-supported claim is not a publication exception. Thresholds remain consensus 80 and source quality 70.

## D. Testing workflow

Characterise current behaviour before changing it. Keep future-contract files out of the Vitest include until the milestone that implements them. Use deterministic fixtures. Run the targeted test, then the full `tests/editorial` suite, before committing. Confirm Docker responds before the disposable PostgreSQL suite. A hook timeout after a cold daemon is an infrastructure failure. Do not weaken an assertion or skip a test. Raise a timeout only after a measurement shows the existing cap is the failure, and record that measurement.

## E. Database safety

Verify database identity before connecting. Do not treat an environment-variable name as proof that a database is non-Production. Reject any URL that identifies Supabase project `kqptdgbttfuqkzxzbazw` when the authorised target is Preview. Never print credentials. Inspect live metadata before writing a migration. `prisma/schema.prisma` contains `ArticleResearchAudit` and `ArticleReviewNote`, and the tracked migration history does not create them. Prefer additive nullable columns. Roll an additive change back by deploying the previous code first and leaving the columns in place. Do not execute a Production migration without explicit approval.

The Milestone 3Y columns exist on the verified Preview database (`emmzoeeaznhpwevqprkn`) and, after Production P2, on Production (`kqptdgbttfuqkzxzbazw`) as the same nullable pair. Both changes used an explicit transaction with a 5-second lock timeout, not a Prisma diff. Do not copy them into `prisma/migrations`. Do not derive a further change from the incomplete migration history.

## F. Engineering execution

Plan the whole authorised milestone. Implement, test, and correct failures caused by that work. Inspect the full diff for secrets and unrelated files. Commit locally only after verification. Report evidence. Stop at the next authority boundary.

## G. Incident lessons

- Docker Desktop can take longer than the 120-second PostgreSQL hook on a cold start. Confirm `docker version` before rerunning that test. Do not delete unrelated containers.
- The disposable database on port 55432 is a test fixture. It is not live schema verification.
- Missing `DATABASE_URL` in this worktree is a blocker, not an invitation to copy credentials from another checkout.
- Baseline `publishersForSource` still accepts a publisher name in a title. The versioned identity uses the hostname registry only.
- Baseline unattributed claims can still count two hostnames of one organisation as two identities. `evaluateVersionedClaim` collapses those hosts.
- Overlapping contradictory text can still score as support on the baseline matcher. A matcher average can omit zero scores. The consensus average is computed and is not returned on the result. Legacy publication JSON sets `articlePublicationAuthorised` to false and cannot authorise an article.
- The editor-boundary test walks every privileged handler after the gate. Under full-suite load it measured 301 seconds against a 300-second cap. That one cap is now 420 seconds. Isolated runs already finished. Do not raise it again without a new measurement.
- A local `npm run build` stops during static generation when the public Supabase URL and key are unset. Do not copy Production credentials in to make that prerender pass.
- `.gitignore` already ignores `.env*`, including `.env.local`. Confirm the URL host is `emmzoeeaznhpwevqprkn.supabase.co` and decode only the anon JWT payload: `ref` must be that project and `role` must be `anon`. Do not print the token. A successful build with those public settings is not a database connection.
- The build rewrites tracked `gamma/research/index.json`. Restore that generated timestamp unless the index itself is the change.
- Turbopack can warn that a parent `pnpm-lock.yaml` is the workspace root, and Next can warn that `middleware` is deprecated. Neither warning failed the verified Preview build. Do not change them while checking credentials.
- The Supabase pooler username `postgres.emmzoeeaznhpwevqprkn` opens a session whose `current_user` is `postgres`. Confirm the project ref on the URL before connecting. An absent `sslmode` is acceptable when the pinned CA verifies the certificate. Keep an inspection in `BEGIN READ ONLY` and `ROLLBACK`. A write needs its own transaction, a bounded `lock_timeout`, a metadata recheck, and a rollback path before commit. The inspection role can write and bypasses row security.
- The disposable article-governance database must include the same nullable `specificationVersion` and `disputes` columns as the Prisma model. Historical schema-diff tests allow only those additions and still require an empty migration diff.
- Controlled Preview deploy uses `npx vercel deploy --yes` against the existing `sovereign-ai-executive` project. Never pass `--prod` unless a Production programme explicitly authorises it. Confirm `environment` is `preview` and `productionUrl` is null for Preview. Production aliases for `www.echoesandvisions.com` must remain on the intended Production deployment. `vercel link` can rewrite ignored `.env.local`; re-check identity afterwards. Vercel Secrets cannot be pulled; rely on public settings, the `databaseUrlForRuntime` guard, and post-deploy probes. Deployment Protection requires `vercel curl` for Preview checks.
- Versioned Prepare activation is gated by env `VERSIONED_EDITORIAL_VERIFIER_ENABLED=true`. The compile-time default stays false. `/api/health` on builds that include the activation commit reports the non-secret flag boolean and the revision Prepare would write. Do not set the flag on Production without a separate approval.
- Connector CI workflows require CI-only Supabase placeholders on the build step. Path filters skip workflow-only pushes; `workflow_dispatch` is available. Calendar validation requires `async read(` on the Calendar api-client.
- Vercel Production secrets (including `DATABASE_URL`) cannot be pulled into the worktree; `vercel env pull --environment production` writes `[SENSITIVE]` placeholders. Do not treat a successful public Supabase URL/JWT ref check as permission to connect. Do not reuse Preview `DATABASE_URL` for Production P1.
- Approved out-of-repo Production DB URL path: `C:\Users\David\.config\echoes-visions\production-db.env` (raw URL or env assignment). Never print it. Identity must show username `postgres.kqptdgbttfuqkzxzbazw` and must not contain Preview ref `emmzoeeaznhpwevqprkn`. Production pooler host observed as `aws-1-ap-southeast-2.pooler.supabase.com` (Preview used `aws-0-…`). Use pinned CA; require `transaction_read_only=on` before metadata queries; always `ROLLBACK`. Auth failure after identity match is a blocker, not permission to try Preview credentials.

## H. Agent handoff

Read, in order: this skill, the adopted specification, `docs/releases/EV-REG-1.0.0-PREVIEW-CERTIFIED.md`, `docs/governance/EV-REG-PRODUCTION-ROLLOUT-PLAN.md`, current Git state, and only the implementation required for the next authorised Production phase. Do not restart completed Preview milestones or connector CI remediations.

### Certified Preview baseline

- Verdict: **PREVIEW CERTIFIED — NOT PRODUCTION AUTHORISED**
- Annotated tag: `ev-reg-1.0.0-preview-certified` → `d8f59aceac3bdc775760a8bc4d076eb1e1d9074d`
- Activation commit: `f6a648e8`; activation docs: `2b2348e8`; closure docs: `d8f59ace`
- Preview deployment: `dpl_8nTq8rdqjYnqEV9onrAukGpKiDxN`
- Verifier revision when flag is true: `article-grounded-ev-reg-1`
- Feature flag: env `VERSIONED_EDITORIAL_VERIFIER_ENABLED=true` selects the versioned Prepare path; unset/false keeps `article-grounded-v14`. Compile-time constant remains `false`.
- Database: Preview `ArticleResearchAudit` has nullable `specificationVersion` and `disputes` on project `emmzoeeaznhpwevqprkn`. Production project `kqptdgbttfuqkzxzbazw` was not migrated.
- Recovery (Preview): disable the Preview flag, redeploy the prior Preview revision if needed, leave the nullable columns, do not delete historical audits.

### Connector CI maintenance (complete)

- PR #1 merge: `15e9ed81` — CI Supabase placeholders + `workflow_dispatch`
- PR #2 merge: `a5b876a6` — Calendar authenticated `read()` + tests
- Evidence: `docs/governance/EV-REG-CONNECTOR-CI-INTEGRATION.md`
- Calendar and Slack `connector:validate`: **100/100** on integrate (Actions runs `43702960411`, `43702963354`)

### Current integration HEAD (not Production-certified)

- Branch: `integrate/production-research-integrity`
- HEAD at P0: `8be3605f93da8df77d5cb54db9d69f71ef3f5761`
- Delta since certified Preview tag: connector CI workflows, Calendar `read()` remediation, and governance evidence docs only
- Proposed Production candidate pending P2–P4 gates: that integration HEAD (or a later explicitly approved pin). **Not yet Production-certified.**

### Production programme status

- Phase **P0** (skill + readiness + plan): complete — `docs/governance/EV-REG-PRODUCTION-ROLLOUT-PLAN.md`
- Phase **P1** (read-only Production schema): **VERIFIED** — Session pooler connect to Production project `kqptdgbttfuqkzxzbazw` (`aws-1-ap-southeast-2.pooler.supabase.com:5432`), `transaction_read_only=on`, both audit tables present, **`specificationVersion` and `disputes` absent**. Evidence: `docs/governance/EV-REG-PRODUCTION-P1-SCHEMA-INSPECTION.md`. Do not reuse Preview `.env.local`.
- Phase **P2** (additive Production migration): **COMPLETE** — nullable `specificationVersion` (`text`) and `disputes` (`jsonb`) added on Production `ArticleResearchAudit` only. Evidence: `docs/governance/EV-REG-PRODUCTION-P2-MIGRATION-EXECUTION.md`. Flag unset; no Prisma migrate; no deploy.
- Phase **P3** (Production deploy, flag unset): requires separate human approval
- Phase **P4** remains closed until P3 completes
- Production must keep `VERSIONED_EDITORIAL_VERIFIER_ENABLED` unset until the activation gate
- Production credential cleanup: `DATABASE_URL` / `DIRECT_URL` Production secrets updated `2026-11-15`; deployment still `dpl_DnQpxYFhBihvAuhmGRqxoLrP6XXE` @ `3ade3125…` (unchanged by P2)

### Human-authority boundaries (still closed without explicit approval)

Remote push of Production-affecting work when required by the phase, Production deploy, Production migration, Production env changes, Production flag enablement, specification edits, threshold changes, Prepare for Review, article approval, scheduling, publication, release retagging of the certified Preview tag.

## I. Skill maintenance

After each completed milestone, add only new reusable lessons, decisions, and blockers, then update the checkpoint in section H. Keep verified evidence separate from assumptions. Do not duplicate the specification.

## J. Preview environment

Discover the environment before connecting. The approved Preview database target is the host, port, database, and username in `src/lib/preview-postgres.ts`. The project ref in that username is `emmzoeeaznhpwevqprkn`. Production remains `kqptdgbttfuqkzxzbazw`. A public HTTP response from `https://<ref>.supabase.co` shows the API host exists. It does not prove which database a deployment uses, and it is not permission to connect.

Public build settings are `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for the Preview project. `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, and `DIRECT_URL` are secrets. Do not invent either group, and do not copy Production values into the worktree. A missing public pair stops `npm run build` during static generation. With the verified Preview pair in ignored `.env.local`, Next reports `Environments: .env.local` and static generation can finish. That still does not authorise a database session.

Schema inspection, after identity checks pass, is the read-only procedure in `docs/governance/EV-REG-METADATA-INSPECTION.md`. The Preview inspection is `docs/governance/EV-REG-3Y-SCHEMA-INSPECTION.md`, and the executed column change is `docs/governance/EV-REG-3Y-MIGRATION-EXECUTION.md`. Do not repeat that change against Production without a Production programme approval. Approval boundaries stay in section A.

The editor-boundary test walks every privileged route. Anonymous and viewer checks stay serial because they assert that no side effect runs. The editor check continues past the gate, so its runtime is the cost of those handlers. A full-suite run measured 301 seconds against the old 300-second cap, while isolated runs finish. The cap for that one test is 420 seconds. Do not raise it again to hide a new failure, and do not drop the status assertions.

## K. Production rollout governance

Follow `docs/governance/EV-REG-PRODUCTION-ROLLOUT-PLAN.md`. Required sequence (each gate separately approved):

1. **P1** — Production identity + read-only schema inspection (no writes) — **complete**
2. **P2** — Additive Production migration for nullable `specificationVersion` / `disputes` (flag remains unset) — **complete**
3. **P3** — Production application deploy of the approved candidate with flag still unset; verify baseline behaviour and health keys — **next approval**
4. **P4** — Enable `VERSIONED_EDITORIAL_VERIFIER_ENABLED=true` on Production only after P3 verification; post-activation probes; no article Prepare without separate editorial approval

Rollback: disable the Production flag first; redeploy the prior Production revision if required; leave nullable columns in place; do not delete historical audits; do not move Production aliases except as an explicit rollback step.

Stop conditions: Production project ref mismatch, missing migration columns when deploying Prisma fields, unexpected Production flag state, health regression, alias drift, or any attempt to re-audit/publish the governing article without editorial approval.
