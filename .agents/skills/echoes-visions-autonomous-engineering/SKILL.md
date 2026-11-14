---
name: echoes-visions-autonomous-engineering
description: Autonomous engineering workflow for Echoes & Visions research-governance milestones. Use when implementing an approved EV-REG milestone, inspecting the release worktree, or handing work to Grok, BlackBoxAI, Cursor, Codex, or a later engineering agent. Read this before changing research, audit, or publication code.
---

# Echoes & Visions — Autonomous Engineering and Governance Workflow

Release worktree: `C:\Users\David\echoes-visions-preview-security`. Branch: `integrate/production-research-integrity`. Editorial publication safety stays in `.agents/skills/echoes-visions-editorial-operations/SKILL.md`. Governing contract: `docs/governance/EV-REG-SPEC-1.0.0.md`. Do not copy that specification into this skill.

## A. Operating principles

Impact over automation, then scalability. Inspect the repository before changing it. The production baseline at `d654d85c1583b1fe426d65052d991c3a5c967a14` stays frozen. Preserve the adopted specification bytes. Finish the authorised milestone before asking for routine approval. Human approval remains at genuine authority boundaries: remote push, deployment, unverified database access, persistent migrations, production data, specification edits, publication thresholds, historical audit rewrites, Prepare for Review, article approval, scheduling, and publication.

## B. Repository discovery

Confirm the worktree, branch, full HEAD, and whether the tree is clean. Confirm the specification SHA-256 is `9D3C34F1689BBC0DB673A5E0A3B79A11B343C2792D4F9179BFA8E29E5ECC2419`. Read the implementation that already exists before proposing a new one. Milestones 3N through 4D are recorded locally. Release readiness is `docs/governance/EV-REG-RELEASE-READINESS.md`. The Preview database identity is verified read-only in `docs/governance/EV-REG-3Y-SCHEMA-INSPECTION.md`. The additive migration and versioned scoring stay unapproved. `VERSIONED_EDITORIAL_VERIFIER_ENABLED` stays false. Do not restart them.

## C. Research governance

Follow EV-REG-SPEC-1.0.0 for publisher identity, canonicalisation, independent corroboration, full-claim substantiation, primary-source restrictions, dispute precedence, resolution and expiry, historical audit compatibility, publication thresholds, and separate human approval. Baseline audits stay on the baseline gate. A primary-source-supported claim is not a publication exception. Thresholds remain consensus 80 and source quality 70.

## D. Testing workflow

Characterise current behaviour before changing it. Keep future-contract files out of the Vitest include until the milestone that implements them. Use deterministic fixtures. Run the targeted test, then the full `tests/editorial` suite, before committing. Confirm Docker responds before the disposable PostgreSQL suite. A hook timeout after a cold daemon is an infrastructure failure. Do not weaken an assertion or skip a test. Raise a timeout only after a measurement shows the existing cap is the failure, and record that measurement.

## E. Database safety

Verify database identity before connecting. Do not treat an environment-variable name as proof that a database is non-Production. Reject any URL that identifies Supabase project `kqptdgbttfuqkzxzbazw`. Never print credentials. Inspect live metadata before writing a migration. `prisma/schema.prisma` contains `ArticleResearchAudit` and `ArticleReviewNote`, and the tracked migration history does not create them. Prefer additive nullable columns. Roll an additive change back by deploying the previous code first and leaving the columns in place. Do not execute a Production migration without explicit approval.

The Milestone 3Y migration is pending in `docs/governance/EV-REG-3Y-CONDITIONAL-MIGRATION-PLAN.md`. The Preview tables were inspected and match Prisma; `specificationVersion` and `disputes` are absent. Do not copy that plan into `prisma/migrations` and do not execute it without a separate migration approval. Do not derive the change from the incomplete migration history.

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
- The Supabase pooler username `postgres.emmzoeeaznhpwevqprkn` opens a session whose `current_user` is `postgres`. Confirm the project ref on the URL before connecting. An absent `sslmode` is acceptable when the pinned CA verifies the certificate. Keep the inspection in `BEGIN READ ONLY` and `ROLLBACK`. The inspection role can write and bypasses row security.

## H. Agent handoff

Read, in order: this skill, the adopted specification, the latest milestone evidence, current Git state, and the relevant implementation and tests. Continue from the last verified checkpoint. Do not restart the programme.

Verified checkpoint: the approved Preview database was inspected read-only and rolled back. `ArticleResearchAudit` and `ArticleReviewNote` match Prisma. `specificationVersion` and `disputes` are absent. Evidence is `docs/governance/EV-REG-3Y-SCHEMA-INSPECTION.md`. Prepare for Review writes `article-grounded-v14`. The next human boundary is approval of the two nullable columns. That approval does not authorise deployment or versioned scoring.

## I. Skill maintenance

After each completed milestone, add only new reusable lessons, decisions, and blockers, then update the checkpoint in section H. Keep verified evidence separate from assumptions. Do not duplicate the specification.

## J. Preview environment

Discover the environment before connecting. The approved Preview database target is the host, port, database, and username in `src/lib/preview-postgres.ts`. The project ref in that username is `emmzoeeaznhpwevqprkn`. Production remains `kqptdgbttfuqkzxzbazw`. A public HTTP response from `https://<ref>.supabase.co` shows the API host exists. It does not prove which database a deployment uses, and it is not permission to connect.

Public build settings are `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for the Preview project. `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, and `DIRECT_URL` are secrets. Do not invent either group, and do not copy Production values into the worktree. A missing public pair stops `npm run build` during static generation. With the verified Preview pair in ignored `.env.local`, Next reports `Environments: .env.local` and static generation can finish. That still does not authorise a database session.

Schema inspection, after identity checks pass, is the read-only procedure in `docs/governance/EV-REG-METADATA-INSPECTION.md`. The completed Preview result is `docs/governance/EV-REG-3Y-SCHEMA-INSPECTION.md`. Roll the transaction back. Do not generate or execute the audit migration from that result. Approval boundaries stay in section A.

The editor-boundary test walks every privileged route. Anonymous and viewer checks stay serial because they assert that no side effect runs. The editor check continues past the gate, so its runtime is the cost of those handlers. A full-suite run measured 301 seconds against the old 300-second cap, while isolated runs finish. The cap for that one test is 420 seconds. Do not raise it again to hide a new failure, and do not drop the status assertions.
