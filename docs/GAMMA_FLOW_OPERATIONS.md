# Gamma Flow Operations Guide

## Deployment

### Prerequisites

- Node.js 20+ (recommend 20.10+)
- npm 10+
- TypeScript 5.9+
- PostgreSQL 14+ (for v2.0+; in-memory for v1.0)

### Local Development

```bash
# Clone and setup
git clone https://github.com/yourepo/echoes-visions-nextjs-cta
cd echoes-visions-nextjs-cta
npm install

# Set environment variables
export NEXT_PUBLIC_APP_URL=http://localhost:3000
export NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Run dev server
npm run dev
# Open http://localhost:3000/gamma-flow

# Run tests
npm test

# TypeScript check
npx tsc --noEmit

# Build
npm run build
```

### Production Deployment (Vercel)

```bash
# Push to GitHub
git push origin gamma

# Vercel auto-deploys on push to gamma branch
# Monitor at: https://vercel.com/dashboard

# Production URL: https://sovereign-ai-executive.vercel.app
# Gamma Flow UI: /gamma-flow
# API endpoints: /api/flow/*
```

#### Vercel Configuration

**.vercelignore**:
```
node_modules
.git
tests
docs
*.md
```

**Environment Variables** (set in Vercel dashboard):

```
NEXT_PUBLIC_APP_URL=https://sovereign-ai-executive.vercel.app
NEXT_PUBLIC_BASE_URL=https://sovereign-ai-executive.vercel.app
NODE_ENV=production
```

## Monitoring

### Health Checks

```bash
# API healthcheck endpoint (add to Next.js health route if needed)
GET /api/health
Response: { "status": "ok", "version": "1.0.0" }

# Gamma Flow dashboard
GET /gamma-flow
Response: SSR-rendered dashboard
```

### Logs

**Local Development**:
```bash
# Check npm output for errors
npm run dev

# Check browser console for client-side errors
```

**Production** (Vercel):
- View in Vercel Dashboard → Deployments → Logs
- Filter by status, time, endpoint

### Metrics to Watch

1. **API Response Times**
   - POST /api/flow/validate: <500ms
   - POST /api/flow/preview: <2s
   - GET /api/flow/templates: <100ms

2. **Test Passes**
   - Target: 700+ tests passing
   - Run: `npm test`
   - Failure rate should be 0%

3. **Build Time**
   - Target: <2 minutes
   - TypeScript compilation: <30s
   - Next.js build: <90s

## Operations Tasks

### Daily

- [ ] Check deployment status in Vercel
- [ ] Run smoke tests: `npm run smoke:v1`
- [ ] Review any error logs
- [ ] Verify API endpoints responding

### Weekly

- [ ] Run full test suite: `npm test`
- [ ] TypeScript check: `npx tsc --noEmit`
- [ ] Review workflow templates
- [ ] Check approval timeout configuration

### Monthly

- [ ] Review audit logs
- [ ] Update documentation
- [ ] Test disaster recovery procedures
- [ ] Performance analysis

## Troubleshooting

### Issue: Tests Failing

```bash
# Full test output
npm test

# Single test file
npm test tests/gamma-flow/validators.test.ts

# Specific test
npm test -- -t "should validate correct workflow"

# Debug mode
node --inspect-brk ./node_modules/vitest/vitest.mjs run
```

### Issue: TypeScript Errors

```bash
# Check all errors
npx tsc --noEmit

# Show file with errors
npx tsc --noEmit src/lib/gamma-flow/types.ts
```

### Issue: API 500 Error

```bash
# Check logs
npm run dev

# Add console.log to route handler
app/api/flow/validate/route.ts

# Restart dev server
```

### Issue: Slow Validation

```bash
# Profile validation time
npm test -- --reporter=verbose

# Check if cycles detection is bottleneck
# Optimization: Cache cycle detection results
```

## Configuration

### Approval Timeouts

Edit workflow definition:

```typescript
step_approval.approvalTimeout = 3600000  // 1 hour

// Or customize:
approvalTimeout: process.env.APPROVAL_TIMEOUT || 3600000
```

