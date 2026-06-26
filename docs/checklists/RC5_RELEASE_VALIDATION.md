# RC5 Release Validation Checklist

## Validation Route

- [ ] `/api/release/validation` is GET-only.
- [ ] Route returns release score.
- [ ] Route returns guard coverage.
- [ ] Route returns negative coverage.
- [ ] Route returns production blockers.
- [ ] Route returns risk level and candidate status.

## Blocked Capabilities

- [ ] Execution remains blocked.
- [ ] Publishing remains blocked.
- [ ] Social posting remains blocked.
- [ ] Graph writes remain blocked except explicit-test-write controlled path.
- [ ] Graph deletes remain blocked.
- [ ] Approval bypass remains blocked.
- [ ] Operator bypass remains blocked.
- [ ] OpenAI calls are not introduced.
- [ ] Automatic approvals remain blocked.
- [ ] Intent and review bypass remain blocked.

## Platform Boundaries

- [ ] No auth provider integration.
- [ ] No sessions.
- [ ] No JWT.
- [ ] No schema changes.
- [ ] No migrations.
- [ ] No live mutation attempts.
