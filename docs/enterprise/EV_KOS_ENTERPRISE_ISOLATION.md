# EV-KOS Enterprise Isolation

## Purpose

This document defines the EA-3 enterprise isolation model.

## Isolation Areas

- Tenant isolation.
- Workspace containment.
- Organization boundaries.
- Policy segregation.
- Shared knowledge constraints.
- Cross-tenant leakage risk.

## Tenant Isolation

Future enterprise actions must include:

- `organizationId`
- `workspaceId`
- `actorId`

EA-3 only reports whether these fields are required by contract. It does not validate live requests or read sessions.

## Workspace Containment

Each workspace has a report-only guard that blocks future writes and restricts cross-workspace access to approved shared knowledge reads.

Workspace writes remain blocked.

## Shared Knowledge Constraints

The shared knowledge layer is read-only in EA-3. Shared knowledge writes, graph writes, entity upserts, and cross-workspace mutations remain blocked.

## Cross-Tenant Risk

EA-3 treats cross-tenant risk as low but not eliminated because:

- Auth is not integrated.
- Membership lookup is not enforced.
- Legacy enterprise governance routes include write behavior.
- Shared knowledge can bridge workspaces after future approval.

