# EV-KOS Enterprise Guards

## Status

Status: Enterprise Alpha EA-3 report-only guard contracts

Branch: `codex/enterprise-alpha`

EA-3 defines tenant, workspace, organization, policy, and shared knowledge guard contracts. It does not enforce guards, write data, integrate authentication, create sessions, issue JWTs, call OpenAI, publish, execute actions, write graph data, or change Prisma schema.

## Guard Families

- Tenant guards.
- Workspace guards.
- Organization guards.
- Policy isolation guards.
- Shared knowledge constraints.
- Cross-tenant risk checks.

## Guard Mode

All EA-3 guards are `report-only`.

Report-only means:

- The system can describe the required boundary.
- The system can score guard coverage.
- The system can identify risks and missing enforcement.
- The system cannot block or execute runtime behavior.
- The system cannot write audit records.

## Guard Route

`/api/enterprise-alpha/guards`

The route is GET-only and read-only. It returns guard coverage, isolation scores, cross-tenant risk, and recommended EA-4 work.

## Required Before Enforcement

- Auth provider integration approved separately.
- Organization and workspace membership lookup.
- Route guard middleware or helper approved.
- Rate limits enforced.
- Audit event taxonomy approved.
- Persistence plan approved.

