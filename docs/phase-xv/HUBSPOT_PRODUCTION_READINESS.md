# HubSpot Production Readiness

## Status
HubSpot now has a Gamma Factory-style connector scaffold and Phase XV readiness projection.

This is not live HubSpot execution. It is the governed production-readiness surface needed before deeper HubSpot implementation.

## Files
Connector scaffold:

- `lib/connectors/hubspot/oauth-adapter.ts`
- `lib/connectors/hubspot/api-client.ts`
- `lib/connectors/hubspot/resource-parser.ts`
- `lib/connectors/hubspot/action-set.ts`
- `lib/connectors/hubspot/index.ts`

Gamma reader:

- `lib/gamma/hubspot-reader.ts`

Readiness projection:

- `lib/connectors/hubspot/production-readiness.ts`

Tests:

- `tests/connectors/hubspot.test.ts`

## Contract Coverage
HubSpot is evaluated against the Gamma 2.0 Phase XV production connector contract:

- OAuth
- Capabilities
- Preview
- Approval
- Queue
- Audit
- Retry
- Certification
- Health
- Metrics

## Boundary
HubSpot write actions queue when live execution is disabled. Live HubSpot execution remains unimplemented until a later governed approval, audit, and connector certification pass.

## Next Work
Next HubSpot work:

1. HubSpot-specific compliance event model
2. HubSpot hardening dashboard
3. HubSpot certification checklist
4. Route/API smoke validation
5. Full production connector docs
