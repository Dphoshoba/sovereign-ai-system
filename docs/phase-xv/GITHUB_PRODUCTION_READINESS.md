# GitHub Production Readiness

## Status
GitHub now has a Gamma Factory-style connector scaffold and Phase XV readiness projection.

This is not live GitHub execution. It is the governed production-readiness surface needed before deeper GitHub implementation.

## Files
Connector scaffold:

- `lib/connectors/github/oauth-adapter.ts`
- `lib/connectors/github/api-client.ts`
- `lib/connectors/github/resource-parser.ts`
- `lib/connectors/github/action-set.ts`
- `lib/connectors/github/index.ts`

Gamma reader:

- `lib/gamma/github-reader.ts`

Readiness projection:

- `lib/connectors/github/production-readiness.ts`

Tests:

- `tests/connectors/github.test.ts`

## Contract Coverage
GitHub is evaluated against the Gamma 2.0 Phase XV production connector contract:

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
GitHub write actions queue when live execution is disabled. Live GitHub execution remains unimplemented until a later governed approval, audit, and connector certification pass.

## Next Work
Next GitHub work:

1. GitHub-specific compliance event model
2. GitHub hardening dashboard
3. GitHub certification checklist
4. Route/API smoke validation
5. Full production connector docs
