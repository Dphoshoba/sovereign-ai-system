# EV-KOS Enterprise RBAC

## Purpose

This document defines the EA-2 role model for enterprise planning. RBAC is contract-only and is not enforced by a production auth provider in EA-2.

## Roles

- Enterprise Viewer
- Enterprise Reviewer
- Research Lead
- Content Strategist
- Enterprise Administrator

## Role Rules

Each role defines:

- Workspace scope.
- Permission labels.
- Approval authority.
- Risk level.
- Execution status.

All roles have `executionAllowed: false`.

## Readiness

The RBAC model is contract-ready for EA-2 planning. It is not connected to sessions, JWTs, provider identities, or database-backed authorization.

## Required Before Enforcement

- Auth provider decision.
- Operator identity mapping.
- Organization and workspace membership lookup.
- Report-only guard prototypes.
- Approval workflow binding.
- Audit event taxonomy.

