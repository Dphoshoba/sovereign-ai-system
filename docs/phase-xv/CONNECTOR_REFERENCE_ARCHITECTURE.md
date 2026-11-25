# Connector Reference Architecture

**Version**: 1.0  
**Base Connector**: Gmail (Builds 135-140)  
**Scope**: Calendar, Drive, GitHub, Slack, Office 365, Notion, Discord  
**Development Reduction**: 60-75% faster for future connectors  

---

## Overview

This blueprint shows which Gmail components future connectors must copy, should copy, or learn from.

**Framework**: Gamma Phase XV Connector SDK (GCSDK)

**Pattern**: Adapter → Reader → Composer → Workflow → Safety → Audit

---

## Reusable Components Matrix

| Component | Location | Reusability | Future Connectors | Copy Pattern |
|-----------|----------|-------------|-------------------|--------------|
| OAuth Adapter | `authenticator.ts` | Adapt | All | Modify endpoints/scopes |
| Reader | `mailbox-reader.ts` | Pattern | All | Copy pattern, API-specific logic |
| Sanitizer | `sanitizer.ts` | As-is | All | Use unchanged, extend patterns |
| Preview Engine | `preview-engine.ts` | As-is | All | Use unchanged |
| Approval Gate | `approval-engine.ts` | As-is | All | Use unchanged |
| Queue Engine | `queue-engine.ts` | As-is | All | Use unchanged |
| Executor | `executor.ts` | Adapt | All | Copy pattern, configure gates |
| Health Monitor | `health-checker.ts` | Adapt | All | Copy pattern, adapt metrics |
| Compliance Audit | `compliance-audit.ts` | As-is | All | Use unchanged |
| Feature Flags | `executor.ts` | As-is | All | Use unchanged |
| Retry Policy | `retry-orchestrator.ts` | As-is | All | Use unchanged |
| Dead-Letter Queue | `dead-letter-queue.ts` | As-is | All | Use unchanged |
| Idempotency | `idempotency.ts` | As-is | All | Use unchanged |
| Receipt Verifier | `receipt-verifier.ts` | Adapt | All | Adapt for connector |

---

## Critical Components (100% Copy)

### 1. Approval Gate

**File**: `lib/connectors/gmail/approval-engine.ts`  
**Lines**: ~150  
**Reason**: Human-in-loop is essential  
**Copy**: Entire file, no changes

**Enforces**:
- No approval → no send
- User tracking
- Audit logging
- Rejection handling

**Applies To**: All connectors

---

### 2. Queue Engine

**File**: `lib/connectors/gmail/queue-engine.ts`  
**Lines**: ~200  
**Reason**: Persistent job handling  
**Copy**: Entire file, no changes

**Provides**:
- FIFO ordering
- Restart resilience
- Job status tracking
- Retry management

**Applies To**: All connectors

---

### 3. Compliance Audit

**File**: `lib/connectors/gmail/compliance-audit.ts`  
**Lines**: ~180  
**Reason**: Immutable audit trail  
**Copy**: Entire file, minimal customization

**Logs**:
- All operations
- User actions
- Approvals/rejections
- Timestamps

**Applies To**: All connectors

---

### 4. Sanitizer

**File**: `lib/connectors/gmail/sanitizer.ts`  
**Lines**: ~220  
**Reason**: Secret redaction essential  
**Copy**: Entire file, extend patterns

**Redacts**:
- API keys
- Bearer tokens
- Passwords
- OAuth credentials

**Extends**: Add connector-specific patterns

**Applies To**: All connectors

---

### 5. Feature Flags

**File**: `lib/connectors/gmail/executor.ts` (flags section)  
**Lines**: ~50  
**Reason**: Safety gate pattern  
**Copy**: Entire pattern, adapt flag names

**Flags**:
- `ENABLE_REAL_EXECUTION` (production mode)
- `ENABLE_FEATURE_NAME` (per-feature)

**Applies To**: All connectors

---

## Recommended Components (Should Copy)

### 1. Reader Pattern

**File**: `lib/connectors/gmail/mailbox-reader.ts`  
**Pattern**: Retrieve → Parse → Sanitize → Store

**For Future Connectors**:

