---
name: echoes-visions-editorial-operations
description: Govern Echoes & Visions production releases, research-backed editorial review, publication eligibility, scheduled operations and handover. Use for article selection, evidence audits, editorial rewrites, production changes, Vercel releases or cron operations. Always resume from verified repository and runtime state.
---

# Echoes & Visions — Editorial & Production Operations Skill

## Purpose and activation

Use this skill whenever an agent (ChatGPT, Grok, BlackBoxAI or another assistant) works on Echoes & Visions articles, research, publishing, production releases, automation or operational handover. **Do not restart completed milestones.** Inspect the live repository, existing docs and authoritative application/database state first. Report what was verified, what remains uncertain and the next smallest safe action.

This skill is a workflow and safety contract, **not permission** to perform writes or deployments. Human approval is required separately at each consequential gate. Repository code and current production metadata take precedence over historical notes here; never silently relax controls.

## Operating principles

- Accuracy over volume. No invented sources, statistics, quotes, outcomes or verification claims. Identify commentary, original experiments, interpretations, examples and predictions separately.
- Impact > Automation > Scalability. Prefer improving an existing article over generating duplicates. Preserve the author's plain, conversational Echoes & Visions voice. Avoid hype and corporate jargon.
- One bounded milestone at a time. Read-only inspection is the default. Stop after reporting and await approval. Never infer approval for a later step from approval of an earlier one.
- BlackBoxAI-ready instructions should be complete, copyable and compatible with PowerShell 7+ on Windows. Other agents may adapt shell syntax without changing safeguards.
- Do not claim an action occurred unless a tool or a human execution report verifies it. Give exact commits, statuses, counts and evidence sources where available.
- Never expose credentials, article-private information, sensitive customer data or environment secrets in reports.

## Startup: required verification

1. Confirm repository path, Git branch, full HEAD, clean/dirty state, current release deployment, Vercel project and public alias targets. Do not assume the development branch equals the deployed branch.
2. Read the relevant route handlers, publication eligibility guards, research/audit fingerprint implementation, Prisma schema, test scripts and cron configuration before proposing a write.
3. Establish whether the task uses production, Preview, a disposable database or a local checkout. **Do not treat Preview as safe** if it shares production database or credentials.
4. Identify the current milestone and last completed action from the repository and user-provided execution evidence. Avoid duplicate publication, promotion, retries, cron runs and audits.
5. State GO/NO-GO for the *specific next action*, not for all subsequent actions.

## Research-backed editorial workflow (OR-5B)

### A. Read-only backlog selection

- Read actual article records, status, schedule, text revision, research sources, evidence, facts and audits. Use read-only access; never mutate while ranking.
- Rank a small set by reader benefit, relevance, factual support, section quality, originality and likely editorial effort. Treat missing scores as unavailable; historical scores are not current eligibility.
- Choose **one** candidate and request human approval before moving to editing.

### B. Current-text editorial and claim audit

- Retrieve the live article and identify its exact ID, revision/fingerprint, approval state, source set and latest audit. Never assume a separate MDX file matches the live text.
- Review every section: argument, audience value, factual claims, sources, evidence gaps, exaggeration, repetition, clarity, practical examples, CTA and SEO.
- Build a claim-to-source map. Verify exact claims against primary research or authoritative copies where possible. Distinguish measured findings from practitioner opinion, extrapolation and illustrative examples.
- Report a section-by-section revision plan. Do **not** silently edit or refresh audits.

### C. Draft and independent evidence strengthening

- Prepare the **complete** revised Markdown, metadata, source register, limitations, claim-to-source mapping and change summary in a draft-only step.
- Prefer primary peer-reviewed research for relevant claims, but do not import percentages from unrelated tasks. Explain methods, populations, dates and scope. Never imply writing-task productivity establishes audience growth, revenue or publishing quality.
- Place working clickable citations next to claims. Keep practitioner commentary labelled. Remove unsupported figures, misleading headings, internal production labels and unused sources.
- Include a practical, modest reader benefit and verified CTA. Do not invent offers or internal-link destinations.
- Have a human accept the complete draft before production saving. Draft acceptance is **not** publication approval.

