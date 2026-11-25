# Gamma v1.0 — Security & Compliance

**Version:** 1.0.0  
**Release Date:** 2026-07-08

---

## Security Overview

Gamma v1.0 is built with **security-first architecture**:

- **Preview-first operations** — No side effects until approved
- **Human approval gates** — All mutations require review
- **Immutable audit trails** — Complete operation history
- **Deterministic execution** — Reproducible, traceable decisions
- **No autonomous actions** — Zero side effects without approval

---

## Authentication & Authorization

### OAuth 2.0
- ✅ Standard OAuth 2.0 implementation
- ✅ Support for Google, GitHub, Microsoft login
- ✅ Refresh token rotation
- ✅ PKCE for mobile/SPA flows

### JWT Tokens
- ✅ Signed with RS256 (RSA)
- ✅ 24-hour expiration
- ✅ Refresh tokens (7-day expiration)
- ✅ Token revocation support

### Session Management
- ✅ Secure HTTP-only cookies
- ✅ SameSite=Strict enforcement
- ✅ CSRF token validation
- ✅ Session timeout (30 min inactivity)

### API Key Authentication
- ✅ Long-lived API keys for service-to-service
- ✅ Scoped permissions per key
- ✅ Rate limiting per API key
- ✅ Key rotation support

---

## Data Protection

### Encryption at Rest
- ✅ PostgreSQL table-level encryption
- ✅ Database backups encrypted (AES-256)
- ✅ File uploads encrypted (S3 SSE)
- ✅ No plaintext secrets in database

### Encryption in Transit
- ✅ TLS 1.3 enforced
- ✅ Certificate pinning (optional)
- ✅ HTTPS-only (no HTTP fallback)
- ✅ Secure WebSocket support (WSS)

### Secret Management
- ✅ Environment variables for secrets
- ✅ HashiCorp Vault integration (optional)
- ✅ No secrets in code (git ignored)
- ✅ Secrets never logged or exposed

### Data Classification
```
Public    — Non-sensitive (logos, public docs)
Internal  — Employee data, internal docs
Sensitive — Customer data, PII
Restricted — API keys, passwords, tokens
```

---

## Access Control

### Role-Based Access Control (RBAC)
- ✅ Admin — Full system access
- ✅ Manager — Team and user management
- ✅ User — Personal workspace only
- ✅ Viewer — Read-only access
- ✅ Service Account — API-only, scoped

### Attribute-Based Access Control (ABAC)
- ✅ Fine-grained permissions
- ✅ Department-based access
- ✅ Project-level isolation
- ✅ Custom permission attributes

### Principle of Least Privilege
- ✅ Default deny (no access unless explicitly granted)
- ✅ Time-limited elevated access
- ✅ Approval required for sensitive operations
- ✅ Regular access review (quarterly)

---

## Audit & Logging

### Audit Trail (Immutable)
- ✅ **100% operation coverage** — Every action logged
- ✅ **Operator tracking** — Who performed the action
- ✅ **Timestamp** — When (UTC)
- ✅ **Operation type** — What (action_proposed, action_approved, etc.)
- ✅ **Risk level** — Severity (low/medium/high)
- ✅ **Reviewer** — Who approved (if required)
- ✅ **Outcome** — Success/failure/blocked
- ✅ **Retention** — 90 days online, archival to S3

### Audit Log Integrity
- ✅ Immutable (append-only)
- ✅ Tamper-evident (checksums)
- ✅ Cryptographic hash verification
- ✅ Export capability (compliance)

### Log Entry Example
```json
{
  "id": "audit-20260708-001",
  "timestamp": "2026-07-08T12:34:56Z",
  "operator": "alice@company.com",
  "operation": "action_proposed",
  "resource": "create_email_draft",
  "details": {
    "to": "bob@example.com",
    "subject": "Project Update"
  },
  "risk_level": "low",
  "reviewer": null,
  "status": "pending_approval",
  "hash": "sha256:abc123..."
}
```

### Audit Query Examples
```sql
-- Who sent emails today?
SELECT DISTINCT operator FROM audit_logs 
WHERE operation = 'action_executed' 
AND resource = 'send_email'
AND timestamp > now() - interval '24 hours'

-- What approvals happened?
SELECT * FROM audit_logs 
WHERE operation IN ('action_approved', 'action_blocked')
AND timestamp > now() - interval '7 days'

-- High-risk operations
SELECT * FROM audit_logs 
WHERE risk_level = 'high'
AND timestamp > now() - interval '30 days'
```

---

## Compliance Frameworks

### SOC 2 Type II

