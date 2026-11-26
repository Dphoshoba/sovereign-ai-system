# EV-KOS Enterprise Beta Limitations

Enterprise Beta is intentionally constrained. It is a frozen planning candidate,
not an enterprise runtime release.

## Runtime Limitations

- No runtime auth activation.
- No auth middleware activation.
- No session runtime.
- No JWT issuance.
- No provider runtime integration.

## Data and Persistence Limitations

- No persistence implementation.
- No Prisma schema changes.
- No migrations.
- No database writes.
- No graph writes.

## Execution Limitations

- No execution surfaces.
- No publishing surfaces.
- No OpenAI surfaces.

## Candidate Position

Enterprise Beta is suitable for freeze review and merge decisioning but not for
automatic deployment of enterprise runtime auth.
