# EV-KOS Enterprise Beta Guard Evidence

EB-3 defines report-only guard evidence. It does not persist evidence, write to
Prisma, install middleware, integrate an auth provider, create sessions, issue
JWTs, execute actions, publish, write graph data, or call OpenAI.

## Evidence Items

Guard evidence records:

- Required claim checks.
- Permission requirements.
- Tenant boundary status.
- Approval boundary status.
- Operator-visible explanation.

All evidence is static and preview-only in EB-3.
