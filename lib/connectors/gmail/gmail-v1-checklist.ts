/**
 * Gmail v1.0 Certification Checklist
 *
 * 40+ comprehensive checks that verify Gmail connector is production-ready
 * and reusable as reference architecture.
 */

export interface ChecklistItem {
  id: string;
  name: string;
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  verification: string;
}

export const GMAIL_V1_CHECKLIST: ChecklistItem[] = [
  // OAuth & Authentication (5 items)
  {
    id: 'oauth-001',
    name: 'OAuth 2.0 flow implemented',
    category: 'OAuth',
    priority: 'critical',
    description: 'Google OAuth 2.0 flow initialized, authorization code exchange works',
    verification: 'Test callback receives code and exchanges for tokens',
  },
  {
    id: 'oauth-002',
    name: 'Token storage is secure',
    category: 'OAuth',
    priority: 'critical',
    description: 'Access and refresh tokens stored securely without exposure',
    verification: 'Tokens never logged unmasked, encrypted in storage',
  },
  {
    id: 'oauth-003',
    name: 'Token refresh works automatically',
    category: 'OAuth',
    priority: 'high',
    description: 'Expired tokens refreshed automatically without user action',
    verification: 'Simulate token expiry, verify auto-refresh succeeds',
  },
  {
    id: 'oauth-004',
    name: 'Token revocation is handled',
    category: 'OAuth',
    priority: 'high',
    description: 'Revoked tokens detected and require re-auth',
    verification: 'Simulate revocation, verify re-auth forced',
  },
  {
    id: 'oauth-005',
    name: 'Scope validation works',
    category: 'OAuth',
    priority: 'high',
    description: 'Required scopes verified, missing scopes detected',
    verification: 'Check required scopes: readonly, modify, compose',
  },

  // Reader (4 items)
  {
    id: 'reader-001',
    name: 'Mailbox reader retrieves messages',
    category: 'Reader',
    priority: 'critical',
    description: 'Successfully retrieves messages from Gmail API',
    verification: 'Read message list, retrieve full messages',
  },
  {
    id: 'reader-002',
    name: 'Message MIME parsing works',
    category: 'Reader',
    priority: 'critical',
    description: 'Messages parsed into structured format with headers, body, attachments',
    verification: 'Parse complex MIME messages, extract all components',
  },
  {
    id: 'reader-003',
    name: 'Sanitizer redacts secrets',
    category: 'Reader',
    priority: 'critical',
    description: 'All API keys, tokens, passwords redacted before logging/display',
    verification: 'Content contains sk_live_*, token=*, password=*, all redacted',
  },
  {
    id: 'reader-004',
    name: 'Message validation works',
    category: 'Reader',
    priority: 'high',
    description: 'Invalid or malformed messages caught',
    verification: 'Feed invalid MIME, verify caught and logged',
  },

  // Draft Composer (5 items)
  {
    id: 'composer-001',
    name: 'Draft composer creates drafts',
    category: 'Composer',
    priority: 'critical',
    description: 'Creates valid Gmail draft messages',
    verification: 'Create draft, verify in Gmail',
  },
  {
    id: 'composer-002',
    name: 'MIME builder generates RFC5322',
    category: 'Composer',
    priority: 'critical',
    description: 'MIME builder generates RFC5322-compliant messages',
    verification: 'Build message with headers, body, verify RFC5322 compliance',
  },
  {
    id: 'composer-003',
    name: 'Message validator catches errors',
    category: 'Composer',
    priority: 'high',
    description: 'Validator catches malformed messages, invalid headers',
    verification: 'Feed invalid message, verify rejected',
  },
  {
    id: 'composer-004',
    name: 'Attachments handled correctly',
    category: 'Composer',
    priority: 'high',
    description: 'Attachments encoded and attached correctly',
    verification: 'Add attachments, verify encoding correct',
  },
  {
    id: 'composer-005',
    name: 'Headers sanitized',
    category: 'Composer',
    priority: 'medium',
    description: 'Dangerous headers removed or sanitized',
    verification: 'Verify header injection not possible',
  },

  // Workflow (5 items)
  {
    id: 'workflow-001',
    name: 'Preview engine works',
    category: 'Workflow',
    priority: 'critical',
    description: 'Message preview displayed without sending',
    verification: 'Create preview, verify no message sent',
  },
  {
    id: 'workflow-002',
    name: 'Approval gate requires sign-off',
    category: 'Workflow',
    priority: 'critical',
    description: 'Human must explicitly approve before proceeding',
    verification: 'Test approval required, rejection blocks',
  },
  {
    id: 'workflow-003',
    name: 'Queue engine persists jobs',
    category: 'Workflow',
    priority: 'high',
    description: 'Jobs persisted in queue, survives restart',
    verification: 'Queue job, restart app, verify job still there',
  },
  {
    id: 'workflow-004',
    name: 'Queue ordering preserved',
    category: 'Workflow',
    priority: 'medium',
    description: 'FIFO ordering maintained',
    verification: 'Queue multiple jobs, verify executed in order',
  },
  {
    id: 'workflow-005',
    name: 'Retry policy is deterministic',
    category: 'Workflow',
    priority: 'high',
    description: 'Exponential backoff, no randomization',
    verification: 'Verify backoff times deterministic',
  },

  // Execution Safety (6 items)
  {
    id: 'safety-exe-001',
    name: 'Simulation mode is default',
    category: 'Execution Safety',
    priority: 'critical',
    description: 'ENABLE_REAL_EXECUTION=false is default',
    verification: 'Check env, verify false by default',
  },
  {
    id: 'safety-exe-002',
    name: 'Live mode requires explicit flag',
    category: 'Execution Safety',
    priority: 'critical',
    description: 'Cannot send without ENABLE_REAL_EXECUTION=true',
    verification: 'Attempt send without flag, verify blocked',
  },
  {
    id: 'safety-exe-003',
    name: 'Live mode requires approval',
    category: 'Execution Safety',
    priority: 'critical',
    description: 'Even with flag, requires approval before send',
    verification: 'Test approval gate enforced in live mode',
  },
  {
    id: 'safety-exe-004',
    name: 'Draft API is behind feature flag',
    category: 'Execution Safety',
    priority: 'high',
    description: 'Gmail Draft API access controlled',
    verification: 'Verify flag gates API access',
  },
  {
    id: 'safety-exe-005',
    name: 'No messages.send bypass',
    category: 'Execution Safety',
    priority: 'critical',
    description: 'messages.send() not exposed to workflow',
    verification: 'Verify messages.send() not called directly',
  },
  {
    id: 'safety-exe-006',
    name: 'Controlled execution engine works',
    category: 'Execution Safety',
    priority: 'high',
    description: 'Execution engine enforces all safety gates',
    verification: 'Test all gates in controlled executor',
  },

  // Security (6 items)
  {
    id: 'security-001',
    name: 'No token exposure in logs',
    category: 'Security',
    priority: 'critical',
    description: 'Tokens masked as oauth2_****xxxx',
    verification: 'Check logs, verify tokens never exposed',
  },
  {
    id: 'security-002',
    name: 'No secret exposure in logs',
    category: 'Security',
    priority: 'critical',
    description: 'All secrets redacted before logging',
    verification: 'Feed content with secrets, verify redacted in logs',
  },
  {
    id: 'security-003',
    name: 'No Date.now in deterministic readers',
    category: 'Security',
    priority: 'high',
    description: 'GAMMA readers use currentTime parameter',
    verification: 'Static analysis, verify no Date.now() calls',
  },
  {
    id: 'security-004',
    name: 'No Math.random in readers',
    category: 'Security',
    priority: 'high',
    description: 'No randomization in deterministic code',
    verification: 'Static analysis, verify no Math.random()',
  },
  {
    id: 'security-005',
    name: 'No localStorage/sessionStorage',
    category: 'Security',
    priority: 'medium',
    description: 'No client-side storage of secrets',
    verification: 'Static analysis, verify not used',
  },
  {
    id: 'security-006',
    name: 'CORS headers configured',
    category: 'Security',
    priority: 'medium',
    description: 'API endpoints have proper CORS headers',
    verification: 'Test CORS headers on API routes',
  },

  // Compliance (5 items)
  {
    id: 'compliance-001',
    name: 'Audit log records all operations',
    category: 'Compliance',
    priority: 'high',
    description: 'Compliance audit logs every operation',
    verification: 'Perform operations, verify logged',
  },
  {
    id: 'compliance-002',
    name: 'Resilience & retry works',
    category: 'Compliance',
    priority: 'high',
    description: 'Retries with exponential backoff',
    verification: 'Simulate failures, verify retries',
  },
  {
    id: 'compliance-003',
    name: 'Dead-letter queue works',
    category: 'Compliance',
    priority: 'medium',
    description: 'Failed jobs moved to DLQ after max retries',
    verification: 'Max out retries, verify moved to DLQ',
  },
  {
    id: 'compliance-004',
    name: 'Duplicate protection works',
    category: 'Compliance',
    priority: 'high',
    description: 'Idempotency prevents duplicate sends',
    verification: 'Test duplicate message with same ID, verify prevented',
  },
  {
    id: 'compliance-005',
    name: 'Receipt verification works',
    category: 'Compliance',
    priority: 'medium',
    description: 'Receipt verifier confirms delivery',
    verification: 'Verify receipt generated for successful sends',
  },

  // Hardening (5 items)
  {
    id: 'hardening-001',
    name: 'Token health monitoring works',
    category: 'Hardening',
    priority: 'high',
    description: 'Monitors token expiry and refresh',
    verification: 'Check token health dashboard',
  },
  {
    id: 'hardening-002',
    name: 'Quota monitoring works',
    category: 'Hardening',
    priority: 'high',
    description: 'Tracks quota usage for all limits',
    verification: 'Check quota dashboard',
  },
  {
    id: 'hardening-003',
    name: 'Rate limit monitoring works',
    category: 'Hardening',
    priority: 'high',
    description: 'Tracks rate limit tiers and backoff',
    verification: 'Check rate limit dashboard',
  },
  {
    id: 'hardening-004',
    name: 'Production readiness score exists',
    category: 'Hardening',
    priority: 'high',
    description: 'Overall health score 0-100',
    verification: 'Verify score calculation',
  },
  {
    id: 'hardening-005',
    name: 'Operator warnings generated',
    category: 'Hardening',
    priority: 'medium',
    description: 'Warnings for unhealthy states',
    verification: 'Verify warnings in dashboard',
  },

  // Testing (2 items)
  {
    id: 'testing-001',
    name: 'Test coverage >= 85%',
    category: 'Testing',
    priority: 'high',
    description: 'Unit and integration tests cover critical paths',
    verification: 'Run coverage report',
  },
  {
    id: 'testing-002',
    name: 'Determinism tests pass',
    category: 'Testing',
    priority: 'high',
    description: 'Determinism validation for GAMMA readers',
    verification: 'npm run test:determinism PASS',
  },

  // Documentation (3 items)
  {
    id: 'docs-001',
    name: 'Build 140 documentation complete',
    category: 'Documentation',
    priority: 'medium',
    description: 'Certification and architecture docs written',
    verification: 'Docs exist and are complete',
  },
  {
    id: 'docs-002',
    name: 'Reference architecture documented',
    category: 'Documentation',
    priority: 'medium',
    description: 'Blueprint for future connectors',
    verification: 'CONNECTOR_REFERENCE_ARCHITECTURE.md exists',
  },
  {
    id: 'docs-003',
    name: 'Reusable components identified',
    category: 'Documentation',
    priority: 'medium',
    description: 'Components marked for reuse',
    verification: 'Components list in docs',
  },
];

export class GmailV1Checklist {
  /**
   * Get all checklist items
   */
  getAllItems(): ChecklistItem[] {
    return GMAIL_V1_CHECKLIST;
  }

  /**
   * Get items by category
   */
  getByCategory(category: string): ChecklistItem[] {
    return GMAIL_V1_CHECKLIST.filter((item) => item.category === category);
  }

  /**
   * Get critical items
   */
  getCriticalItems(): ChecklistItem[] {
    return GMAIL_V1_CHECKLIST.filter((item) => item.priority === 'critical');
  }

  /**
   * Get checklist summary
   */
  getSummary(): {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    categories: string[];
  } {
    return {
      total: GMAIL_V1_CHECKLIST.length,
      critical: GMAIL_V1_CHECKLIST.filter((i) => i.priority === 'critical').length,
      high: GMAIL_V1_CHECKLIST.filter((i) => i.priority === 'high').length,
      medium: GMAIL_V1_CHECKLIST.filter((i) => i.priority === 'medium').length,
      low: GMAIL_V1_CHECKLIST.filter((i) => i.priority === 'low').length,
      categories: [...new Set(GMAIL_V1_CHECKLIST.map((i) => i.category))],
    };
  }
}
