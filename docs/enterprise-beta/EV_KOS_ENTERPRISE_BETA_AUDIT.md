# EV-KOS Enterprise Beta Guard Audit

EB-3 defines audit packet shapes for future guard decisions.

## Audit Position

Audit records are modeled but not persisted. They include decision IDs, evidence
packet IDs, event types, and summaries that can later map to a persistence layer
after explicit approval.

## Blocked Capabilities

- No database writes.
- No Prisma writes.
- No telemetry backend.
- No persistence.
- No middleware.
- No auth integration.
- No execution.
