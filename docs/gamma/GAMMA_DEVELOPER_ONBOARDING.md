# Gamma Developer Onboarding

**Baseline:** gamma-build-120-frozen  
**Target Audience:** Developers adding new builds to Gamma  
**Last Updated:** 2026-07-08  

---

## Prerequisites

- **OS:** Windows 10+, macOS 12+, or Linux (Ubuntu 20+)
- **Node.js:** 18.17+ LTS
- **npm:** 9.0+
- **Git:** 2.36+
- **RAM:** 16GB minimum (build requires 8GB heap)
- **Disk:** 10GB free (node_modules ~5GB, build artifacts ~2GB)

---

## Setup: Clone & Install

### Clone Repository

```powershell
git clone https://github.com/Dphoshoba/sovereign-ai-system.git
cd echoes-visions-nextjs-cta
git checkout gamma
git fetch origin gamma-build-120-frozen
```

### Install Dependencies

```powershell
npm install
```

**Expected output:**
```
added 400 packages in 25s
```

### Verify Installation

```powershell
npm run build 2>&1 | Select-String "Compiled successfully"
```

**Expected:** "Compiled successfully" message within 4 minutes.

---

## Local Development Workflow

### Start Development Server

```powershell
npm run dev -- -p 3000
```

**Expected output:**
```
▲ Next.js 16.2.6 (webpack)
- Local:         http://localhost:3000
✓ Ready in 2.2s
```

### View Application

- Open http://localhost:3000
- Navigate to any domain: `/tenant`, `/organization`, `/deployment`, etc.
- All routes serve SSR content

### Stop Development Server

```powershell
Ctrl+C
```

---

## Build & Verify Workflow

### Full Production Build

```powershell
npm run build
```

**Expected output:**
```
Ô£ô Compiled successfully in 3.9min
Finished TypeScript in 2.6min
Collecting page data using 7 workers...
[Generated 240 routes]
```

**Build time:** 3–5 minutes  
**TypeScript time:** 2–3 minutes  
**Total:** ~5 minutes

### Run Smoke Tests

```powershell
# Start dev server in another terminal
npm run dev -- -p 3001

# In original terminal
$env:BASE_URL="http://localhost:3001"
npm run smoke:v1
```

**Expected output:**
```
Summary: 22 passed, 0 failed, 22 total
```

All tests must pass before committing.

---

## File Naming Conventions

### TypeScript Files
- **Domain folders:** kebab-case  
  - `lib/tenant/`, `app/deployment/`, etc.
- **Reader functions:** camelCase  
  - `getTenantRegistry()`, `getDeploymentRegistry()`
- **Type definitions:** PascalCase  
  - `TenantWorkspace`, `DeploymentMetrics`

### Export Patterns

```typescript
// types.ts: All types must be exported
export type TenantWorkspace = { ... }
export type TenantMetrics = { ... }

// mock-data.ts: Assets must be named [UPPER_CASE]_ASSETS
export const TENANT_ASSETS: TenantWorkspace = { ... }

// reader.ts: Functions must be async
export async function getTenantRegistry(): Promise<TenantWorkspace> { ... }
```

---

## Adding Build 121: Step-by-Step

### Phase 1: Create Domain Type System

**File:** `lib/[domain]/types.ts`

```typescript
export type [Domain]Status = "active" | "inactive"

export type [Domain]Config = {
  id: string
  name: string
  status: [Domain]Status
  count: number
}

export type [Domain]Metrics = {
  total: number
  active: number
  health: number
}

export type [Domain]Workspace = {
  items: [Domain]Config[]
  metrics: [Domain]Metrics
}
```

### Phase 2: Create Deterministic Mock Data

**File:** `lib/[domain]/mock-data.ts`

```typescript
import type { [Domain]Workspace } from "./types"

const FIXED_TIMESTAMP = 1751990400000

export const [UPPER_DOMAIN]_ASSETS: [Domain]Workspace = {
  items: [
    {
      id: "[domain]-001",
      name: "[Domain] Item 1",
      status: "active",
      count: 42,
    },
  ],
  metrics: {
    total: 1,
    active: 1,
    health: 92,
  },
}
```

