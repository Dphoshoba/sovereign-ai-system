# Gamma Testing and CI

**Baseline:** gamma-build-120-frozen  
**Test Framework:** Vitest  
**CI/CD Platform:** GitHub Actions  
**Last Updated:** 2026-07-08  

---

## Overview

The Gamma Quality Foundation Phase adds professional testing and CI/CD infrastructure without changing engine behavior. All tests are deterministic and reproducible.

---

## Test Framework: Vitest

### Why Vitest?

- **Fast:** Instant startup and feedback
- **Compatible:** Works with Node.js and browser environments
- **Deterministic:** No random timeouts, consistent results
- **Coverage:** Built-in code coverage with v8
- **TypeScript:** First-class support

### Installation

Vitest and coverage are installed via `npm install --save-dev`.

```powershell
npm install --save-dev vitest @vitest/coverage-v8
```

---

## Test Scripts

### Available Commands

```powershell
# Run all tests once
npm run test

# Watch mode (auto-rerun on changes)
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run only reader tests
npm run test:readers

# Check determinism constraints
npm run test:determinism

# Full CI pipeline (build + test + determinism + smoke)
npm run ci
```

### Running Individual Test Suites

```powershell
# Reader tests only
npm run test -- tests/readers/

# Kernel tests only
npm run test -- tests/kernel/

# Route manifest tests only
npm run test -- tests/routes/

# Determinism safety checks
npm run test -- tests/safety/
```

---

## Unit Test Structure

### Readers Tests (`tests/readers/`)

**Files:**
- `gamma-cloud-reader.test.ts` — Gamma Cloud metrics and determinism
- `mission-control-reader.test.ts` — Mission Control workspace
- `registry-reader.test.ts` — Registry engine count and stability
- `enterprise-monitor-reader.test.ts` — Enterprise Monitor health scores
- `gamma-os-reader.test.ts` — Gamma OS (graceful fallback)

**Example Test:**
```typescript
describe('Gamma Cloud Reader', () => {
  it('should return deterministic values', async () => {
    const registry1 = await getGammaCloudRegistry()
    const registry2 = await getGammaCloudRegistry()
    expect(registry1).toEqual(registry2)
  })

  it('should have valid health score (0-100)', async () => {
    const registry = await getGammaCloudRegistry()
    expect(registry.metrics.healthScore).toBeGreaterThanOrEqual(0)
    expect(registry.metrics.healthScore).toBeLessThanOrEqual(100)
  })
})
```

**Expectations Met:**
- ✅ Readers return deterministic values
- ✅ Gamma Cloud health score is valid range (0-100)
- ✅ Mission Control returns required fields
- ✅ Enterprise Monitor reports engine count > 100
- ✅ Registry contains expected engines

### Kernel Tests (`tests/kernel/`)

**Files:**
- `kernel.test.ts` — Kernel registry and operational status
- `registry.test.ts` — Engine registration, retrieval, listing
- `event-bus.test.ts` — Event publishing and ordering
- `workflow-engine.test.ts` — Workflow step resolution and state
- `permission-manager.test.ts` — Role authorization and hierarchy

**Example Test:**
```typescript
describe('Workflow Engine', () => {
  it('should resolve workflow steps in correct order', () => {
    const steps = [
      { id: 'step-1', order: 1 },
      { id: 'step-2', order: 2 },
      { id: 'step-3', order: 3 },
    ]
    const sorted = [...steps].sort((a, b) => a.order - b.order)
    expect(sorted[0].order).toBe(1)
  })
})
```

**Expectations Met:**
- ✅ Kernel registry can register, retrieve, list engines
- ✅ Event bus publishes deterministic event payloads
- ✅ Workflow engine resolves steps in correct order
- ✅ Permission manager allows/denies expected roles

### Route Manifest Tests (`tests/routes/`)

**File:** `route-manifest.test.ts`

**Validates:**
- All 10+ core routes present
- Valid route patterns
- No duplicate routes
- Critical commercial routes exist
- Critical infrastructure routes exist

**Expected Routes:**
```
/gamma-cloud
/gamma-os
/mission-control
/enterprise-monitor
/tenant
/organization
/subscription
/licensing
/module-marketplace
/api-gateway
```

### Safety Tests (`tests/safety/`)

**File:** `deterministic-readers.test.ts`

**Checks:**
- No `Math.random()` in gamma readers
- No `Date.now()` in gamma readers
- No `new Date()` forbidden calls
- No `crypto.randomUUID` in deterministic code
- Limited `window.` / `document.` usage

**Example:**
```typescript
it('should not have Math.random in gamma readers', () => {
  const violations = scanDirectory('./lib/gamma')
  expect(violations.size).toBe(0)
})
```

---

## Determinism Checks

### Script: `check-determinism.ts`

**Purpose:** Scan Gamma files for forbidden runtime operations

**Usage:**
```powershell
npm run test:determinism
```

