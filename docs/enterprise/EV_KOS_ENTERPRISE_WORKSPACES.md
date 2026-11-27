# EV-KOS Enterprise Workspaces

## Purpose

This document defines the EA-2 workspace model for EV-KOS Enterprise Alpha. Workspaces are planning contracts only.

## Workspace Types

- Research Workspace
- Creator Workspace
- Ministry Workspace
- Executive Workspace
- Agency Workspace
- Shared Knowledge Layer

## Workspace Rules

Every workspace has:

- Stable workspace id.
- Owning department.
- Allowed role list.
- Data classification.
- Shared knowledge access policy.
- Write status set to `blocked`.

## Workspace Boundaries

Workspace writes remain blocked in EA-2. Cross-workspace writes remain blocked. Shared knowledge proposals are modeled but not persisted.

## Data Classifications

- Research Workspace: confidential.
- Creator Workspace: confidential.
- Ministry Workspace: restricted.
- Executive Workspace: restricted.
- Agency Workspace: confidential.
- Shared Knowledge Layer: restricted.

## Non-Goals

- No workspace persistence.
- No database writes.
- No schema changes.
- No auth provider integration.
- No session or JWT handling.
- No graph writes.