### Base Time for Determinism

Located in: `src/lib/gamma-flow/mock-data.ts`

```typescript
export const BASE_TIME = new Date('2026-07-10T12:00:00Z');

// Don't change unless intentional!
// Affects all determinism tests
```

### Mock Connector Outputs

Edit: `lib/flow/workflow-preview-engine.ts`

```typescript
// Gmail mock output
case 'gmail':
  return {
    messageId: 'msg_12345',
    from: 'sender@example.com',
    subject: 'Test email',
    body: 'Mock body'
  };

// Customize mock responses here
```

## Backup & Recovery

### Git Backup

```bash
# Commit daily
git add -A
git commit -m "Daily backup: $(date)"
git push origin gamma
```

### Database (v2.0+)

```bash
# PostgreSQL backup
pg_dump -h localhost -U postgres gamma_flow > backup.sql

# Restore
psql -h localhost -U postgres < backup.sql
```

## Audit Trail Management

### Viewing Audit Logs

```bash
# All workflow audits (mock endpoint, v1.0)
GET /api/flow/workflows
Response: [{ id, executionId, auditEvents[] }]

# Specific workflow audit
GET /api/flow/workflows/{executionId}/audit
Response: { id, events[], report { duration, steps, approvals } }
```

### Retention Policy

- **v1.0**: In-memory only (lost on restart)
- **v2.0**: 90-day retention by default
- **Archive**: Export before 90 days if needed

### Compliance Export

```bash
# Export all audits as JSON
GET /api/flow/workflows?export=true

# Export as CSV for analysis
# (add endpoint for compliance team)
```

## Performance Tuning

### Compiler Optimization

```typescript
// In workflow-compiler.ts
// Cache topological sort if needed:
const TOPO_CACHE = new Map<string, any>();

// For large workflows (>100 steps):
export const compileWorkflow = (definition) => {
  const cacheKey = hash(definition);
  if (TOPO_CACHE.has(cacheKey)) {
    return TOPO_CACHE.get(cacheKey);
  }
  // ... compile ...
  TOPO_CACHE.set(cacheKey, result);
  return result;
};
```

### Validator Optimization

```typescript
// Parallelize validators (v2.0+)
const [schema, cycles, bindings, safety] = await Promise.all([
  validateWorkflowSchema(def),
  detectCycles(def),
  validateConnectorBindings(def),
  validateSafety(def)
]);
```

## Disaster Recovery

### Workflow Definition Loss

```bash
# All templates are seeded and regeneratable
npm test tests/gamma-flow/templates.test.ts

# If custom workflows lost:
# 1. Check git history
git log --oneline
git show <commit>:path/to/workflow.json > recovered.json
```

### Complete Service Restart

```bash
# v1.0 (stateless, no data loss except in-memory)
npm run build
npm start

# v2.0 (with database)
npm run build
npm run db:migrate
npm start
```

## Security Checklist

- [ ] All approval gates working
- [ ] No direct connector calls in preview
- [ ] Audit trail immutable
- [ ] No hardcoded secrets
- [ ] Environment variables configured
- [ ] HTTPS enforced (Vercel automatic)
- [ ] CORS configured if needed
- [ ] Rate limiting on API (recommend adding)
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak sensitive data

## Rollback Plan

### If Issue Found in Production

```bash
# Check current deployment
git log --oneline -5

# Find last working commit
git log --grep="gamma-flow" --oneline

# Roll back
git revert <bad-commit>
git push origin gamma

# Vercel auto-redeploys

# Verify
GET https://sovereign-ai-executive.vercel.app/gamma-flow
```

## Release Process

See: `GAMMA_FLOW_1.0_RELEASE.md`

---

**For architecture details**: See `GAMMA_FLOW_ARCHITECTURE.md`  
**For safety model**: See `WORKFLOW_SAFETY_MODEL.md`  
**For release process**: See `GAMMA_FLOW_1.0_RELEASE.md`
