# EV-KOS Enterprise Topology

## Status

Status: Enterprise Alpha EA-2 planning contract

Branch: `codex/enterprise-alpha`

This document defines enterprise topology only. It does not add execution, publishing, authentication integration, sessions, JWT, Prisma migrations, schema changes, OpenAI calls, graph writes, or database writes.

## Topology Model

```text
Organization
|-- Departments
|-- Teams
|-- Projects
|-- Workspaces
|   |-- Research Workspace
|   |-- Creator Workspace
|   |-- Ministry Workspace
|   |-- Executive Workspace
|   |-- Agency Workspace
|
`-- Shared Knowledge Layer
```

## Organization

The enterprise organization is modeled as `EV-KOS Enterprise`.

Departments:

- Research Intelligence
- Creator Growth
- Ministry Operations
- Executive Office
- Agency Delivery

Teams:

- Research Operators
- Content Operators
- Review Board
- Enterprise Admins
- Client Delivery

Projects:

- Enterprise Alpha
- Knowledge Ingestion Readiness

## Shared Knowledge Layer

The shared knowledge layer is a contract-only layer. It can be read by domain workspaces, but writes remain blocked pending governance, tenant scope enforcement, and approval workflow enforcement.

## Readiness

Organization topology is contract-ready. It is not persisted and does not change existing database schema.

Recommended EA-3: audit tenant guard coverage and define report-only organization/workspace route guards.

