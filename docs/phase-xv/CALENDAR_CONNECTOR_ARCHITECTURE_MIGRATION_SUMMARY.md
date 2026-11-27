# Calendar Connector Architecture Migration Summary (Stage 1)

## Context
Approved migration path is **Option A**: refactor existing `lib/connectors/calendar/*` to align with the Gmail Connector SDK architecture (`lib/connectors/sdk/*`) and remove Stage 1 mutation paths.

## Modules being retained
- `lib/connectors/calendar/index.ts` (retained, refactored exports)
- `lib/connectors/calendar/api-client.ts` (retained, refactored to read-only deterministic adapter behavior for Stage 1)
- `lib/connectors/calendar/resource-parser.ts` (retained in spirit, refactored into Calendar read-model parser responsibilities)
- `lib/connectors/calendar/production-readiness.ts` (retained as projection/certification utility, adapted where needed to Stage 1 read-only posture)

## Modules being refactored
- `lib/connectors/calendar/action-set.ts`
  - Remove/disable mutation actions (`calendar_create` and any write semantics) for Stage 1.
  - Align action definitions to Gmail-style manifest + connector action model.
- `lib/connectors/calendar/oauth-adapter.ts`
  - Refactor into Gmail-SDK-style authenticator abstraction (`BaseAuthenticator` extension).
  - Ensure OAuth endpoints/scopes are Google Calendar authoritative.
- `lib/connectors/calendar/metadata.ts`
  - Update operations/security metadata to read-only Stage 1 capabilities.
- `lib/connectors/calendar/index.ts`
  - Export Gmail-SDK-aligned Calendar connector artifacts (manifest/authenticator/executor/types).

## Modules being removed or deprecated
- Platform-SDK-specific Calendar-only surface patterns that create a parallel architecture will be deprecated in place.
- Any write/mutation operation surfaces in Stage 1 are removed or hard-blocked:
  - create
  - update
  - delete/cancel
- Deprecated symbols (if any) will be preserved short-term as compatibility wrappers where practical, forwarding to read-only safe implementations.

## Shared abstractions extracted
Only genuinely connector-agnostic behavior may be extracted into shared SDK/platform modules, such as:
- timezone normalization utilities (if useful beyond Calendar),
- deterministic free/busy window normalization helpers,
- read-only governance-safe action classification helpers.

No connector-specific business logic will be moved into Gamma OS orchestration.

## Compatibility considerations
- Preserve public compatibility where practical by keeping barrel exports stable or providing backward-compatible aliases.
- No breaking public API change will be introduced unless unavoidable.
- If unavoidable breakage is discovered, implementation will pause and report decision/options before proceeding.
- No second connector architecture will be maintained in parallel.

## Stage 1 guardrails (enforced)
- Read-only only: discovery/list/read/search/free-busy/availability/timezone/permission/scope/quota/health.
- Governance path preserved for all operations.
- No persistence ownership changes.
- No database/schema migration.
- No live mutation capability.
