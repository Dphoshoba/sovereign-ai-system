# EV-KOS Enterprise Boundaries

## Purpose

This document records the EA-3 enterprise boundary validation contract.

## Boundary Rules

Enterprise boundaries are valid for planning only and invalid for execution.

Boundary validation returns:

- Tenant isolation score.
- Workspace boundary score.
- Organization boundary score.
- Policy coverage.
- Cross-tenant risk score.
- Enterprise safety score.

## Execution Boundary

EA-3 keeps these capabilities blocked:

- Execution.
- Publishing.
- Social posting.
- Graph writes.
- Database writes.
- OpenAI calls.
- Auth provider integration.
- Sessions.
- JWT.

## Legacy Boundary Warning

Existing `/api/enterprise-governance` routes include Prisma write behavior and remain outside EA-3 guard enforcement. They require separate audit before reuse.

## Recommended EA-4

EA-4 should define enterprise audit event taxonomy and report-only guard evidence capture. It should not add persistence, execution, authentication, sessions, JWT, OpenAI calls, graph writes, or publishing.

