# EV-REG-SPEC-1.1.0 — Editorial provenance & registry specification

**Contract ID:** `EV-REG-SPEC`  
**Version:** `1.1.0`  
**Full identifier:** `EV-REG-SPEC-1.1.0`  
**Status:** Version-controlled reconciliation of **verified in-repo provenance behaviour**  
**Programme:** M2-P5 Registry Specification Reconciliation  
**Authority source:** Existing fingerprints, `ArticleReviewNote` actions, research audits, publication guards, social operational events, and editorial tests — **not** a new registry engine or database.

This specification reconciles the previously missing named artifact `EV-REG-SPEC-1.1.0` with mechanisms that already exist. It does **not** invent a parallel registry service, duplicate audit records, or replace human approval.

## Scope

Defines how Echoes & Visions binds editorial provenance for:

- content revision identity (fingerprints)
- research-audit association
- human confirmation notes / actors
- featured-image prompt governance
- publication authority gates
- distribution operational events (X and related)

It explicitly does **not**:

- create a new registry engine, agent, or Prisma model
- weaken research, audit, approval, publication, or social idempotency gates
- absorb or override `EV-BIBLE-AUTHORITY-001` theological attribution rules
- auto-approve, schedule, publish, or socially distribute content

## Provenance stores already in use (authoritative)

| Store | Role |
| --- | --- |
| `computeArticleAuditFingerprint` | Content revision identity (SHA-256) |
| `ArticleResearchAudit` | Research audit scores / recommendation |
| `ArticleReviewNote` | Structured provenance actions + optional JSON payloads |
| Article `approvedAt` / `approvedBy` / `status` | Human approval authority fields |
| `OperationalEvent` (SocialPost entity) | Social publish claim / success / failure / uncertain |
| Publication guard + lifecycle | Schedule/publish authority |

## Verified requirements (implemented & tested)

Grounded in current code and editorial regression suites.

| ID | Requirement | Evidence |
| --- | --- | --- |
| **REG-R1** | Content revision identity is a SHA-256 fingerprint over auditable article fields + canonical source URL set. Routing-only fields (slug, featuredImage, timestamps, status, scores, review notes) are outside the fingerprint boundary. | `lib/research/article-audit-fingerprint.ts` (`ARTICLE_AUDIT_FINGERPRINT_BOUNDARY`) |
| **REG-R2** | A current research audit is associated only via review-note action `research-audit-fingerprint` with strict association payload version `2` (`algorithm=sha256`, exact ISO `createdAt`, current `engineRevision`). | `lib/research/article-audit-association.ts` |
| **REG-R3** | Audit currency fails closed when fingerprint, engine revision, audit id, or exact timestamp association mismatches. | `partitionAssociatedArticleAudits` + article-audit association tests |
| **REG-R4** | Human approval is a distinct lifecycle transition recorded with actor provenance (`approvedBy` / review-note action `approved`). Reject / archive / correct-and-unpublish also leave review-note provenance. | `lib/publishing/article-lifecycle.ts`, `correct-and-withdraw.ts` |
| **REG-R5** | Featured-image prompt approval is a fingerprint-bound review note (`featured-image-prompt-approved`) and does not substitute for article approval or publish. | `lib/ai/featured-image-prompt.ts`, `approve-featured-image-prompt.ts` |
| **REG-R6** | Schedule/publish requires a **current** audit and publish-ready research thresholds (consensus ≥ 80, source quality ≥ 70, recommendation `publish-ready`). | `lib/publishing/publication-guard.ts`, consensus constants |
| **REG-R7** | Prepare-for-review writes audit association + `prepared-for-review` note and returns articles to human review; it does not approve or publish. | `lib/research/prepare-article-for-review.ts` |
| **REG-R8** | Fail-closed API responses for unauthorised or disallowed mutations preserve `articleUnchanged: true` where implemented by editorial auth/lifecycle routes. | `require-editor-auth`, lifecycle/route tests |
| **REG-R9** | Social distribution provenance uses SocialPost status + OperationalEvent types (`social_publish_claimed`, `social_publish`, `social_publish_failed`, `social_publish_uncertain`); uncertain outcomes must not auto-retry. | `lib/social/publish-twitter-post.ts` |
| **REG-R10** | Registry intent is satisfied by the above existing stores. There is **no** separate EV-REG runtime engine in this checkout. | Inventory / absence of registry service |

Machine-readable identifiers and traceability live in `lib/publishing/ev-reg-spec-1-1-0.ts`.

## Relationship to EV-BIBLE-AUTHORITY-001

`EV-BIBLE-AUTHORITY-001` remains the scripture attribution contract. EV-REG-SPEC-1.1.0 records **provenance binding** for editorial governance generally; it does **not** redefine primary-scripture exclusivity, BibleProject rules, or deferred biblical Director decisions. Those remain under EV-BIBLE-AUTHORITY-001.

## Proposed Director decisions (not established — do not implement yet)

1. Whether to build a dedicated Registry service / table beyond `ArticleReviewNote` + audits + operational events.
2. Whether every provenance action must be enumerated in a DB-level enum (today: string actions in code).
3. Whether a single Director “provenance timeline” API should aggregate notes + operational events beyond Checklist monitoring.
4. Whether EV-REG and EV-BIBLE contracts should later share a formal EV-REG programme catalogue UI.
5. Whether non-X social platforms must emit the same OperationalEvent vocabulary before enablement.

## Compliance statement for automation

Passing EV-REG-SPEC-1.1.0 deterministic tests means the **named provenance contract matches verified code constants and bindings**. It does not create registry records, certify article quality, or replace human editorial judgement.
