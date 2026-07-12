# Gamma Technical Debt Register

Last updated: 2026-07-12

## Immediate

| Debt | Impact | Priority | Estimated Effort | Recommended Phase |
| --- | --- | --- | --- | --- |
| Smoke validation can hit stale local servers when multiple ports are active | False failures or false confidence during local release checks | High | 0.5 day | Stage 5 closeout / Phase XV bootstrap |
| Late release smoke routes are heavier than early readiness routes | Slower local certification and CI feedback | Medium | 1-2 days | Phase XV bootstrap |
| Documentation inventory is commit-bound rather than generated into a machine-readable manifest | Manual review still needed for broad docs corpus audits | Medium | 1 day | Phase XV documentation hardening |

## Medium-Term

| Debt | Impact | Priority | Estimated Effort | Recommended Phase |
| --- | --- | --- | --- | --- |
| Release artifact payloads are comprehensive and may repeat evidence fields | Larger response payloads and repeated JSON serialization cost | Medium | 2-3 days | Phase XV / connector certification |
| Connector certification checklist is documented but not yet enforced by an automated validator | Risk of inconsistent connector readiness reviews | High | 2 days | Phase XV |
| Current dashboard statistics are markdown-based rather than generated from a typed report model | Manual dashboard updates after milestones | Medium | 1-2 days | Phase XV or Phase XVI |

## Long-Term

| Debt | Impact | Priority | Estimated Effort | Recommended Phase |
| --- | --- | --- | --- | --- |
| Release evidence graph is request-scoped but not exposed as a reusable read-model interface outside Stage 5 | Future phases may duplicate closeout evidence projections | Medium | 3-5 days | Phase XVI |
| Architecture maturity scoring is documented rather than calculated from formal evidence | Executive reporting can drift from implementation evidence | Medium | 3 days | Phase XVI / Phase XVII |
| Multi-phase roadmap inventory spans many docs families without a central index generator | Large-system governance reviews require manual corpus traversal | Low | 3-5 days | Phase XVIII+ |

## Debt Resolved In Stage 5

| Resolved Debt | Resolution |
| --- | --- |
| Manual Stage 5 endpoint count propagation | Central Stage 5 Surface Registry |
| Manual smoke-route count propagation | Derived smoke inventory |
| Projection drift across release artifacts | Shared Release Graph and Projection Registry |
| Public payload instability risk during refactor | Backward-compatible public wrappers over source builders |

## Closeout Position

No technical debt blocks Stage 5 GA. Remaining items are operational hardening and post-baseline developer-experience improvements.
