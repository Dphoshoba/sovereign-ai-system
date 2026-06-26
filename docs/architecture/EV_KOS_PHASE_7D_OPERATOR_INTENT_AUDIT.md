# EV-KOS Phase 7D - Operator Intent and Audit Contract

## Status

Phase 7D adds a governed operator intent and audit contract before any operator
execution controls exist.

This phase does not execute actions, approve actions, call OpenAI, publish,
post to social platforms, write graph records, change schema, or create
migrations.

## Model Audit

Existing models inspected:

- `ExecutionAuthorizationRequest`
- `GovernanceAuditTrail`
- `AiApprovalRequest`
- `GovernanceApproval`
- `OperationalEvent`

## Selected Model

`ExecutionAuthorizationRequest` is selected for controlled operator intent
persistence because it already supports:

- pending status
- requested actor
- requested role
- action type
- target type and target id
- target layer
- risk level
- rationale
- policy matches
- payload
- result/error fields

It is already used by semantic graph ingestion review packages, making it the
least surprising model for pending operator authorization.

## Files

- `lib/ev-kos/operator-intent.ts`
- `lib/ev-kos/operator-audit-contract.ts`
- `app/api/ev-kos/operator-intent/route.ts`
- `docs/architecture/EV_KOS_PHASE_7D_OPERATOR_INTENT_AUDIT.md`

## Functions

- `buildOperatorIntent()`
- `validateOperatorIntent()`
- `classifyOperatorIntentRisk()`
- `buildOperatorAuditRecord()`
- `summarizeOperatorIntent()`
- `mapIntentToExistingAuditShape()`

## Route

```text
GET /api/ev-kos/operator-intent
POST /api/ev-kos/operator-intent
```

### GET

Preview only. No writes.

### POST

Controlled persistence only. It requires:

- `explicitCreateIntent: true`
- `actorId`
- `actionId`
- `reason`
- `source: "ev-kos-operator"`

POST creates only a pending `ExecutionAuthorizationRequest` intent package.
It does not execute the action.

## Safety Flags

Every response returns:

- `actionExecuted: false`
- `graphWrites: false`
- `graphDeletes: false`
- `openAiCalls: false`
- `publishing: false`
- `socialPosting: false`
- `automaticApproval: false`

## Remaining Boundary

Operator intent persistence is not operator execution. Phase 7E must still
define review/approval handling, actor authorization, audit browsing, rollback
notes, and per-action execution contracts before any real execution button is
introduced.
