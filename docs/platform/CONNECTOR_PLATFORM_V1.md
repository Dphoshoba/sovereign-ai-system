# Gamma Connector Platform v1.0

**Tag**: `gamma-connector-platform-v1`  
**Date**: 2026-07-10  
**Base Connector**: Gmail (Builds 135–140)  
**Status**: FROZEN — do not modify after tagging

---

## What This Tag Represents

Everything built in Phase XV is now a reusable platform.

| Component | Builds | Status |
|-----------|--------|--------|
| Connector SDK (types, interfaces) | 135 | ✅ Frozen |
| Gmail OAuth + API Client | 135–136 | ✅ Frozen |
| Reader + Sanitizer | 136 | ✅ Frozen |
| Draft Composer + Preview | 136 | ✅ Frozen |
| Approval Gate | 135 | ✅ Frozen |
| Queue Engine | 135 | ✅ Frozen |
| Controlled Execution | 135 | ✅ Frozen |
| Compliance Audit | 137–138 | ✅ Frozen |
| Production Hardening | 139 | ✅ Frozen |
| Certification Framework | 140 | ✅ Frozen |
| Runtime + GAMMA Readers | 135–140 | ✅ Frozen |

---

## Phase XVI Development Model

Before this platform, building a connector required:

```
Design OAuth flow
Implement token storage
Build API client
Build parser
Build composer
Build approval workflow
Build queue
Build executor
Build health monitoring
Build compliance audit
Build certification
Write 300+ tests
Write documentation
~12–14 weeks
```

After this platform, building a connector requires:

```
Instantiate Connector Platform
          ↓
Replace OAuthAdapter
          ↓
Replace ApiClient
          ↓
Replace ResourceParser
          ↓
Replace ActionSet
          ↓
Done
~3–5 weeks
```

---

## Connector Adapter Contract

Four adapters are required per connector. Everything else is inherited.

### 1. OAuthAdapter

```typescript
import type { OAuthAdapter } from 'lib/platform/connector-platform-sdk';

export const CalendarOAuth: OAuthAdapter = {
  authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  requiredScopes: [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events',
  ],
  highRiskScopes: [
    'https://www.googleapis.com/auth/calendar',
  ],
  exchangeCode: async (code) => { /* ... */ },
  refreshToken: async (token) => { /* ... */ },
  validateToken: (token) => { /* ... */ },
};
```

### 2. ApiClient

```typescript
import type { ApiClient } from 'lib/platform/connector-platform-sdk';

export const CalendarClient: ApiClient = {
  serviceName: 'Google Calendar',
  baseUrl: 'https://www.googleapis.com/calendar/v3',
  rateLimitTiers: [ /* inherit Gmail tiers or define own */ ],
  quotaDefinitions: [ /* Calendar API quota */ ],
  read:   async (resource, params) => { /* GET /calendars/... */ },
  create: async (resource, payload) => { /* POST /calendars/.../events */ },
  update: async (resource, id, payload) => { /* PATCH */ },
  delete: async (resource, id) => { /* DELETE */ },
};
```

### 3. ResourceParser

```typescript
import type { ResourceParser } from 'lib/platform/connector-platform-sdk';

export const CalendarEventParser: ResourceParser<RawCalendarEvent, CalendarEvent> = {
  parse:    (raw) => { /* Google event → CalendarEvent */ },
  validate: (event) => { /* check required fields */ },
  sanitize: (event) => { /* redact PII, use shared sanitizer */ },
};
```

### 4. ActionSet

```typescript
import type { ActionSet } from 'lib/platform/connector-platform-sdk';

export const CalendarActions: ActionSet = {
  supportedActions: [
    { id: 'create_event', name: 'Create Event', riskLevel: 'medium', ... },
    { id: 'update_event', name: 'Update Event', riskLevel: 'medium', ... },
    { id: 'delete_event', name: 'Delete Event', riskLevel: 'high', ... },
  ],
  preview:  async (action) => { /* show what would happen */ },
  execute:  async (action) => { /* execute via platform executor */ },
};
```