**Controls:**
- ✅ Access control (RBAC + ABAC)
- ✅ Change management (approval gates)
- ✅ Incident response (alerting + escalation)
- ✅ System monitoring (health checks)
- ✅ Backup & recovery (hourly snapshots)

**Audit Frequency:** Annual

### GDPR (EU General Data Protection Regulation)

**Principles:**
- ✅ Data minimization (collect only needed)
- ✅ Purpose limitation (use only stated purpose)
- ✅ Transparency (clear privacy policy)
- ✅ Security (encryption + access control)

**Rights Supported:**
- ✅ Right to access (download all data)
- ✅ Right to rectification (correct data)
- ✅ Right to erasure ("right to be forgotten")
- ✅ Right to data portability (export)
- ✅ Right to restrict processing (opt-out)

**Implementation:**
```
User → "Download my data" 
    → 24-hour export ready
    → ZIP file (encrypted)
    → Audit logged

User → "Delete my account"
    → Verification email sent
    → 7-day retention period (legal hold)
    → Permanent deletion
    → Audit logged
```

### HIPAA (Health Insurance Portability & Accountability Act)

**When Applicable:** If processing health data

**Requirements:**
- ✅ Encryption (AES-256 at rest, TLS in transit)
- ✅ Access control (MFA for sensitive)
- ✅ Audit logging (6-year retention)
- ✅ Business Associate Agreement (if using service)
- ✅ Incident notification (within 60 days)

**Not HIPAA-Compliant By Default:**
- ❌ Requires Business Associate Agreement (BAA)
- ❌ Requires additional security review
- ❌ Requires audit certification

### FedRAMP (Federal Risk & Authorization Management Program)

**When Applicable:** US federal government customers

**Requirements:**
- ✅ FISMA compliance (security standards)
- ✅ NIST 800-53 controls
- ✅ Security Authorization (Authority to Operate)
- ✅ Continuous monitoring

**Not FedRAMP-Authorized By Default:**
- ❌ Requires formal authority assessment
- ❌ Requires ATO (Authority to Operate)
- ❌ Government deployment environment

---

## Threat Model

### Threats Mitigated

| Threat | Mitigation | Status |
|--------|-----------|--------|
| Unauthorized access | RBAC, MFA, OAuth | ✅ |
| Data breach | Encryption, access control | ✅ |
| SQL injection | Parameterized queries (Prisma ORM) | ✅ |
| XSS attacks | Content Security Policy, HTML escaping | ✅ |
| CSRF attacks | CSRF tokens, SameSite cookies | ✅ |
| DDoS | Rate limiting, WAF (optional) | ✅ |
| Man-in-the-middle | TLS 1.3, certificate pinning | ✅ |
| Unauthorized mutation | Approval gates, audit trail | ✅ |
| Autonomous execution | Preview-first, human approval | ✅ |
| Credential exposure | Secrets management, no logs | ✅ |

### Threats Out of Scope (Phase XV+)

| Threat | Phase | Notes |
|--------|-------|-------|
| Multi-tenancy isolation | Phase XVIII | Currently single-tenant |
| Advanced persistent threats | Phase XV+ | SIEM integration needed |
| Insider threat detection | Phase XVII+ | Requires behavioral analytics |
| Quantum-resistant crypto | Phase XX+ | Future-proofing |

---

## Vulnerability Management

### Scanning
- ✅ **SAST** (Static Analysis) — Weekly code scans
- ✅ **DAST** (Dynamic Analysis) — Monthly penetration tests
- ✅ **Dependency scanning** — Daily (npm audit)
- ✅ **Container scanning** — Per build (if Docker)

### Disclosure
- **Security Email:** security@sovereign-ai.com
- **Response Time:** <24 hours for critical
- **Disclosure Timeline:** 90 days to patch
- **Bug Bounty:** Available (see SECURITY.md)

### Patching
- ✅ **Critical:** Within 24 hours
- ✅ **High:** Within 1 week
- ✅ **Medium:** Within 1 month
- ✅ **Low:** Within 3 months

---

## Third-Party Security

### Dependencies
- ✅ npm audit (automated weekly)
- ✅ Snyk integration (continuous scanning)
- ✅ License compliance (FOSSA checks)
- ✅ Dependency pinning (reproducible builds)

### Cloud Providers
- ✅ Vercel (recommended): SOC 2 Type II certified
- ✅ AWS: FedRAMP authorized
- ✅ Google Cloud: FedRAMP authorized
- ✅ Azure: FedRAMP authorized

