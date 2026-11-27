# EV-KOS Enterprise Beta Route Guards

EB-2 defines enterprise route guard architecture in preview mode only. It does
not add middleware, enforce authorization, install an auth provider, create
sessions, issue JWTs, persist guard decisions, or enable execution.

## Guard Model

Each guard defines:

- Route pattern.
- Enterprise area.
- Risk level.
- Required claims.
- Required permissions.
- Report-only enforcement mode.

## Runtime Position

All guards remain report-only. They describe the shape of future enforcement
without changing route behavior.
