# Gamma v1.0 Migration Guide

**Upgrade from Build 120 to v1.0.0**

---

## Quick Summary

- ✅ **Zero breaking changes**
- ✅ **No data migration required**
- ✅ **No configuration changes needed**
- ✅ **All existing APIs work identically**

**Deployment time:** 10–15 minutes

---

## Prerequisites

- Node.js 20.x or later
- PostgreSQL 14+ (existing database)
- npm 10+

---

## Upgrade Paths

### Path 1: Fresh Environment (Staging/New Deployments)

```bash
# Clone the v1.0 tag
git clone --branch gamma-v1.0.0 \
  https://github.com/Dphoshoba/sovereign-ai-system.git gamma-v1.0

cd gamma-v1.0

# Install dependencies
npm ci

# Build
npm run build

# Test
npm run test
npm run smoke:v1

# Deploy
npm run deploy
```

**Duration:** ~10 minutes  
**Risk:** Minimal

---

### Path 2: In-Place Production Update

```bash
# Fetch latest code
git fetch origin

# Switch to v1.0 tag
git checkout gamma-v1.0.0

# Install any new dependencies
npm ci

# Build
npm run build

# Run full test suite
npm run test
npm run test:determinism
npm run smoke:v1

# If all tests pass:
npm run deploy
```

**Duration:** ~15 minutes  
**Risk:** Low (no breaking changes)

---

### Path 3: Canary Deployment (High-Risk Environments)

```bash
# Deploy to staging first
git checkout gamma-v1.0.0
npm run build
npm run deploy --environment staging

# Extended testing (24–48 hours)
# - Run smoke tests periodically
# - Monitor error logs
# - Check performance metrics

# Canary: Route 5% traffic to v1.0
npm run deploy --canary 5%

# Monitor for 4–6 hours
# - Check error rates
# - Verify response times
# - Review logs

# Increase to 50%
npm run deploy --canary 50%

# Monitor for 4–6 hours

# Full rollout
npm run deploy
```

**Duration:** 24–48 hours  
**Risk:** Minimal

---

## Testing After Upgrade

Verify these tests pass:

```bash
# Unit tests (expect 41/41)
npm run test

# Smoke tests (expect 22/22)
npm run smoke:v1

# Determinism (expect PASS)
npm run test:determinism

# Build (expect ~63 seconds)
npm run build
```

All should pass without any changes.

---

## Configuration

### Environment Variables

**No new environment variables required.** Your existing `.env` continues to work:

```env
# Keep all existing variables
NEXT_PUBLIC_APP_URL=...
NEXT_PUBLIC_BASE_URL=...
DATABASE_URL=...
PRISMA_DATABASE_URL=...
# (etc.)
```

### Database Schema

**No schema migrations.** Gamma v1.0 uses the exact same schema as Build 120.

---

## API Endpoints

### Existing Endpoints (Unchanged)

All REST endpoints from Build 120 continue to work:

```
/api/admin/*
/api/executive/*
/api/workspace/*
/api/creator/*
/api/agency/*
/api/analytics/*
# (etc.)
```

### New Endpoints (Optional)

Phase XIV adds 5 new read-only preview endpoints:

```
GET  /api/gamma/runtime/preview
GET  /api/gamma/runtime/status
POST /api/gamma/runtime/simulate
GET  /api/gamma/runtime/audit
GET  /api/gamma/runtime/queue
```

These are **optional to use** — existing apps don't need to call them.

---

## New Features to Explore (Optional)

After upgrading, you can optionally explore:

1. **Gamma Runtime Console** (`/gamma-runtime-console`)
   - Unified orchestration dashboard
   - Runtime metrics and component status
   - Drill-down capability

2. **Runtime API Endpoints**
   - Safe preview routes
   - No authentication required
   - Deterministic mock data

3. **Enhanced Audit Trail**
   - More detailed operation logging
   - Operator tracking
   - Risk level classification

These features are **available but not required**. Existing workflows continue unchanged.

---

## Rollback (If Needed)

If you need to rollback to Build 120:

```bash
git checkout build-120-frozen
npm run build
npm run deploy
```

**Rollback time:** <5 minutes  
**Data integrity:** 100% (no data changes in v1.0)

---

## Performance Impact

No performance regression:

| Metric | v1.0 | Before | Change |
|--------|------|--------|--------|
| Build Time | 63s | 63s | — |
| Page Load | 200–300ms | 200–300ms | — |
| API Response | 50–200ms | 50–200ms | — |
| Memory | ~800MB | ~800MB | — |

---

## Deployment Checklist

Before deploying to production:

- [ ] Reviewed [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md)
- [ ] Run `npm run test` (expect 41/41 PASS)
- [ ] Run `npm run smoke:v1` (expect 22/22 PASS)
- [ ] Tested in staging for 24+ hours
- [ ] Backed up production database
- [ ] Scheduled deployment during low-traffic window
- [ ] Have rollback plan ready

---

## Support

### Common Questions

**Q: Do I need to migrate data?**  
A: No. v1.0 uses the same schema as Build 120.

**Q: Will my API calls break?**  
A: No. All existing endpoints work identically.

**Q: Do I need to update client code?**  
A: No. v1.0 is 100% backward compatible.

**Q: Can I use both versions simultaneously?**  
A: Not recommended. Use blue-green or canary deployment instead.

**Q: What if my build fails?**  
A: Rollback using the rollback command above.

### Issues

If you encounter issues:

1. Check [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md)
2. Review deployment logs
3. Post on GitHub: https://github.com/Dphoshoba/sovereign-ai-system/issues
4. Contact support: support@sovereign-ai.com

---

## Next Steps

1. Choose your deployment path (1, 2, or 3 above)
2. Follow the upgrade steps
3. Run the test suite
4. Verify performance
5. Deploy when confident

---

## Release Information

- **Version:** 1.0.0
- **Release Date:** 2026-07-08
- **Commit:** b770c14
- **Git Tag:** gamma-v1.0.0
- **Status:** Production-ready

---

**Questions? See [GAMMA_v1.0_RELEASE_NOTES.md](./GAMMA_v1.0_RELEASE_NOTES.md) or contact support.**
