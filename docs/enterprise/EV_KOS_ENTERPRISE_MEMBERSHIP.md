# EV-KOS Enterprise Membership

## Purpose

This document defines membership contracts for Enterprise Alpha EA-2. It does not create users, sessions, JWTs, provider identities, or database records.

## Membership Requirements

Future enterprise memberships must include:

- Actor type.
- Organization scope.
- Workspace scope.
- Role id.
- Department ids.
- Team ids.
- Membership status.

## EA-2 Membership States

The EA-2 contract supports:

- `invited`
- `active`
- `suspended`
- `removed`

EA-2 examples use `invited` because no auth provider is integrated.

## Blocked Areas

- No auth provider integration.
- No session creation.
- No JWT parsing or issuing.
- No database writes.
- No production authorization enforcement.

## Required Before EA-3 Or Later Enforcement

- Select identity provider.
- Map provider user id to enterprise actor.
- Map actor to organization and workspace memberships.
- Add report-only tenant guard checks.
- Define audit events for membership changes.

