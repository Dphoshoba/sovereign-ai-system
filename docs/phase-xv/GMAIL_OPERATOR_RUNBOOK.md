# Gmail Operator Runbook

Last updated: 2026-07-12

## Scope

This runbook governs Gmail connector operation during Phase XV remediation and future production certification.

It covers safe operator workflows for preview, approval, queue, retry, revocation, rollback, incident response, and evidence collection.

## Current Operating Mode

| Field | Value |
| --- | --- |
| Connector | Gmail |
| Phase | Phase XV - Production Integration Platform |
| Current status | Simulation-certified reference connector |
| Live send status | Not authorized |
| Real execution flag | Disabled by default |
| Operator approval | Required before any future live action |
| Credential requirement | Explicitly supplied per live validation |

## Golden Rule

No real email may be sent unless the operator explicitly approves that exact action, the required credentials are supplied for that action, the approval receipt exists, and the action is routed through queue, execution, and audit.

## Normal Simulation Workflow

1. Review the requested Gmail action.
2. Generate or inspect the preview.
3. Confirm the preview has no side effects.
4. Approve or reject the simulated action.
5. Queue the approved simulated action.
6. Verify the simulation receipt and audit entry.
7. Export evidence if the action supports certification.

Expected result: no message is sent and no live Gmail account is modified.

## Approval Workflow

| Step | Operator check |
| --- | --- |
| Preview | Recipients, subject, body, attachments, and risk warnings are visible |
| Safety | No secret, token, or sensitive metadata is exposed |
| Boundary | Action is simulation unless explicit live approval is being performed |
| Reason | Approval or rejection reason is recorded |
| Queue | Approved action has a queue id and idempotency key |
| Audit | Approval receipt and audit reference are generated |

## Rejection Workflow

Reject the action when:

- Recipient list is unclear.
- Content is not ready.
- Attachments are missing or unsafe.
- Credentials are missing.
- Live execution was requested without explicit approval.
- Scope, quota, rate-limit, or token health is degraded.
- The preview does not match the requested action.

Record the reason and do not queue the action for execution.

## Retry Workflow

| Failure type | Operator action |
| --- | --- |
| Rate limit | Hold until backoff window clears |
| Quota risk | Pause and review quota posture |
| Expired token | Refresh only through approved OAuth flow |
| Revoked token | Reconnect account through approved OAuth flow |
| Permission denied | Do not retry automatically |
| Validation error | Return to preview correction |
| Unknown error | Move to dead-letter review after configured attempts |

## Revocation Workflow

1. Disable the connector for the affected account.
2. Revoke OAuth token through Google account controls or provider API when available.
3. Mark connection as revoked or disconnected.
4. Confirm no queued live actions remain eligible.
5. Export audit evidence.
6. Record incident notes and remediation owner.

## Rollback Workflow

Gmail send actions are generally irreversible once delivered. Before live certification, rollback means:

- Cancel queued actions before execution.
- Disable connector execution.
- Revoke tokens if account safety is in question.
- Preserve audit evidence.
- Notify operator that delivered messages cannot be recalled by Gamma.

## Incident Workflow

| Incident | Response |
| --- | --- |
| Unexpected live send attempt | Disable execution flag, stop queue, preserve audit, escalate |
| Credential exposure suspected | Revoke token, rotate secret, review logs, export evidence |
| Quota exhaustion | Stop execution, hold queue, review provider limits |
| Approval bypass suspected | Stop connector, audit queue and receipts, block live mode |
| Audit missing | Stop connector and treat certification as failed |

## Certification Evidence

Collect these artifacts for final Gmail operational certification:

- Test run id.
- Operator approval receipt.
- Queue id.
- Idempotency key.
- Execution mode.
- Connector health snapshot.
- Scope posture snapshot.
- Quota and rate-limit snapshot.
- Audit receipt.
- Revocation and rollback readiness note.

## Live Validation Preconditions

Live validation requires all of the following:

- Explicit operator approval for the exact validation action.
- Dedicated test Gmail account.
- Approved OAuth credentials.
- Production or staging redirect URI verified.
- No production recipient.
- No real customer data.
- Queue and audit enabled.
- Revocation workflow tested or documented.

## Handover

After Gmail operational certification is complete, the handover package must include:

- Final Gmail release certificate.
- Updated connector manifest.
- Operator runbook.
- Production activation checklist.
- Evidence bundle.
- Freeze tag.
- Calendar connector readiness handoff.