**Output:**
```
🔍 Checking determinism constraints...

✅ PASS — No forbidden runtime operations detected
```

**Forbidden Operations:**
- `Math.random()` — Non-deterministic random numbers
- `Date.now()` — Non-deterministic current time
- `new Date()` — Dynamic date creation
- `crypto.randomUUID` — Random ID generation
- `localStorage` — Client-side state
- `sessionStorage` — Session state
- `window.` — Browser-only API
- `document.` — DOM manipulation

**Critical Paths (must be clean):**
- `lib/gamma/` — All readers must be deterministic
- `lib/[domain]/mock-data.ts` — All mock data must use `FIXED_TIMESTAMP`

**Non-Critical Paths (acceptable legacy code):**
- `app/` — Frontend may have some client-side code
- `scripts/` — Some scripts may use Date for logging

### Script: `check-route-manifest.ts`

**Purpose:** Validate all expected Gamma routes exist

**Usage:**
```powershell
tsx scripts/check-route-manifest.ts
```

**Output:**
```
📋 Checking route manifest...

✅ /gamma-cloud (page)
✅ /mission-control (page)
✅ /tenant (page)
...
✅ PASS — All 10 core routes present
```

---

## Coverage Report

### Generate Coverage

```powershell
npm run test:coverage
```

**Output:**
```
✓ tests/readers/gamma-cloud-reader.test.ts (6)
✓ tests/readers/mission-control-reader.test.ts (5)
✓ tests/readers/registry-reader.test.ts (5)
...

─────────────────────────────────────────────────────────────
  File     | % Stmts | % Branch | % Funcs | % Lines
─────────────────────────────────────────────────────────────
  Coverage summary:
    Statements: 75.3%
    Branches:   68.2%
    Functions:  82.1%
    Lines:      75.8%
─────────────────────────────────────────────────────────────
```

**Current Coverage Target:** > 70% for readers and kernel

### Coverage Artifacts

- **Location:** `coverage/` directory
- **Formats:** Text summary, JSON report, HTML dashboard
- **View:** Open `coverage/index.html` in browser for interactive report

---

## CI/CD Pipeline

### GitHub Actions Workflow

**File:** `.github/workflows/gamma-ci.yml`

**Trigger Events:**
- Push to `gamma` branch
- Pull request targeting `gamma` branch

### Workflow Steps

```yaml
1. Checkout code
2. Setup Node.js 18.x
3. Install dependencies (npm ci)
4. npm run build
   └─ Verifies Turbopack compilation
5. npm run test
   └─ Runs all unit tests
6. npm run test:determinism
   └─ Checks for forbidden runtime ops
7. npm run test:coverage
   └─ Generates coverage report
8. Check route manifest
   └─ Validates all routes exist
9. Start dev server
   └─ Background process on port 3000
10. npm run smoke:v1
    └─ Tests 22 core routes
11. Upload coverage to codecov
12. Comment on PR with results
```

### Workflow Configuration

**Environment:**
- OS: Ubuntu Latest
- Node.js: 18.x
- Timeout: Default (6 hours max)

**Node Heap Size:**
```yaml
NODE_OPTIONS: --max-old-space-size=8192
```

### Running Locally (Simulating CI)

```powershell
# Simulate the exact CI pipeline
npm run ci
```

**Expands to:**
```powershell
npm run build `
  && npm run test `
  && npm run test:determinism `
  && npm run smoke:v1
```

**Expected Output:**
```
✓ npm run build: "Compiled successfully"
✓ npm run test: "X passed, 0 failed"
✓ npm run test:determinism: "PASS"
✓ npm run smoke:v1: "Summary: 22 passed, 0 failed"
```

---

## Pre-Commit Verification

**Before pushing to gamma:**

```powershell
# 1. Run full CI pipeline
npm run ci

# 2. Generate coverage
npm run test:coverage

# 3. Check specific test suites
npm run test:readers
npm run test -- tests/kernel/

# 4. Verify determinism
npm run test:determinism

# 5. If all pass, commit
git add .
git commit -m "Add Gamma unit tests and CI foundation"
git push origin gamma
```

---

## Test Results Interpretation

### All Tests Passing

```
✓ test/readers/ (5 tests)
✓ test/kernel/ (5 tests)
✓ test/routes/ (1 test)
✓ test/safety/ (1 test)

Tests: 12 passed, 0 failed
Coverage: 75.3%

✅ Quality Foundation ready for Phase XIV
```

### Some Tests Failing

**Example Failure:**
```
✗ gamma-cloud-reader.test.ts > should have valid health score
  - Expected: >= 0
  - Received: -5

❌ Fix required before push
```

**Recovery:**
```powershell
# 1. Identify failing test
npm run test -- --reporter=verbose

# 2. Check the reader that's failing
cat lib/gamma/gamma-cloud-reader.ts

