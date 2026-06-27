# EV-KOS Enterprise Alpha Capabilities

Enterprise Alpha capabilities are contracts, audits, and preview surfaces only.
They do not enable runtime enterprise behavior.

## Capability Inventory

| Capability | Alpha Position |
| --- | --- |
| Enterprise foundation | Tenant, governance, and data boundary contracts are defined. |
| Organization topology | Organization, department, team, project, workspace, and shared knowledge layers are modeled. |
| Workspace model | Research, creator, ministry, executive, agency, and shared knowledge workspaces are described. |
| RBAC model | Enterprise roles, permissions, risk levels, and approval capabilities are modeled. |
| Membership contract | Membership scopes and enterprise role mapping are defined without persistence. |
| Tenant guards | Tenant, organization, workspace, and policy guards exist in report-only form. |
| Isolation audits | Cross-tenant risk, boundary validation, and shared knowledge constraints are documented. |
| Audit evidence | Event taxonomy, evidence packets, guard observability, and compliance surfaces are defined. |
| Approval workflows | Review boards, approval chains, delegation, evidence, and decision packets are modeled. |
| Policy lifecycle | Versioning, change requests, exceptions, drift detection, impact analysis, and evolution are defined. |
| Deployment gates | Promotion criteria, release boards, environments, release tiers, and production blockers are modeled. |
| Closure audit | Capability matrix, gap analysis, risk review, merge readiness, and beta readiness are summarized. |

## Compatibility With EV-KOS RC1

Enterprise Alpha is compatible with the EV-KOS V1 RC posture because it remains:

- Read-only.
- Preview-only.
- Contract-driven.
- Governance-preserving.
- Non-executing.
- Non-publishing.
- Non-persistent.

## Capability Boundaries

Enterprise Alpha does not grant operator powers, execute actions, publish
content, mutate the knowledge graph, call OpenAI, integrate authentication,
write to Prisma, install providers, or connect telemetry backends.
