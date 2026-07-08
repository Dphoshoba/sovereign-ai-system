# Gamma Operations Manual

**Baseline:** gamma-build-120-frozen  
**Effective:** 2026-07-08  
**For:** Local Development & Production Operations  

---

## Table of Contents

1. [Local Development](#local-development)
2. [Health Monitoring](#health-monitoring)
3. [Build & Recovery](#build--recovery)
4. [Troubleshooting](#troubleshooting)
5. [Deployment Preparation](#deployment-preparation)
6. [Freeze & Rollback](#freeze--rollback)
7. [Incident Response](#incident-response)

---

## Local Development

### Starting Development Server

**Default Port (3000):**
```powershell
npm run dev
```

**Expected Output:**
```
▲ Next.js 16.2.6
- Local:   http://localhost:3000
- Ready in 2.1s
```

**Custom Port (3001):**
```powershell
npm run dev -- -p 3001
```

### Accessing the Application

- **Dashboard:** http://localhost:3000
- **Executive Suite:** http://localhost:3000/api/executive/health
- **Admin Panel:** http://localhost:3000/admin/runtime
- **Any Domain:** http://localhost:3000/[domain]

### Stopping Development Server

```powershell
Ctrl+C
```

**Expected:** Server gracefully stops, terminal returns to prompt.

### Environment Variables

**Required:**
```bash
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Optional (defaults provided):**
```bash
LOG_LEVEL=info
DEBUG=false
```

**File:** `.env.local` (create if not present)

```powershell
# PowerShell: Create .env.local
@"
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
"@ | Set-Content -Path .env.local
```

---

## Health Monitoring

### Gamma Cloud Status Dashboard

**Route:** `/gamma-cloud`  
**Purpose:** Master operations dashboard, all regions and metrics

**What to check:**
- All 5 regions online (US East, US West, EU West, Asia Pacific, Australia East)
- Health score >= 90
- Status = "operational"
- No red warnings

### Executive Health Check

**Route:** `/api/executive/health`  
**Purpose:** Quick system status

**Sample Response:**
```json
{
  "status": "operational",
  "timestamp": 1751990400000,
  "version": "1.0.0"
}
```

**Healthy indicator:** `"status": "operational"`

### Enterprise Monitor Status

**Route:** `/enterprise-monitor`  
**Purpose:** Detailed system metrics

**Metrics to monitor:**
- `cpuUsage`: Should be < 80%
- `memoryUsage`: Should be < 75%
- `uptime`: Should be > 99.5%
- `healthScore`: Should be > 90

### Daily Health Check Procedure

**Time:** Every morning (or before major operations)

```powershell
# 1. Check dev server is running
$health = Invoke-WebRequest -Uri "http://localhost:3000/api/executive/health" -UseBasicParsing
$health.StatusCode  # Should be 200

# 2. Check Gamma Cloud
$cloud = Invoke-WebRequest -Uri "http://localhost:3000/gamma-cloud" -UseBasicParsing
$cloud.StatusCode   # Should be 200

# 3. Check Enterprise Monitor
$monitor = Invoke-WebRequest -Uri "http://localhost:3000/enterprise-monitor" -UseBasicParsing
$monitor.StatusCode # Should be 200

# 4. If all 200, system is healthy
Write-Host "✅ All systems operational"
```

---

## Build & Recovery

### Full Production Build

**Time:** ~4 minutes  
**Memory:** 8GB (configured in package.json)

```powershell
npm run build
```

**Expected Output:**
```
Ô£ô Compiled successfully in 3.9min
Finished TypeScript in 2.6min
Collecting page data using 7 workers...
Generating static pages (240/240)
✓ Exported successfully
```

**Success Criteria:**
- [ ] "Compiled successfully" message
- [ ] "Finished TypeScript" (no errors)
- [ ] All 240 pages generated
- [ ] No errors or warnings at end

### Build Failure Recovery

**Scenario 1: Build Timeout (> 5 minutes)**

**Cause:** Node process ran out of memory or stuck on compilation

**Recovery:**
```powershell
# 1. Kill stuck process
Get-Process node | Stop-Process -Force

# 2. Clear Next.js cache
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# 3. Retry build
npm run build
```

**Scenario 2: TypeScript Errors After Changes**

**Cause:** Type mismatch or missing import

**Recovery:**
```powershell
# 1. Check error message carefully
npm run build 2>&1 | Select-String "error"

# 2. Open error file and fix issue
# Example: "Property 'x' does not exist on type 'Y'"
# → Add property to types.ts

# 3. Rebuild
npm run build
```

**Scenario 3: "Another next build process already running"**

**Cause:** Previous build crashed, process not cleaned up

**Recovery:**
```powershell
# Kill all node processes
Get-Process node | Stop-Process -Force

# Clear cache
Remove-Item -Recurse -Force .next

# Rebuild
npm run build
```

### Incremental Build (During Development)

```powershell
npm run dev
# Changes auto-reload, no manual build needed
```

---

## Smoke Testing

### Run Full Smoke Test Suite

```powershell
# 1. Start dev server on port 3001 (in separate terminal)
npm run dev -- -p 3001

# 2. In main terminal, run smoke tests
$env:BASE_URL="http://localhost:3001"
npm run smoke:v1
```

**Expected Output:**
```
Test Suites: 1 passed, 1 total
Tests:       22 passed, 22 total
Time:        4.2s
```

**Success Criteria:**
- [ ] All 22 tests pass
- [ ] 0 failed tests
- [ ] Execution time < 10 seconds

### Smoke Test Routes Verified

```
✅ /api/health
✅ /api/executive/health
✅ /api/executive/command-center
✅ /api/executive/runtime
✅ /api/executive/boardroom
✅ /api/executive/strategic-plan
✅ /api/executive/forecast
✅ /api/executive/goals
✅ /api/executive/knowledge-graph
✅ /api/executive/simulations
✅ /api/executive/scenarios
✅ /admin/runtime
✅ /admin/command-center
✅ /admin/operations
✅ /admin/boardroom
✅ /admin/strategic-plan
✅ /admin/goals
✅ /admin/knowledge-graph
✅ /admin/simulations
✅ /admin/scenarios
✅ /admin/revenue
✅ /admin/delivery
```

### Smoke Test Failure Response

**If smoke test fails:**

```powershell
# 1. Check which test failed (read error output)
npm run smoke:v1 2>&1 | Select-String "FAIL|Error"

# 2. Verify dev server is running
Get-Process node

# 3. Manual test the failing route
Invoke-WebRequest -Uri "http://localhost:3001/[failing-route]"

# 4. If route returns 200, restart dev server
# If route returns error, check app code

# 5. Retry smoke test
npm run smoke:v1
```

---

## Troubleshooting

### Common Issues & Solutions

#### Issue: "Port 3000 already in use"

**Cause:** Dev server already running or another app using port

**Solution:**
```powershell
# Find process using port
Get-NetTCPConnection -LocalPort 3000 | Select-Object -ExpandProperty OwningProcess | Get-Process

# Kill process
Get-Process node | Stop-Process -Force

# Retry
npm run dev
```

#### Issue: "Cannot find module 'next'"

**Cause:** Dependencies not installed

**Solution:**
```powershell
npm install
npm run dev
```

#### Issue: "TypeScript error: Property 'x' does not exist"

**Cause:** Type definition missing property

**Solution:**
1. Open file mentioned in error
2. Check types.ts for the type
3. Add missing property to type
4. Rebuild: `npm run build`

**Example:**
```typescript
// Error: Property 'items' does not exist on type 'TenantWorkspace'
// Fix in lib/tenant/types.ts:
export type TenantWorkspace = {
  items: TenantItem[]  // ← Add this line
  metrics: TenantMetrics
}
```

#### Issue: "Hydration warning: Text content did not match"

**Cause:** Client render differs from server render

**Solution:**
1. Ensure page uses `export const dynamic = "force-dynamic"`
2. Remove any client-side Date.now() or Math.random()
3. All data must be deterministic
4. Rebuild: `npm run build`

#### Issue: "Build taking > 10 minutes"

**Cause:** Stuck process or memory pressure

**Solution:**
```powershell
# Kill process
Get-Process node | Stop-Process -Force

# Check disk space
Get-Volume | Where-Object {$_.DriveLetter -eq 'C'} | Select-Object SizeRemaining

# Clear cache
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules/.cache

# Rebuild
npm run build
```

#### Issue: Smoke tests timeout (hanging at route)

**Cause:** Dev server unresponsive or route has infinite loop

**Solution:**
```powershell
# Kill hanging process
Get-Process node | Stop-Process -Force

# Check for infinite loops in recent changes
# (Review git diff)

# Restart dev server
npm run dev -- -p 3001

# Retry smoke tests
npm run smoke:v1
```

---

## Deployment Preparation

### Pre-Deployment Checklist

**1 hour before deployment:**

```powershell
# 1. Pull latest from remote
git pull origin gamma

# 2. Install dependencies
npm install

# 3. Run full build
npm run build
# ✓ Should show "Compiled successfully"

# 4. Run smoke tests
npm run dev -- -p 3001  # In separate terminal
npm run smoke:v1
# ✓ Should show "22 passed, 22 total"

# 5. Verify git status
git status
# ✓ Should show "On branch gamma, nothing to commit"

# 6. Verify current tag
git describe --tags
# ✓ Should show "gamma-build-120-frozen"

# 7. Check build output
ls -la .next
# ✓ Should have recent timestamp
```

**All checks passed? → Ready to deploy**

### Deployment Steps (Vercel)

**Via Git:**
```powershell
# 1. Push to origin/gamma
git push origin gamma

# 2. Vercel auto-detects and builds
# → Check https://vercel.com dashboard

# 3. Wait for build to complete
# → Should take ~5 minutes

# 4. Verify deployment
# → Visit https://sovereign-ai-executive.vercel.app
```

**Manual Build (Advanced):**
```powershell
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod

# 4. View deployment
vercel list
```

---

## Freeze & Rollback

### Creating a Freeze Tag

**After completing 10 builds (a phase):**

```powershell
# 1. Verify build succeeds
npm run build
# ✓ Check output: "Compiled successfully"

# 2. Verify smoke tests pass
npm run smoke:v1
# ✓ Check output: "22 passed, 22 total"

# 3. Create freeze tag
git tag gamma-build-120-frozen

# 4. Push tag to remote
git push origin gamma-build-120-frozen

# 5. Verify tag pushed
git ls-remote --tags origin | grep gamma-build-120
```

**Expected Output:**
```
abc1234def5678    refs/tags/gamma-build-120-frozen
```

### Rollback to Previous Freeze Tag

**Emergency: revert to previous working build**

```powershell
# 1. List available freeze tags
git tag | Select-String "gamma-build" | Sort-Object -Descending

# 2. Checkout previous tag
git checkout gamma-build-110-frozen

# 3. Reinstall dependencies (fresh)
npm install

# 4. Build
npm run build
# ✓ Verify: "Compiled successfully"

# 5. Test
npm run smoke:v1
# ✓ Verify: "22 passed"

# 6. Redeploy
git push origin HEAD:gamma --force
```

**Caution:** Only use `--force` in emergency situations.

### Viewing Commit History by Freeze

```powershell
# List commits by freeze tag
git log --oneline --graph --decorate | Select-String "gamma-build-.*-frozen" -Before 5

# Example output:
# * abc1234 (tag: gamma-build-120-frozen) Complete Gamma Build 120: Gamma Cloud
# * def5678 Complete Gamma Build 119: Analytics Engine
# * ghi9012 Complete Gamma Build 118: Deployment Engine
# ...
```

---

## Incident Response

### Security Incident

**Scenario: Unauthorized access detected**

```powershell
# 1. Stop application
npm run dev
# Ctrl+C to stop

# 2. Review audit logs (if available)
# Check: docs/audits/ for incident trails

# 3. Check git history for suspicious changes
git log --oneline -20

# 4. If compromise confirmed:
# a. Revert to last known good freeze
git checkout gamma-build-120-frozen
npm install
npm run build

# b. Rotate credentials
# (Contact security team)

# c. Redeploy
git push origin HEAD:gamma --force

# 5. Enable monitoring
# (Set up alerts)
```

### Performance Degradation

**Scenario: System running slow, high latency**

```powershell
# 1. Check system resources
Get-Process node | Select-Object CPU, Memory

# 2. Check disk space
Get-Volume | Format-Table

# 3. Restart application
npm run dev -- -p 3000

# 4. Monitor metrics
# Check /gamma-cloud dashboard for CPU, memory trends

# 5. If persistent, scale deployment
# (Contact DevOps team)
```

### Data Inconsistency

**Scenario: Mock data doesn't match expectations**

```powershell
# 1. Verify determinism
npm run build
npm run build
# Both builds should be identical

# 2. Check mock-data.ts files
Get-ChildItem -Recurse lib/*/mock-data.ts

# 3. Verify FIXED_TIMESTAMP is used everywhere
grep -r "new Date" lib/
# Should show 0 results

# 4. Rebuild with fresh data
Remove-Item -Recurse -Force .next
npm run build

# 5. Test
npm run smoke:v1
```

### Major Outage

**Scenario: System completely down, no routes responding**

**Immediate Actions (First 5 minutes):**

```powershell
# 1. Check system is running
Get-Process node -ErrorAction SilentlyContinue
# If no node process, restart:
npm run dev

# 2. Check port is accessible
$conn = Test-NetConnection -ComputerName localhost -Port 3000
$conn.TcpTestSucceeded  # Should be $true

# 3. Check event logs
Get-EventLog -LogName Application -Newest 20 -Source "Node.js"
```

**Mitigation (Minutes 5–15):**

```powershell
# 1. Kill all processes
Get-Process node | Stop-Process -Force

# 2. Clean slate
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules/.cache

# 3. Rebuild from freeze
git checkout gamma-build-120-frozen
npm install
npm run build

# 4. Restart
npm run dev

# 5. Verify smoke tests
npm run smoke:v1
```

**Investigation (Minutes 15+):**

```powershell
# 1. Check recent changes
git log --oneline -5
git show [commit-hash]

# 2. Identify root cause
# (Review error logs, git changes)

# 3. If caused by recent build:
# a. Revert: git revert [bad-commit]
# b. Rebuild: npm run build
# c. Test: npm run smoke:v1
# d. Deploy: git push origin gamma

# 4. Document incident
# (Create issue with timeline, cause, fix)
```

---

## Maintenance Windows

### Weekly Maintenance (Monday 2 AM)

```powershell
# 1. Full dependency update (optional, advanced)
npm update

# 2. Full rebuild
npm run build

# 3. Full smoke test
npm run smoke:v1

# 4. If all pass, commit and push
git add .
git commit -m "Routine: Weekly dependency check and smoke test"
git push origin gamma

# 5. If any fail, rollback
git reset --hard HEAD~1
```

### Monthly Maintenance (First Monday of month)

```powershell
# 1. Major cleanup
Get-Process node | Stop-Process -Force
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules
npm install

# 2. Full rebuild and test
npm run build
npm run smoke:v1

# 3. Update documentation
# (Review docs/gamma/ for outdated info)

# 4. Backup freeze tag
# (Ensure all freeze tags are pushed)
git push origin --tags

# 5. Performance review
# (Check build times, smoke test times)
```

---

## Monitoring & Alerts

### Health Check Frequency (Recommended)

- **Development:** Every 1 hour (manual or script)
- **Staging:** Every 30 minutes (automated)
- **Production:** Every 5 minutes (automated)

### Alerting Rules (Recommended for Phase XIV)

```yaml
Alerts:
  - Build time > 5 minutes → Page on-call
  - Smoke test < 22 passing → Page on-call
  - Error rate > 1% → Alert (not page)
  - Latency p99 > 10s → Alert (not page)
  - Memory > 75% → Alert (not page)
  - Disk space < 5% → Alert (not page)
```

### Health Check Script (Automated)

**File:** `scripts/health-check.ps1`

```powershell
# Runs every hour (via Task Scheduler)
$health = Invoke-WebRequest -Uri "http://localhost:3000/api/executive/health" -UseBasicParsing
if ($health.StatusCode -ne 200) {
  Send-AlertEmail "Gamma health check failed: $($health.StatusCode)"
}
```

---

## Summary

| Operation | Command | Time | Frequency |
|-----------|---------|------|-----------|
| Start Dev | `npm run dev` | 2 sec | On-demand |
| Build | `npm run build` | 4 min | Before deploy |
| Smoke Test | `npm run smoke:v1` | 4 sec | Before deploy |
| Health Check | GET `/api/health` | <1 sec | Hourly (prod) |
| Freeze | `git tag ...` + push | 1 min | Phase-end |
| Rollback | `git checkout` + push | 5 min | Emergency |

---

**Questions?** See:
- `GAMMA_DEVELOPER_ONBOARDING.md` — Development workflow
- `GAMMA_API_DOCUMENTATION.md` — Route reference
- `GAMMA_DEPENDENCY_GRAPH.md` — System architecture

**Last Updated:** 2026-07-08  
**Maintainer:** Gamma Operations Team  
