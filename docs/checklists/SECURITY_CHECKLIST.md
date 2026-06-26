# Security Checklist

## Authentication

- [ ] Admin authentication is enforced.
- [ ] Operator authentication is enforced.
- [ ] API authentication is defined for mutating routes.

## Authorization

- [ ] Roles are mapped to operator actions.
- [ ] Permissions are checked before execution.
- [ ] Tenant scope is required for organization/workspace data.

## Request Safety

- [ ] Mutating routes validate request shape.
- [ ] Explicit intent flags are required for controlled writes.
- [ ] Rate limiting is defined for POST routes.
- [ ] Error responses avoid leaking secrets.

## Governance

- [ ] No automatic graph writes.
- [ ] No automatic graph deletes.
- [ ] No automatic approvals.
- [ ] No automatic publishing.
- [ ] No social posting without approval.
- [ ] No OpenAI generation outside governed routes.

## Audit

- [ ] Operator intent is recorded.
- [ ] Approval handoff is recorded.
- [ ] Execution outcomes are recorded.
- [ ] Rollback plans are documented before execution.