**Rules:**
- Use FIXED_TIMESTAMP (never Date.now())
- No Math.random() or dynamic values
- All metrics must be valid ranges (0-100 for health, etc.)
- Use `clamp()` for boundary enforcement

```typescript
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
```

### Phase 3: Create Deterministic Reader

**File:** `lib/gamma/[domain]-reader.ts`

```typescript
import { [UPPER_DOMAIN]_ASSETS } from "../[domain]/mock-data"
import type { [Domain]Workspace } from "../[domain]/types"

export async function get[Domain]Registry(): Promise<[Domain]Workspace> {
  return [UPPER_DOMAIN]_ASSETS
}
```

**Rules:**
- Always return the mock data as-is (no transformation)
- Function must be `async` (allows future database calls)
- Return type must match domain types exactly
- Name must follow pattern: `get[Domain]Registry()`

### Phase 4: Create Main Dashboard Route

**File:** `app/[domain]/page.tsx`

```typescript
import { get[Domain]Registry } from "../../lib/gamma/[domain]-reader"

export const dynamic = "force-dynamic"

export default async function [Domain]Page() {
  const registry = await get[Domain]Registry()
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        [Domain] Engine
      </h1>
      <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
        Build 121 — Commercial Intelligence Platform
      </p>
      <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "0.5rem", padding: "1rem" }}>
        <p><strong>Total:</strong> {registry.metrics.total}</p>
        <p><strong>Active:</strong> {registry.metrics.active}</p>
        <p><strong>Health Score:</strong> {registry.metrics.health}</p>
      </div>
      <p style={{ marginTop: "1rem", color: "#10b981", fontWeight: 600 }}>
        Deterministic registry loaded.
      </p>
    </main>
  )
}
```

**Rules:**
- Always include `export const dynamic = "force-dynamic"` (SSR-only)
- Import from correct relative path: `../../lib/gamma/`
- Call reader function with `await`
- Style with inline CSS (no CSS modules or Tailwind)
- Must call reader, not mock data directly

### Phase 5: Create Detail Route

**File:** `app/[domain]/[id]/page.tsx`

Using PowerShell to handle bracket directories:

```powershell
$content = @"
import { get[Domain]Registry } from "../../../lib/gamma/[domain]-reader"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function [Domain]DetailPage({ params }: PageProps) {
  const { id } = await params
  const registry = await get[Domain]Registry()
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
        [Domain] Engine: {id}
      </h1>
      <p style={{ color: "#6b7280" }}>Total items: {registry.items.length}</p>
      <a href="/[domain]" style={{ color: "#3b82f6" }}>← Back to [Domain] Engine</a>
    </main>
  )
}
"@

New-Item -ItemType Directory -Path "app/[domain]/[id]" -Force | Out-Null
Set-Content -LiteralPath "app/[domain]/[id]/page.tsx" -Value $content -Encoding UTF8
```

**Rules:**
- Import from `../../../lib/gamma/` (3 levels up)
- Accept params as Promise
- Must `await` params destructuring
- No client-side navigation (anchor tags only)

### Phase 6: Verify TypeScript

```powershell
npm run build 2>&1 | Select-String "TypeScript|error|Error"
```

**Must show:** "Finished TypeScript" with no errors.

### Phase 7: Verify Routes

```powershell
npm run dev -- -p 3000

# In another terminal
Invoke-WebRequest -Uri "http://localhost:3000/[domain]" -UseBasicParsing | Select-Object -ExpandProperty StatusCode
```

**Expected:** HTTP 200

### Phase 8: Run Smoke Tests

```powershell
$env:BASE_URL="http://localhost:3001"
npm run smoke:v1
```

**Expected:** All 22 core tests pass (Build 121 routes not yet in smoke test).

---

## Git Workflow for New Build

### Commit Atomically

Each build = 1 commit with exactly 5 files:

