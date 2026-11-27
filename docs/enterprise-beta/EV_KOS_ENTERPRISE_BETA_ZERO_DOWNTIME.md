# EV-KOS Enterprise Beta Zero-Downtime Auth Cutover (EB-7)

EB-7 defines zero-downtime auth cutover checkpoints in report-only mode.

## Controls

- Dual-read decision verification plan.
- Shadow claim validation plan.
- Feature-flag controlled cutover plan.
- Rollback-on-anomaly checkpoint plan.

## Constraints

- No runtime activation.
- No middleware auth wiring.
- No provider integration.
- No session persistence.
