# Gamma OS Implementation Guide

**Version:** EOS v1.0
**Status:** ACTIVE
**Relationship to EOS:** This guide defines day-to-day working practices. The EOS (`ENGINEERING_OPERATING_SYSTEM.md`) defines what must happen. This guide defines how to work.

---

## Coding Conventions

### TypeScript

- Use strict TypeScript with `--noEmit` for diagnostics.
- Prefer interfaces over type aliases for object shapes.
- Use `import type` for type-only imports to avoid bundling issues.
- Export all public interfaces and types from barrel files.
- Avoid `any`. Use `unknown` when the type is truly unknown, then narrow.
- Use `const` assertions for literal types.

### Naming

- **Files**: `kebab-case.ts` (e.g., `backoff-strategy.ts`)
- **Classes**: `PascalCase` (e.g., `RetryPolicy`)
- **Interfaces**: `PascalCase` with `Config`/`Result`/`Info` suffix where appropriate
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Private fields**: Prefix with `private` keyword; no underscore convention

### File Organisation

- One class or cohesive module per file.
- Tests mirror source paths under `tests/`.
- Index/barrel files re-export public API surface.

---

## Testing Conventions

### Framework

- Use Vitest for all tests.
- Run tests with `npx vitest run`.

### Test Organisation

- One test file per module, mirroring the source path.
- Group related tests in `describe` blocks.
- Use clear, descriptive test names that describe the expected behaviour.

### Coverage Requirements

- New code must include tests for:
  - Happy path
  - Error/edge cases
  - All exported functions and methods
- Integration tests required for multi-component interactions.

### Regression

- Run the complete regression suite before marking any work complete.
- Use `npx vitest run tests/stage3a/ tests/stage3b/ tests/platform/ tests/governance/ tests/reconciliation/` for full coverage.

---

## Documentation Standards

### Code Documentation

- Use JSDoc for public API surfaces only.
- Avoid inline comments that restate the code. Comment why, not what.
- Use clear parameter and return type documentation.

### Documentation Files

- Architecture documents in `governance/architecture/`.
- Certification documents in `governance/certification/`.
- Governance decisions in `governance/decisions/`.
- Engineering standards in `governance/standards/`.

### Markdown

- Use GitHub-Flavoured Markdown.
- Use tables for structured data.
- Use code blocks with language identifiers.
- Avoid emojis in technical documentation.

---

## Commit Message Format

```
<type>: <short description>

<optional body>
```

Types:
- `feat:` — New feature
- `fix:` — Bug fix
- `test:` — Test changes
- `docs:` — Documentation
- `refactor:` — Code restructuring
- `perf:` — Performance improvement
- `chore:` — Maintenance, tooling, dependencies

Examples:
```
feat: add exponential backoff with configurable jitter
fix: correct idempotency key collision in tight loops
test: add 56 operational hardening unit tests
```

---

## Branch Strategy

- Default branch: `main`
- Feature branches: `feat/<short-description>`
- Fix branches: `fix/<short-description>`
- Maintenance branches: `maint/<stage>-<fix-description>`
- No direct commits to `main` for feature work.

---

## Release Process

1. All tests pass on the release candidate.
2. Governance documentation is updated.
3. Milestone report is generated.
4. Tag is created (e.g., `gamma-drive-stage3c5-production-readiness`).
5. Release artifacts are archived to `governance/certification/<stage>/artifacts/`.

---

## Rollback Procedures

### Code Rollback

If a change introduces a regression:
1. Identify the breaking commit.
2. Revert the commit.
3. Create a new commit with the revert.
4. Tag as a maintenance release if the reverted change was certified.

### Runtime Rollback

If a provider mutation fails:
1. The rollback plan is validated by the RollbackValidator.
2. The RollbackExecutorImpl executes compensation steps through the adapter.
3. Each step includes retry, telemetry, and audit events.
4. The rollback outcome (COMPLETED/PARTIAL/FAILED) is recorded in the audit log.
5. The original execution is marked as ROLLED_BACK or FAILED accordingly.

---

## Definition of Done

A task is complete when:
- [ ] All implementation code is written
- [ ] TypeScript compiles cleanly (`npx tsc --noEmit`)
- [ ] All existing tests pass
- [ ] New tests cover the added functionality
- [ ] Documentation is updated
- [ ] Evidence is archived
- [ ] Commit is made with a descriptive message
- [ ] If certified: tag is created

---

## Review Checklist

Before requesting review:
- [ ] Code follows coding conventions
- [ ] Tests cover happy path and error cases
- [ ] No debug code, console.log, or commented-out code
- [ ] Public API is documented
- [ ] Architecture decisions are documented in ADRs
- [ ] Governance impact is assessed

---

## Certification Checklist

Before submitting for certification:
- [ ] Stage architecture is documented and approved
- [ ] All contracts are certified (if applicable)
- [ ] All provider adapters are certified (if applicable)
- [ ] Complete regression suite passes
- [ ] TypeScript compiles without errors
- [ ] Production build succeeds (if applicable)
- [ ] Governance documentation is updated
- [ ] Risk register is updated
- [ ] ADRs are filed for any architecture decisions
- [ ] Governance decision is recorded
- [ ] Milestone report is generated
- [ ] Evidence is archived
- [ ] Tag is created
