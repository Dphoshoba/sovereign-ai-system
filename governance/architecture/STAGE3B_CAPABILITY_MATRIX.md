# Stage 3B Provider Capability Matrix

**Status:** PLANNING
**Parent:** Stage 3A frozen at `05631b9`

## Capability Categories

### Read (Stage 1-2 territory — no Stage 3B change)

| Capability | Description | Stage 3B |
|---|---|---|
| Metadata search | List/search provider resources | Inherited |
| Metadata read | Read single resource metadata | Inherited |
| Permission inspection | Read resource permissions | Inherited |
| Version history | Read resource version history | Inherited |
| Quota/usage | Read provider quota state | Inherited |

### Mutation (Stage 3B new)

| Capability | Description | Approval | Rollback Support |
|---|---|---|---|
| Upload | Create new resource | STANDARD | Provider-dependent |
| Update | Modify existing resource | STANDARD | Provider-dependent |
| Rename/Move | Change resource path/name | STANDARD | Full |
| Copy | Duplicate resource | NONE | N/A (safe) |
| Trash/Archive | Move to soft-delete | STANDARD | Full |
| Delete | Permanently remove | CRITICAL | Rare |
| Permission grant | Add sharing | HEIGHTENED | Full |
| Permission revoke | Remove sharing | HEIGHTENED | Full |
| Permission transfer | Change owner | CRITICAL | Complex |

### Execution (Stage 3B new)

| Capability | Description | Required |
|---|---|---|
| Dry-run | Simulate execution without mutation | Recommended for all connectors |
| Execute | Perform provider mutation | Required |
| Verify | Confirm mutation result | Required |
| Rollback | Reverse mutation | Required for destructive ops |
| Idempotent execution | Replay-safe execution | Required |

## Connector Capability Declaration

Every connector adapter must declare its capabilities:

```
Google Drive Stage 3B Adapter (Proposed):
  upload:       execute + verify + rollback + approve(STANDARD)
  update:       execute + verify + rollback + approve(STANDARD)
  rename:       execute + verify + rollback + approve(STANDARD)
  copy:         execute + verify               + approve(NONE)
  trash:        execute + verify + rollback + approve(STANDARD)
  delete:       execute + verify               + approve(CRITICAL)
  permission:   execute + verify + rollback + approve(HEIGHTENED)
  dryRun:       true
  idempotent:   true

Gmail Stage 3B Adapter (Proposed):
  sendDraft:    execute + verify + rollback + approve(HEIGHTENED)
  trashDraft:   execute + verify + rollback + approve(STANDARD)
  dryRun:       true
  idempotent:   false  (sending is not idempotent)
```

## Capability Enforcement

The runtime enforces capability boundaries:

1. **Pre-check**: Connector capability declaration validated before execution
2. **Runtime check**: Capability verified at method invocation
3. **Post-check**: Audit records capability state at execution time

Unsupported operations return `CAPABILITY_NOT_SUPPORTED` (existing failure code) before any provider call.
