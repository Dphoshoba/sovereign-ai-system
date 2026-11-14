---
name: echoes-visions-autonomous-engineering
description: Autonomous engineering workflow for Echoes & Visions research-governance milestones. Use when implementing an approved EV-REG milestone, inspecting the release worktree, or handing work to Grok, BlackBoxAI, Cursor, Codex, or a later engineering agent. Read this before changing research, audit, or publication code.
---

# Echoes & Visions — Autonomous Engineering and Governance Workflow

Release worktree: `C:\Users\David\echoes-visions-preview-security`. Branch: `integrate/production-research-integrity`. Editorial publication safety stays in `.agents/skills/echoes-visions-editorial-operations/SKILL.md`. Governing contract: `docs/governance/EV-REG-SPEC-1.0.0.md`. Do not copy that specification into this skill.

## A. Operating principles

Impact over automation, then scalability. Inspect the repository before changing it. The production baseline at `d654d85c1583b1fe426d65052d991c3a5c967a14` stays frozen. Preserve the adopted specification bytes. Finish the authorised milestone before asking for routine approval. Human approval remains at genuine authority boundaries: remote push, deployment, unverified database access, persistent migrations, production data, specification edits, publication thresholds, historical audit rewrites, Prepare for Review, article approval, scheduling, and publication.

## B. Repository discovery

Confirm the worktree, branch, full HEAD, and whether the tree is clean. Confirm the specification SHA-256 is `9D3C34F1689BBC0DB673A5E0A3B79A11B343C2792D4F9179BFA8E29E5ECC2419`. Read the implementation that already exists before proposing a new one. Milestones 3N through 4C are complete in code. Milestone 3Z is commit `72617c6b83f50ffaf2a78095c518c2d49b2029a1`. Milestone 4A is commit `080a9cfe4e65c0a7009395831e9eed1c0c35de77`. Milestone 4B is commit `373ef4056566334cb70034ce92424f28a324f63e`. Milestone 3Y's database migration is still blocked. `VERSIONED_EDITORIAL_VERIFIER_ENABLED` stays false, so Prepare for Review still writes `article-grounded-v14`. Do not restart them.

## C. Research governance

Follow EV-REG-SPEC-1.0.0 for publisher identity, canonicalisation, independent corroboration, full-claim substantiation, primary-source restrictions, dispute precedence, resolution and expiry, historical audit compatibility, publication thresholds, and separate human approval. Baseline audits stay on the baseline gate. A primary-source-supported claim is not a publication exception. Thresholds remain consensus 80 and source quality 70.

## D. Testing workflow

Characterise current behaviour before changing it. Keep future-contract files out of the Vitest include until the milestone that implements them. Use deterministic fixtures. Run the targeted test, then the full `tests/editorial` suite, before committing. Confirm Docker responds before the disposable PostgreSQL suite. A hook timeout after a cold daemon is an infrastructure failure. Do not weaken an assertion or raise a timeout to obtain a pass.

## E. Database safety

Verify database identity before connecting. Do not treat an environment-variable name as proof that a database is non-Production. Reject any URL that identifies Supabase project `kqptdgbttfuqkzxzbazw`. Never print credentials. Inspect live metadata before writing a migration. `prisma/schema.prisma` contains `ArticleResearchAudit` and `ArticleReviewNote`, and the tracked migration history does not create them. Prefer additive nullable columns. Roll an additive change back by deploying the previous code first and leaving the columns in place. Do not execute a Production migration without explicit approval.

The Milestone 3Y migration is pending in `docs/governance/EV-REG-3Y-CONDITIONAL-MIGRATION-PLAN.md`. Do not copy that plan into `prisma/migrations` and do not execute it until a verified non-Production database has been inspected.

## F. Engineering execution

Plan the whole authorised milestone. Implement, test, and correct failures caused by that work. Inspect the full diff for secrets and unrelated files. Commit locally only after verification. Report evidence. Stop at the next authority boundary.

## G. Incident lessons

- Docker Desktop can take longer than the 120-second PostgreSQL hook on a cold start. Confirm `docker version` before rerunning that test. Do not delete unrelated containers.
- The disposable database on port 55432 is a test fixture. It is not live schema verification.
- Missing `DATABASE_URL` in this worktree is a blocker, not an invitation to copy credentials from another checkout.
- Baseline `publishersForSource` still accepts a publisher name in a title. The versioned identity uses the hostname registry only.
- Baseline unattributed claims can still count two hostnames of one organisation as two identities. `evaluateVersionedClaim` collapses those hosts.
- Overlapping contradictory text can still score as support. A matcher average can omit zero scores. The consensus average is computed and is not returned on the result.
- `POST /api/research/publication-gate` JSON includes `articlePublicationAuthorised: false`. It is not an article audit and cannot authorise publication.

## H. Agent handoff

Read, in order: this skill, the adopted specification, the latest milestone evidence, current Git state, and the relevant implementation and tests. Continue from the last verified checkpoint. Do not restart the programme.

Verified checkpoint after Milestone 4C: the legacy publication-gate response keeps its existing research keys and adds `articlePublicationAuthorised: false`. The article publication guard rejects that decision. Generation routes are unchanged. No live database was inspected and no migration was executed.

## I. Skill maintenance

After each completed milestone, add only new reusable lessons, decisions, and blockers, then update the checkpoint in section H. Keep verified evidence separate from assumptions. Do not duplicate the specification.