```typescript
// Calendar: Read events
// Drive: Read files/folders
// GitHub: Read issues/PRs
// Slack: Read messages/channels
// Office 365: Read emails/items
// Notion: Read pages/databases
// Discord: Read messages/channels

// Pattern identical, API calls different
export class CalendarReader {
  async readEvents(maxResults = 100) {
    // Calendar API specific
  }

  async parseEvent(event) {
    // Convert to standard format
  }

  async sanitizeContent(content) {
    // Use shared sanitizer
  }
}
```

**Implementation**: 150-200 lines per connector

---

### 2. Controlled Executor

**File**: `lib/connectors/gmail/executor.ts`  
**Pattern**: Check flags → Check approval → Execute → Log

**For Future Connectors**:

```typescript
// Adapt these checks for each connector
export class ControlledExecutor {
  async executeApprovedJob(job) {
    if (!this.isFeatureFlagEnabled()) throw Error()
    if (!job.approved) throw Error()
    if (!this.checkRateLimit()) throw Error()
    if (!this.checkQuota()) throw Error()

    return this.execute(job) // Connector-specific
  }

  private checkRateLimit() { /* same */ }
  private checkQuota() { /* adapter-specific */ }
}
```

**Implementation**: 80-120 lines per connector

---

### 3. Health Monitor Pattern

**File**: `lib/connectors/gmail/health-checker.ts`  
**Pattern**: Check 4 subsystems → Score → Recommend

**For Future Connectors**:

```typescript
// Adapt metrics for each connector
export class CalendarHealthChecker {
  checkHealth() {
    return {
      oauth: this.checkToken(),
      quota: this.checkCalendarQuota(), // Different quota structure
      rateLimit: this.checkRateLimit(), // Same pattern
      scopes: this.checkScopes(), // Different scopes
    }
  }
}
```

**Implementation**: 200-250 lines per connector

---

### 4. Retry Policy

**File**: `lib/connectors/gmail/retry-orchestrator.ts`  
**Pattern**: Exponential backoff, deterministic

**For Future Connectors**: Use unchanged

```typescript
// Same for all connectors
const backoffMs = baseDelay * Math.pow(2, attemptNumber)
```

---

### 5. Dead-Letter Queue

**File**: `lib/connectors/gmail/dead-letter-queue.ts`  
**Pattern**: Max retries → DLQ → Alert

**For Future Connectors**: Use unchanged

---

## Reference-Only Components (Learn From)

### 1. Gmail-Specific API

**File**: `lib/connectors/gmail/gmail-api.ts`  
**Unique To**: Gmail  
**Learn Pattern**: How to call external API safely

**Future Connectors**: Implement own API client

---

### 2. MIME Message Builder

**File**: `lib/connectors/gmail/mime-builder.ts`  
**Unique To**: Email/Gmail  
**Learn Pattern**: RFC5322 compliance, attachment encoding

**Future Connectors**: 
- Calendar: Learn date/time handling
- Slack: Learn message formatting
- Discord: Learn embed structures

---

### 3. Draft API

**File**: `lib/connectors/gmail/draft-api.ts`  
**Unique To**: Gmail  
**Learn Pattern**: Feature flag pattern

**Future Connectors**: Implement similar for your APIs

---

## Development Checklist for Future Connectors

### Phase 1: Setup (1 week)

- [ ] Copy entire `lib/connectors/[connector]` structure
- [ ] Copy approval, queue, audit, executor as-is
- [ ] Copy sanitizer, extend for your APIs
- [ ] Setup OAuth adapter for your API

### Phase 2: Reader (1-2 weeks)

- [ ] Implement reader for your API
- [ ] Follow mailbox-reader pattern
- [ ] Sanitize output
- [ ] Test with mock data

### Phase 3: Composer (1 week)

- [ ] Implement composer/action builder
- [ ] Add preview engine (copy as-is)
- [ ] Add validation

### Phase 4: Workflow (1 week)

- [ ] Connect reader → preview → approval → queue → executor
- [ ] Add health monitoring (adapt from Gmail)
- [ ] Add feature flags (copy as-is)

### Phase 5: Safety & Tests (1-2 weeks)

- [ ] Add determinism tests (copy pattern)
- [ ] Add security tests (secret redaction)
- [ ] Add integration tests
- [ ] Run certification suite

### Total: 5-7 weeks (vs 12-14 weeks without reuse)

---

## Component Dependency Graph