---

## Platform Inheritance

When you instantiate the platform with those 4 adapters, you automatically get:

| Capability | Source | Zero new code |
|-----------|--------|---------------|
| Human approval gate | `approval-engine.ts` | ✅ |
| Job queue + persistence | `queue-engine.ts` | ✅ |
| Retry + backoff | `retry-orchestrator.ts` | ✅ |
| Dead-letter queue | `dead-letter-queue.ts` | ✅ |
| Idempotency guard | `idempotency.ts` | ✅ |
| Compliance audit log | `compliance-audit.ts` | ✅ |
| Secret redaction | `sanitizer.ts` | ✅ |
| Feature flags | executor pattern | ✅ |
| Receipt verification | `receipt-verifier.ts` | ✅ |
| Health monitoring | health-checker pattern | ~80% |
| Certification suite | certification-runner pattern | ~80% |
| GAMMA reader | reader pattern | ~70% |

---

## Phase XVI Connector Roadmap

Using the platform, connectors reduce to adapter work only.

| Connector | Adapter Work | Timeline |
|-----------|-------------|---------|
| Google Calendar | 4 adapters + Calendar-specific parser | 3–4 weeks |
| Google Drive | 4 adapters + file/folder parser | 3–4 weeks |
| GitHub | 4 adapters + issue/PR parser | 4–5 weeks |
| Slack | 4 adapters + message/channel parser | 3–4 weeks |
| Office 365 | 4 adapters + MSAL OAuth | 2–3 weeks |
| Notion | 4 adapters + page/database parser | 3–4 weeks |
| Discord | 4 adapters + channel/guild parser | 3–4 weeks |

**Total Phase XVI**: ~6 months (vs 18+ months without platform)

---

## Immutability Contract

After `gamma-connector-platform-v1` is tagged:

- ✅ New connectors may **add** adapters
- ✅ New connectors may **extend** parsers
- ✅ New connectors may **extend** sanitizer patterns
- ❌ Platform core files may **not be modified**
- ❌ Approval gate logic may **not be weakened**
- ❌ Feature flags may **not be bypassed**
- ❌ Compliance audit may **not be removed**

Any change to platform core requires a new platform version (`v1.1`, `v2.0`) with full certification.

---

## Files Included in This Tag

```
lib/platform/
  connector-platform-sdk.ts     ← Interfaces & contracts (this tag)

lib/connectors/gmail/           ← Reference implementation
  authenticator.ts
  mailbox-reader.ts
  sanitizer.ts
  draft-composer.ts
  preview-engine.ts
  approval-engine.ts
  queue-engine.ts
  executor.ts
  retry-orchestrator.ts
  dead-letter-queue.ts
  idempotency.ts
  receipt-verifier.ts
  compliance-audit.ts
  health-checker.ts
  rate-limit-guard.ts
  token-health-monitor.ts
  quota-monitor.ts
  permission-scope-validator.ts
  certification-runner.ts
  reference-connector-report.ts
  gmail-v1-checklist.ts

lib/gamma/                      ← GAMMA reader patterns
  gmail-hardening-reader.ts
  gmail-certification-reader.ts
  gmail-compliance-reader.ts

src/lib/gmail-hardening/        ← Types & mock data
src/lib/gmail-certification/
src/lib/gmail-compliance/

tests/connectors/               ← 397 passing tests
  gmail-hardening.test.ts       (34 tests)
  gmail-certification.test.ts   (48 tests)
  gmail-compliance.test.ts
  ... (all others)

docs/phase-xv/
  BUILD140.md
  GMAIL_CONNECTOR_V1.md
  CONNECTOR_REFERENCE_ARCHITECTURE.md
```

---

**Next**: Build Calendar connector by instantiating this platform.

**Command**: `git tag gamma-connector-platform-v1`