```powershell
git add lib/[domain]/ lib/gamma/[domain]-reader.ts app/[domain]/
git commit -m "Complete Gamma Build 121: [Domain Engine]"
```

**Output should show exactly 5 files changed.**

### Tag Freeze Point

After all 10 builds in a phase:

```powershell
git tag gamma-build-130-frozen
git push origin gamma-build-130-frozen
```

### Push to Remote

```powershell
git push origin gamma
```

---

## Common Issues & Solutions

### Issue: "Another next build process is already running"

**Solution:** Kill all Node processes and retry.

```powershell
Get-Process node | Stop-Process -Force
npm run build
```

### Issue: "Module not found: [domain]-reader"

**Solution:** Check reader filename matches import exactly.

```typescript
// app page should import:
import { get[Domain]Registry } from "../../lib/gamma/[domain]-reader"

// NOT:
import { get[Domain]Registry } from "../../lib/gamma/[Domain]Reader"
```

### Issue: "Type error: Property X does not exist"

**Solution:** Verify types.ts exports all properties used in mock-data.ts and routes.

```typescript
// If page uses: registry.items.length
// Then types.ts must have: items: Array<...>
```

### Issue: Hydration warning or mismatch

**Solution:** Ensure `export const dynamic = "force-dynamic"` on every page and strict SSR-only rendering.

```typescript
// Allowed:
export default async function Page() { ... }

// NOT allowed:
export default function Page() { ... }  // Must be async
```

### Issue: Build takes >5 minutes

**Solution:** Clear Next.js cache and rebuild.

```powershell
Remove-Item -Recurse -Force .next
npm run build
```

---

## Testing Before Merge

Checklist for Build 121:

- [ ] `npm run build` succeeds (TypeScript passes)
- [ ] All 5 files are present and named correctly
- [ ] Reader imports are correct (relative paths)
- [ ] No circular dependencies
- [ ] Page routes are accessible (HTTP 200)
- [ ] Determinism verified (same output on rebuild)
- [ ] No hydration warnings in console
- [ ] Smoke tests still pass (22/22)
- [ ] Git commit message follows pattern
- [ ] Commit contains exactly 5 files

---

## Adding a New Phase (e.g., Phase XIV)

1. **Create 10 new domain folders:** `lib/phase-xiv-[domain]/`
2. **Create 10 new readers:** `lib/gamma/phase-xiv-reader.ts`
3. **Create 10 main pages:** `app/phase-xiv/page.tsx`
4. **Create 10 detail pages:** `app/phase-xiv/[id]/page.tsx`
5. **Run full build:** `npm run build`
6. **Verify smoke tests:** `npm run smoke:v1`
7. **Create 10 commits:** One per build
8. **Tag freeze:** `gamma-build-NN0-frozen`
9. **Push to remote:** `git push origin gamma`

---

## Helpful Commands

```powershell
# Start dev (port 3000)
npm run dev

# Start dev (custom port)
npm run dev -- -p 3001

# Full build
npm run build

# Smoke tests
npm run smoke:v1

# Check git status
git status

# View last 10 commits
git log --oneline -10

# View files in commit
git show --name-only [commit-hash]

# View current tag
git describe --tags

# Push to remote
git push origin gamma

# Create tag
git tag gamma-build-NN0-frozen
```

---

## Documentation

After creating Build 121:
- Update `docs/gamma/GAMMA_ENGINE_REGISTRY.md` to add row for Build 121
- Update build count in `docs/gamma/GAMMA_V1_ARCHITECTURE.md`
- No other documentation changes needed (pattern is stable)

---

## Questions?

Refer to:
- `docs/gamma/GAMMA_V1_ARCHITECTURE.md` — System overview
- `docs/gamma/GAMMA_DEPENDENCY_GRAPH.md` — How pieces connect
- `docs/gamma/GAMMA_OPERATIONS_MANUAL.md` — Operations runbook
- Existing builds 1–120 as examples (look at similar domains)

**Good luck!** 🚀