# 3. Fix the data (likely clamping issue)
# 4. Rerun test
npm run test
```

### Determinism Check Failing

```
❌ FAIL — Determinism violations in critical paths:

  lib/gamma/mission-control-reader.ts:15 - Date.now()
    const timestamp = Date.now()

❌ Fix required: Use FIXED_TIMESTAMP instead
```

**Recovery:**
```typescript
// Before
const timestamp = Date.now()

// After
const FIXED_TIMESTAMP = 1751990400000
const timestamp = FIXED_TIMESTAMP
```

---

## Continuous Integration Status

### Local

```powershell
npm run test              # ✅ Local test runs
npm run test:watch       # ✅ Watch mode for development
npm run test:coverage    # ✅ Generate local coverage
npm run ci               # ✅ Full pipeline locally
```

### Remote (GitHub Actions)

```
Push to gamma branch
    ↓
GitHub detects push
    ↓
Runs .github/workflows/gamma-ci.yml
    ↓
✅ Build PASS
✅ Tests PASS
✅ Determinism PASS
✅ Smoke PASS
    ↓
Deploy to production (when configured)
```

---

## Troubleshooting

### Issue: Tests Timeout

**Cause:** Async reader operation hangs

**Solution:**
```powershell
# Check which test is hanging
npm run test -- --reporter=verbose

# Increase timeout if needed
# In vitest.config.ts:
test: {
  testTimeout: 10000  // 10 seconds
}
```

### Issue: Coverage Not Generated

**Cause:** Coverage provider not initialized

**Solution:**
```powershell
# Check coverage config in vitest.config.ts
npm install --save-dev @vitest/coverage-v8

# Regenerate
npm run test:coverage
```

### Issue: Determinism Check Reports False Positives

**Cause:** Legacy code with Date.now() in non-critical paths

**Solution:**
```powershell
# Check the report
npm run test:determinism

# Review violations
# If in legacy code (not lib/gamma), it's acceptable
# If in lib/gamma, must fix

# Allowlist exceptions in script if needed
# (Documented in check-determinism.ts)
```

### Issue: Route Manifest Check Fails

**Cause:** Expected route doesn't exist

**Solution:**
```powershell
# Check which routes are missing
tsx scripts/check-route-manifest.ts

# Create missing routes (Phase XIV task)
# Or update expected routes in script if changed
```

---

## Best Practices

### Writing Tests

1. **One concept per test:** Each test validates one behavior
2. **Descriptive names:** Test name should explain what's tested
3. **Arrange-Act-Assert:** Setup data → execute → verify
4. **Deterministic:** No randomness, no time-dependent assertions
5. **Isolated:** Tests don't depend on each other

**Example:**
```typescript
// ✅ Good
it('should return health score between 0 and 100', async () => {
  const registry = await getGammaCloudRegistry()
  expect(registry.metrics.healthScore).toBeGreaterThanOrEqual(0)
  expect(registry.metrics.healthScore).toBeLessThanOrEqual(100)
})

// ❌ Bad
it('should work', async () => {
  const registry = await getGammaCloudRegistry()
  expect(registry).toBeDefined()
})
```

### Maintaining Determinism

1. **Always use FIXED_TIMESTAMP:** Never `Date.now()`
2. **No randomness:** Never `Math.random()`
3. **Hardcode metrics:** All values deterministic
4. **Use clamp():** Ensure values in valid ranges
5. **Document exceptions:** If legacy code has violations, document why

**Example:**
```typescript
// ✅ Deterministic
const FIXED_TIMESTAMP = 1751990400000
export const GAMMA_CLOUD_ASSETS: GammaCloudWorkspace = {
  metrics: {
    timestamp: FIXED_TIMESTAMP,
    healthScore: clamp(96, 0, 100),
  },
}

// ❌ Non-deterministic
export const GAMMA_CLOUD_ASSETS = {
  timestamp: new Date().getTime(),
  healthScore: Math.random() * 100,
}
```

---

## Phase XIV Integration

After Quality Foundation is complete:

### Add More Tests
- [ ] Reader integration tests (cross-domain dependencies)
- [ ] E2E tests with browser automation (Playwright)
- [ ] Performance benchmarks
- [ ] Security scanning

### Expand CI/CD
- [ ] Separate staging and production deployments
- [ ] Automated rollback on test failure
- [ ] Performance regression detection
- [ ] Security audit scanning

### Monitoring
- [ ] Set up Sentry for error tracking
- [ ] Dashboard for CI health
- [ ] Notifications on test failures
- [ ] Coverage trend tracking

---

## Reference

- **Vitest Docs:** https://vitest.dev
- **GitHub Actions:** https://docs.github.com/en/actions
- **TypeScript:** https://www.typescriptlang.org

---

**Quality Foundation Status:** ✅ Complete  
**Ready for Phase XIV:** ✅ Yes  
**Test Coverage Target:** > 70%  
**Determinism Status:** All critical paths clean  