### D. Prepare production save (separate approval)

- Read the actual application update contract. Determine exact editable fields, research-source associations, side effects on approval and audit state, and whether links in Markdown are automatically collected as sources.
- Capture a read-only before snapshot: article ID, status, slug, revision, source URLs, audit IDs and timestamps. Do not copy private text into public logs.
- Plan one controlled update of the accepted article and intentional source set. Preserve slug/category/image unless specifically approved. Avoid unnecessary duplicate or unrelated sources.
- Confirm changing audited fields clears old approval and returns the article to `review-required` according to current code. **Never restore approval by directly writing approval fields.**
- Request explicit human authorisation before any production article or source writes.

### E. Fresh audit, human review, schedule, publication

- After an authorised save, read the record back and verify its exact content, slug, source set and expected review-required state.
- Run the **existing** research-preparation process once, only with separate approval and only when the article is in an allowed status. Ensure content and sources are stable first.
- Check the new audit's actual content fingerprint, source set, engine version and timestamp association. An audit may be rejected for stale association even if the fingerprint matches.
- **Publication gate (as reported for the 2026-11 release):** consensus >= 80, source quality >= 70, recommendation exactly `publish-ready`, current valid audit, valid lifecycle/schedule and required human editorial approval. Re-read code to verify the gate has not changed. Never bypass or lower it.
- An approved article with a stale audit is **not publishable**. If the audit fails, return to evidence/editorial improvement; do not game scores or automatically retry.
- Human approval, scheduling and publication are distinct actions, each requiring explicit authorisation. Never invoke cron to force a publish. No automatic email or social send without independent approval.
- After publication, verify actual status, URL, content and downstream draft-only social/newsletter effects using non-mutating checks. Record the outcome; do not retry a possibly completed publish.

## Research and audit technical watchpoints

- Source URLs and article content may both participate in the audit fingerprint. Markdown links, including a CTA, may be collected by the research pipeline and affect source quality. Verify how code handles non-evidence links before preparing a new audit.
- Historical issue: a matching `article-grounded-v7` fingerprint was rejected because the fingerprint note's UTC association timestamp differed from the audit row's timestamp by 10h30m. Reported cause is timezone handling of a timestamp-without-timezone field across runtimes; **hypothesis/implementation finding to reverify in code**, not permission to patch production or waive freshness.
- Journal sites may reject automated fetches. A blocked fetch is not proof that the research is false. Record unavailable verification accurately and use permitted authoritative copies.
- Preserve original DOI and source URLs. A secondary institutional article explaining the same study is not an independent second experiment.

## Production release and operational workflow (OR-4/OR-5)

- First establish release commit and current production baseline. Keep the dirty development worktree untouched. Prepare a **fresh clean isolated worktree** at the intended commit; verify no `.env*`, `.next`, `.vercel`, credentials or unrelated files enter upload.
- Before production deployment, verify TypeScript, focused security/publishing tests, full tests and the **committed** build command in an isolated environment with disposable database and dummy external credentials. Measure build-time DB reads/writes and check for prerendered GET handlers with side effects. Never run a local production build with live secrets.
- Reconfirm project identity, production deployment, alias targets, release commit, cron window and rollback availability immediately before action.
- Staging, promotion and rollback are separate approval gates. A previous verified example of staging used `vercel deploy . --prod --skip-domain --project sovereign-ai-executive --yes` from a clean checkout. **Do not reuse commands without checking installed CLI, environment and current project.** `--skip-domain` may still reassign a team project alias.
- Confirm staged deployment Ready, expected commit and unchanged public aliases before seeking promotion approval. Promote once only after explicit human approval; never auto-retry. Verify public aliases and safe GET/health/auth checks afterward.
- Maintain a confirmed Ready rollback deployment. Rollback itself requires human approval; rollback cannot reverse database writes, sends or publications.
- Cron may execute automatically after promotion. Check the actual schedule and current local time, due articles and gate before cutover. Do not assume a previously recorded cron time remains the next run.
- Operational handover: confirm production health, safe 401 responses on protected routes, read-only publishing readiness counts, logs and next cron risk. Move focus to editorial quality rather than speculative development.

