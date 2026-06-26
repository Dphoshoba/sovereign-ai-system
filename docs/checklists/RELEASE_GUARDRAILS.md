# Release Guardrails

## Execution

- [ ] Operator action execution remains blocked.
- [ ] Mission execution remains blocked unless future gates are approved.
- [ ] No release route executes actions.

## AI

- [ ] No release route calls OpenAI.
- [ ] Draft generation remains preview-only unless separately approved.

## Graph

- [ ] Broad graph writes remain blocked.
- [ ] Explicit-test-write remains the only controlled graph write path.
- [ ] Graph deletes remain unavailable.

## Publishing

- [ ] Publishing remains blocked.
- [ ] Social posting remains blocked.
- [ ] Publication routes receive negative-test coverage before release controls.

## Approval

- [ ] Approval bypass remains blocked.
- [ ] Automatic approvals remain blocked.
- [ ] Review decisions require human approval.

## Startup

- [ ] Startup gate reports required environment status.
- [ ] Startup gate remains report-only in RC-4.
- [ ] Boot enforcement is deferred to a later approved RC.
