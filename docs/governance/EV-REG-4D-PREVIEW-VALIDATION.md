# Milestone 4D Preview validation package

Status: **prepared, not deployed**. This package does not authorise a Preview or Production deployment.

## Verified local state

Repository: `C:\Users\David\echoes-visions-preview-security`

Branch: `integrate/production-research-integrity`

| Milestone | Commit | Result |
|---|---|---|
| 3Y | `83bd39b4a8dc03237898faefb9e3bc6fe9850219` | Code compatibility committed. Migration pending. |
| 3Z | `72617c6b83f50ffaf2a78095c518c2d49b2029a1` | Versioned identity and five evidence states. |
| 4A | `080a9cfe4e65c0a7009395831e9eed1c0c35de77` | Dispute identity, checksums, and expiry. |
| 4B | `373ef4056566334cb70034ce92424f28a324f63e` | Versioned publication checks fail closed. Verifier activation remains off. |
| 4C | `675bb830794e9758ab9fb5d35fd4785081f8e851` | Legacy publication JSON cannot authorise an article. |

Adopted specification SHA-256 remains `9D3C34F1689BBC0DB673A5E0A3B79A11B343C2792D4F9179BFA8E29E5ECC2419`.

`npx tsc --noEmit --pretty false --incremental false` exited 0 after Milestone 4B. The editorial suite on the 4B and 4C implementation passed 1,121 tests. Two publication-gate key assertions failed because the response gained `articlePublicationAuthorised`. That contract test was updated and `tests/editorial/research-route-auth.test.ts` then passed 76 tests. No timeout was raised.

## What stays inactive

`VERSIONED_EDITORIAL_VERIFIER_ENABLED` is false. Prepare for Review still writes `article-grounded-v14` and does not persist `specificationVersion` or `disputes`. The conditional migration in `docs/governance/EV-REG-3Y-CONDITIONAL-MIGRATION-PLAN.md` has not been generated or executed. No database connection was opened.

## Deployment instructions, after explicit approval

1. Confirm the deployed commit is the 4D commit on this branch.
2. Confirm the specification hash above.
3. Do not set a database URL that identifies Supabase project `kqptdgbttfuqkzxzbazw`.
4. Do not run `prisma db push`, `prisma migrate deploy`, or schema SQL.
5. Leave the versioned verifier flag false until a verified non-Production schema inspection is complete.
6. Do not run Prepare for Review, and do not approve, schedule, or publish article `cmw0ln6wb000078ungn5f9lqk`.

## Rollback

Redeploy the previous application revision. No database rollback is required because this programme executed no migration. The nullable columns in the conditional plan must not be dropped as a first rollback if they are later added. Code rollback is sufficient while those columns are absent.