```
Authenticator
    ↓
OAuth Token
    ↓
Reader ← Sanitizer ← Patterns (Secrets, etc.)
    ↓
Preview (read-only)
    ↓
Approval Gate ←────────┐
    ↓                  │
Queue Engine ←─────────┤
    ↓                  │
Controlled Executor ───┤
    ↓                  │
Health Monitor ────────┤
    ↓                  │
Compliance Audit ──────┤
    ↓                  │
Feature Flags ─────────┘
```

---

## Metrics by Component

| Component | Lines | Reusability | Est. Dev Time | Customization |
|-----------|-------|-------------|---------------|----|
| OAuth Adapter | 200 | 40% | 2-3d | API endpoints |
| Reader | 300 | 50% | 3-5d | API methods |
| Sanitizer | 220 | 100% | 1d | Extend patterns |
| Preview | 150 | 100% | 0d | None |
| Approval | 150 | 100% | 0d | None |
| Queue | 200 | 100% | 0d | None |
| Executor | 180 | 60% | 1-2d | Gate checks |
| Health Monitor | 350 | 60% | 2-3d | Metrics |
| Compliance | 180 | 100% | 0d | None |
| Tests | 500 | 100% | 1d | Extend patterns |
| **Total** | **2,530** | **70%** | **14-21d** | **6-8 components** |

---

## Implementation Roadmap

### 1. Calendar (Weeks 1-4)
- Highest reuse (78%)
- Simple API structure
- OAuth directly compatible

### 2. Office 365 (Weeks 5-7)
- Highest reuse (80%)
- Similar to Gmail model
- Microsoft OAuth compatible

### 3. Drive (Weeks 8-11)
- Good reuse (72%)
- File-based (not message-based)
- Google OAuth same as Gmail

### 4. Slack (Weeks 12-15)
- Moderate reuse (68%)
- Channel-based messaging
- OAuth compatible

### 5. GitHub (Weeks 16-19)
- Moderate reuse (65%)
- Issue/PR focus
- OAuth + personal tokens

### 6. Notion (Weeks 20-23)
- Moderate reuse (70%)
- Database-centric
- API token auth

### 7. Discord (Weeks 24-27)
- High reuse (75%)
- Channel/message model
- Bot token auth

**Total Timeline**: ~6 months (parallel possible)

---

## Best Practices

### 1. Always Default to Simulation Mode
```typescript
ENABLE_REAL_EXECUTION=false // Always default
```

### 2. Require Explicit Approval
```typescript
if (!job.approvedBy) throw new Error()
```

### 3. Log All Operations
```typescript
await auditLog.record('action', user, details)
```

### 4. Redact Secrets
```typescript
content = sanitizer.redact(content)
```

### 5. Test with Deterministic Time
```typescript
// Never use Date.now() in readers
reader.getHealth(currentTime) // Explicit time
```

### 6. Monitor Health Continuously
```typescript
const health = healthChecker.check()
if (health.score < 70) sendWarning()
```

### 7. Use Feature Flags for New Features
```typescript
if (featureFlags.isEnabled('new_feature')) {
  // New code
}
```

---

## Success Criteria for Future Connector

| Criterion | Target | Validation |
|-----------|--------|-----------|
| Code reuse | ≥60% | LOC count |
| Test coverage | ≥85% | Coverage report |
| Determinism | 100% | test:determinism pass |
| Security | 0 secrets exposed | Security audit |
| Approval required | 100% | Can't bypass |
| Feature flags | Working | Toggle control |
| Monitoring | All metrics | Health dashboard |
| Certification | Passing | Cert suite |
| Dev time | ≤7 weeks | Timeline |

---

## Support & FAQ

**Q: Do I have to copy all components?**  
A: Critical components (approval, queue, audit) must be copied unchanged. Others can be adapted.

**Q: Can I modify the reader pattern?**  
A: Yes, implement API-specific methods, but follow the sanitize → parse → store pattern.

**Q: What if my API has different scopes?**  
A: Adapt the OAuth adapter scopes, rest of health monitoring pattern works unchanged.

**Q: How do I implement feature flags?**  
A: Copy the pattern from executor.ts, add your connector name to flag keys.

**Q: Can I auto-approve certain actions?**  
A: No. Approval gate is mandatory and non-negotiable for safety.

**Q: What about error handling?**  
A: Use retry policy unchanged, classify errors following Gmail's failure classifier.

---

**Status**: REFERENCE_ARCHITECTURE_COMPLETE ✅

**Next**: Begin Calendar Connector using this blueprint.
