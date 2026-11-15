# Preview versioned verifier activation

Status: **activated on Preview only.** This record does not authorise Production enablement, article audit, approval, scheduling, or publication.

## Activation identity

| Field | Value |
|---|---|
| Activation commit | `f6a648e8c565e86c26cff6f9308084b02626288c` |
| Branch | `integrate/production-research-integrity` |
| Deployment | `dpl_8nTq8rdqjYnqEV9onrAukGpKiDxN` |
| Environment | `preview` |
| Preview URL | `https://sovereign-ai-executive-leq0h8dn8-davidoshoba-3659s-projects.vercel.app` |
| Spec SHA-256 | `9D3C34F1689BBC0DB673A5E0A3B79A11B343C2792D4F9179BFA8E29E5ECC2419` |
| Flag | `VERSIONED_EDITORIAL_VERIFIER_ENABLED=true` on Preview only |
| Runtime revision | `article-grounded-ev-reg-1` |

## Behaviour

When the Preview env flag is `true`, Prepare for Review:

- evaluates claims with `evaluateVersionedClaim`
- writes engine revision `article-grounded-ev-reg-1`
- persists `specificationVersion` = `EV-REG-SPEC-1.0.0` and `disputes` as an array
- uses the zero-inclusive versioned average
- leaves baseline audits with null `specificationVersion` on the baseline gate

When the flag is unset or not `true`, Prepare still writes `article-grounded-v14` and omits the versioned columns.

## Verification

- Editorial suite: 100 files / 1,127 tests passed
- `tsc --noEmit` exited 0
- Local `npm run build` exited 0 (656 static pages)
- Preview `/api/health` via `vercel curl`: `{"ok":true,"versionedEditorialVerifierEnabled":true,"researchAuditEngineRevision":"article-grounded-ev-reg-1"}`
- Preview `/api/articles`: 401 `AUTHENTICATION_REQUIRED`
- Production aliases remain on deploy `cvw9iwkxn`
- Production `/api/health`: 200
- Flag listed only under Preview in `vercel env ls`
- No Prepare for Review, approval, schedule, or publish was run on the governing article

## Rollback

1. Remove or set `VERSIONED_EDITORIAL_VERIFIER_ENABLED` away from `true` on Preview.
2. Redeploy the previous Preview revision if required.
3. Leave the nullable `specificationVersion` and `disputes` columns in place.
4. Do not delete historical audits.

## Remaining risks

- Machine contradiction detection is still absent; Prepare persists an empty disputes array until human-recorded disputes exist.
- Scripture, named-secondary-document, and ambiguous “according to” rows remain outside the versioned evaluator.
- Baseline identity helpers are intentionally unchanged.
- Production must not receive this flag without a separate approval.