### Infrastructure Security
- ✅ DDoS protection (Cloudflare)
- ✅ WAF (Web Application Firewall)
- ✅ VPC isolation (private networks)
- ✅ SSL/TLS certificates (auto-renewal)

---

## Incident Response

### Incident Classification
| Severity | Response Time | Examples |
|----------|--------------|----------|
| Critical | <30 min | Data breach, RCE |
| High | <2 hours | Authentication bypass |
| Medium | <8 hours | Unauthorized access, data leak |
| Low | <24 hours | Vulnerability disclosure |

### Response Process
```
Detection
    ↓
Triage (assess severity)
    ↓
Containment (stop the threat)
    ↓
Investigation (root cause analysis)
    ↓
Remediation (fix the issue)
    ↓
Notification (inform stakeholders)
    ↓
Post-Mortem (prevent recurrence)
```

### Escalation Path
```
L1: Support team (first response)
    ↓
L2: Security team (investigation)
    ↓
L3: Engineering (remediation)
    ↓
L4: Leadership (notification)
    ↓
L5: Legal (disclosure if needed)
```

---

## Security Best Practices

### For Admins
- ✅ Use strong, unique passwords (20+ characters)
- ✅ Enable MFA on all accounts
- ✅ Review audit logs weekly
- ✅ Rotate API keys quarterly
- ✅ Regular access reviews (quarterly)

### For Developers
- ✅ Never commit secrets to git
- ✅ Use environment variables for config
- ✅ Validate all inputs
- ✅ Sanitize all outputs
- ✅ Follow OWASP Top 10

### For Operations
- ✅ Patch systems regularly
- ✅ Monitor for anomalies
- ✅ Backup data daily
- ✅ Test disaster recovery annually
- ✅ Document security procedures

### For Users
- ✅ Use strong passwords
- ✅ Enable MFA
- ✅ Don't share credentials
- ✅ Report suspicious activity
- ✅ Verify sender before clicking links

---

## Encryption Standards

### Algorithms Used
- **Symmetric:** AES-256 (encryption at rest)
- **Asymmetric:** RSA-2048 (JWT signing)
- **Hashing:** SHA-256 (data integrity)
- **KDF:** PBKDF2 (password hashing)

### Key Management
- ✅ Keys stored in HSM (Hardware Security Module)
- ✅ Key rotation (annual)
- ✅ Key recovery process (escrow)
- ✅ Key usage audit logging

---

## Compliance Checklist

Before deploying to production:

- [ ] Review SECURITY.md (this file)
- [ ] Confirm RBAC setup for your team
- [ ] Enable MFA on all admin accounts
- [ ] Review [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md) for constraints
- [ ] Audit initial user permissions
- [ ] Set up log monitoring/alerting
- [ ] Establish incident response plan
- [ ] Document your security procedures
- [ ] Schedule quarterly access reviews

---

## Support & Reporting

### Security Questions
- **Email:** security@sovereign-ai.com
- **Response:** <24 hours

### Reporting Vulnerabilities
- **Do not** open public GitHub issues
- **Do email** security@sovereign-ai.com
- **Include:** Description, reproduction steps, impact
- **Responsible disclosure:** 90-day timeline

### Compliance Requests
- **SOC 2 Attestation:** Available upon request
- **HIPAA BAA:** Available upon request
- **Data Processing Agreement:** Available upon request
- **Security Questionnaire:** Available upon request

---

## FAQ

**Q: Is v1.0 production-ready from a security perspective?**  
A: Yes. It includes comprehensive audit, approval gates, and encryption. Enterprise-ready.

**Q: Can I use v1.0 for HIPAA data?**  
A: Not without Business Associate Agreement (BAA). Contact security@sovereign-ai.com

**Q: How long are audit logs retained?**  
A: 90 days online, archived to S3 for 7 years.

**Q: Can I deploy to Europe (GDPR)?**  
A: Yes, but data residency not enforced until Phase XV. Contact us for regional deployment.

**Q: What happens if there's a security incident?**  
A: We follow incident response plan. Customers notified within 24 hours if impacted.

---

## Security Roadmap

### Phase XV
- Add connector-specific OAuth scopes
- Extended audit logging for connectors
- API rate limiting per connector

### Phase XVI
- Agent activity audit logging
- Multi-agent approval gates

### Phase XVII
- Knowledge base access control
- Data classification enforcement

### Phase XVIII
- Multi-tenant isolation verification
- Cross-tenant audit logging
- Organization-level data residency

---

**Security is foundational to Gamma.** Trust is earned through transparency and rigor.

Questions? Email security@sovereign-ai.com

---

*Security Policy for Gamma v1.0.0*  
*Last Updated: 2026-07-08*
