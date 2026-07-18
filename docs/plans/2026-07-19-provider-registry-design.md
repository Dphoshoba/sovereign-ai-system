# Provider Registry — Design

**Milestone:** Stage 4A.1
**Authorization:** GOV-2026-Stage4A-001
**Architecture:** Phase IV — Multi-Provider Runtime

## Data Model

```
ProviderRegistration
├── identity: { id, name, version }
├── lifecycle: REGISTERED | CERTIFIED | DEPRECATED | RETIRED
├── capabilities: [{ operation, contractVersion }]
├── certification: { governanceDecision, level, eosVersion, certifiedAt }
├── health: { available, ready }
├── policy: { sandboxSupported, writeOperations, featureFlags }
└── metadata: { description, owner, documentationRef }
```

## Interface

```
ProviderRegistry
├── register(registration): void
├── unregister(providerId): void
├── get(providerId): ProviderRegistration | undefined
├── findByOperation(operation): ProviderRegistration[]
├── findByLifecycle(status): ProviderRegistration[]
├── findByCapability(contractVersion): ProviderRegistration[]
├── list(): ProviderRegistration[]
└── isRegistered(providerId): boolean
```

## Implementation

- **Storage:** In-memory `Map<string, ProviderRegistration>` — deterministic, no I/O, testable
- **Design:** Instance-based (not static), dependency-injectable for future pipeline integration
- **Lookup:** O(1) by ID, O(n) filter for capabilities/lifecycle
- **Determinism:** Immutable registration entries once registered; no mutation of existing entries

## Registration

Google Calendar will be pre-registered via a well-known entry:
- Identity: `google-calendar`, `Google Calendar`, `1.0.0`
- Lifecycle: `CERTIFIED`
- Capabilities: `events.list`, `events.get`, `events.insert`, `events.update`, `events.delete`
- Certification: `GOV-2026-PhaseIII-001`, `STAGE_3C`, `1.0.0`
- Policy: sandbox-supported, write-operations allowed

## File Structure

```
lib/platform/execution/
├── provider-registry.ts       — Interface + types
└── provider-registry-impl.ts  — Implementation

tests/platform/
└── provider-registry.test.ts  — Tests
```

## Governance

Introduces G-025 — Certified Provider Registration (recorded alongside implementation).