## Mandatory action boundaries

| Action | Default | Approval gate |
| --- | --- | --- |
| Read code, inspect metadata, evaluate sources | Allowed read-only | Confirm scope |
| Draft/rewrite article in response only | Allowed | Human accepts draft |
| Update production article or source rows | Forbidden by default | Separate explicit save approval |
| Generate or refresh production research audit | Forbidden by default | Separate explicit audit approval |
| Approve article | Forbidden by default | Human editorial approval after current passing audit |
| Schedule/publish/send/trigger cron | Forbidden by default | Explicit action-specific approval |
| Commit/push/merge/deploy/promote/rollback | Forbidden by default | Explicit action-specific approval |
| Change database schema, RLS, auth, env or gate | Forbidden by default | Separate engineering/security approval |

## Reporting contract

For each milestone provide: exact scope; verified environment and identity; evidence and test results; article ID/status/fingerprint where relevant; changes made or **no changes made**; unresolved risks; precise GO/NO-GO; one next bounded step. Clearly separate user-reported evidence from direct verification. Stop after reporting. Never imply publication eligibility from stored historical scores.

## Checkpoint — 2026-11-03 (historical; reverify before acting)

- Project: `echoes-visions-nextjs-cta`; Vercel project `sovereign-ai-executive`.
- Reported live production commit `bdf9c1986325a57f770e2e42563c0476066991ab`, deployment `dpl_9HAjCfaVPwwDn7pNJFGu98B3iK4p`, public domains `www.echoesandvisions.com`, `echoesandvisions.com`, `sovereign-ai-executive.vercel.app`.
- Previously Ready rollback deployment `dpl_AjT98tYkcCVe5zi9YCooAhczEzw6` at `91307479b53b04807d3df52717658be79e4f431f`. These IDs are not permanent assumptions.
- Latest reported OR-5A: 101 `review-required`, 1 approved, 14 published, zero due by the then-next cron. Counts are snapshots, not live facts.
- Selected article `cmqnj9yne000178unzpikqyhr`, working headline **What AI Automation Changes in Content Creation**. Existing slug `ai-automation-is-reshaping-content-creation-here-is-what-actually-changes`.
- **OR-5B.5 complete:** revised Markdown and evidence verified in user-provided report, prepared for a **later separately authorised save**. Nothing saved, audited, approved anew, scheduled or published. Live article still previously reported approved with old content; stored consensus 53, source quality 63, recommendation `review-required`; not eligible.
- Accepted draft sources: Noy & Zhang (2023) https://doi.org/10.1126/science.adh2586 ; Doshi & Hauser (2024) https://doi.org/10.1126/sciadv.adn5290 ; Laban et al. (2024) https://doi.org/10.1145/3654777.3676419 ; MIT News https://news.mit.edu/2023/study-finds-chatgpt-boosts-worker-productivity-writing-0714 ; UXmatters https://www.uxmatters.com/mt/archives/2024/09/ai-powered-content-creation-how-artificial-intelligence-automates-and-streamlines-the-workflow.php ; Floodlight https://www.floodlightnewmarketing.co.uk/blog/future-of-content-creation .
- OR-5B.5 report proposed updating `title`, `excerpt`, `content`, `seoTitle`, `seoDescription`, `seoKeywords` and intentionally replacing stored `ResearchSource` rows, while preserving slug/category/image. **This is a plan, not authority to execute.** Exact final Markdown must be retrieved from the accepted OR-5B.5 artifact/user-provided text, never reconstructed from memory.
- **Next step:** request separate approval for a controlled production article/source save after verifying the current live record and the exact accepted draft. Then separately authorise audit preparation. Do not change the audit timestamp logic as part of editorial saving.

## Maintenance

Keep this skill in version control with the application. After each approved milestone, update only the checkpoint and any genuinely reusable process learning, then review the diff and commit **only with explicit approval**. Avoid embedding secrets, private customer data or transient log dumps. If repository agent-discovery conventions differ, add a short pointer from existing `AGENTS.md` or agent instructions rather than duplicating the entire skill. Do not claim every external agent automatically discovers this file; configure each agent's skill path explicitly.
