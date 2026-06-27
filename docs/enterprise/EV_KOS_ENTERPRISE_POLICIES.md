# EV-KOS Enterprise Policies

## Purpose

This document defines EA-2 enterprise policy contracts. Policies are not persisted, enforced, or connected to existing governance write routes in this phase.

## Policy Domains

- Tenant scope.
- Workspace isolation.
- Membership provider requirement.
- Knowledge governance.
- Publishing block.

## Policy Rules

All EA-2 policies are:

- `contract-only`
- review required
- required before execution
- non-persistent
- non-mutating

## Blocked Capabilities

Policies keep these capabilities blocked:

- Execution.
- Graph writes.
- Publishing.
- Social posting.
- Email sends.
- Cross-workspace writes.
- Shared knowledge writes.
- Sessions.
- JWT.

## Legacy Governance Note

Existing `/api/enterprise-governance` routes include Prisma writes. EA-2 does not reuse or modify those routes. They require a separate audit before they can become part of the enterprise topology.

## Recommended EA-3

EA-3 should define report-only route guard coverage for organization, workspace, membership, and policy boundaries. It should remain non-executing unless separately approved.

