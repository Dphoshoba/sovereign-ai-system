# Build 131: Gmail Connector Foundation — OAuth & Connection Management

**Phase:** XV (Live Connector Framework)  
**Connector:** Gmail  
**Status:** IN PROGRESS  
**Build:** 131/140 (Gmail week 1)  
**Date Started:** 2026-07-08  

---

## Overview

Build 131 establishes the **Gmail reference connector** — the foundation upon which all subsequent connectors (Calendar, Drive, GitHub, Slack, Notion, Office 365, Discord) will be built.

This build focuses on **authentication and connection infrastructure**, not yet on reading/drafting emails.

---

## Scope

### What's Included
- ✅ Gmail OAuth 2.0 configuration (Google Cloud project)
- ✅ Connector manifest (metadata, permissions, actions)
- ✅ Connection manager (token storage, refresh logic)
- ✅ Connection UI (OAuth flow, popup)
- ✅ Secret management (.env.local for dev)
- ✅ Base connector SDK (abstract classes)
- ✅ Unit tests (mocked Google API)
- ✅ Integration tests (real Gmail account)

### What's NOT Included
- ❌ Reading mailbox (Build 132)
- ❌ Drafting emails (Build 133)
- ❌ Preview engine (Build 134)
- ❌ Approval gates (Build 135+)

---

## Architecture

### Directory Structure

```
lib/connectors/
├── sdk/                          (Reusable SDK)
│   ├── base-connector.ts        (Abstract base)
│   ├── base-authenticator.ts    (OAuth handling)
│   ├── base-executor.ts         (Action execution)
│   ├── connector-types.ts       (Shared types)
│   └── connector-manifest.ts    (Metadata schema)
├── gmail/                        (Gmail-specific)
│   ├── manifest.ts              (Gmail config)
│   ├── authenticator.ts         (Gmail OAuth)
│   ├── connection-manager.ts    (Token storage)
│   ├── types.ts                 (Gmail types)
│   └── executor.ts              (Gmail actions)
└── index.ts                      (Export barrel)

app/connectors/
├── connect/
│   ├── page.tsx                 (Connector list)
│   └── [provider]/page.tsx      (OAuth flow)
└── setup/
    └── gmail/page.tsx           (Gmail setup wizard)

prisma/
├── migrations/
│   └── [timestamp]_add_connectors/
│       └── migration.sql        (Connector tables)
└── schema.prisma                (Updated schema)

tests/
├── connectors.spec.ts           (Unit tests)
└── gmail-oauth.integration.spec.ts (Integration)
```

---

## Prisma Schema Extensions

**New Models:**

```prisma
model Connector {
  id              String   @id @default(cuid())
  key             String   @unique              // "gmail", "calendar", "github"
  name            String                        // "Gmail"
  provider        String                        // "google"
  category        String                        // "email", "calendar", "vcs"
  description     String?
  authType        String                        // "oauth2", "api_key", "bot_token"
  enabled         Boolean  @default(true)
  status          String   @default("active")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  connections     ConnectorConnection[]
  actions         ConnectorAction[]
  executions      ConnectorExecution[]
  audits          ConnectorAudit[]

  @@index([provider])
  @@index([category])
  @@index([enabled])
}

model ConnectorConnection {
  id              String   @id @default(cuid())
  connectorId     String
  connector       Connector @relation(fields: [connectorId], references: [id], onDelete: Cascade)

  userId          String                        // User who connected
  displayName     String?                       // "Gmail Account: user@gmail.com"
  accountId       String                        // External account ID
  email           String?                       // "user@gmail.com"
  
  // OAuth tokens (encrypted in DB, never exposed to client)
  accessToken     String    @db.Text           // Encrypted
  refreshToken    String?   @db.Text           // Encrypted (nullable)
  expiresAt       DateTime?                     // Access token expiry
  
  status          String    @default("active")  // active, expired, revoked
  lastUsedAt      DateTime?
  lastSyncedAt    DateTime?
  
  metadata        Json?     // Provider-specific data
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  executions      ConnectorExecution[]
  audits          ConnectorAudit[]

  @@unique([connectorId, userId, accountId])
  @@index([userId])
  @@index([status])
  @@index([createdAt])
}

model ConnectorAction {
  id              String   @id @default(cuid())
  connectorId     String
  connector       Connector @relation(fields: [connectorId], references: [id], onDelete: Cascade)

  name            String                        // "read_messages", "send_email"
  displayName     String                        // "Read Messages"
  description     String?
  scope           String?                       // OAuth scope required
  riskLevel       String   @default("low")     // low, medium, high
  requiresApproval Boolean @default(false)
  
  inputSchema     Json                          // JSON schema
  outputSchema    Json                          // JSON schema
  
  status          String   @default("active")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([connectorId, name])
  @@index([riskLevel])
}

model ConnectorExecution {
  id              String   @id @default(cuid())
  
  connectorId     String
  connector       Connector @relation(fields: [connectorId], references: [id], onDelete: Cascade)
  
  connectionId    String
  connection      ConnectorConnection @relation(fields: [connectionId], references: [id], onDelete: Cascade)
  
  actionName      String                        // "read_messages"
  actionParams    Json                          // Input parameters
  
  status          String   @default("pending")  // pending, preview, approved, queued, executing, completed, failed
  
  // Preview
  preview         Json?                         // What would happen
  previewedAt     DateTime?
  
  // Approval
  approvalStatus  String   @default("pending")  // pending, approved, rejected
  approvedBy      String?
  approvalNote    String?
  approvedAt      DateTime?
  
  // Execution
  result          Json?
  error           String?
  executedAt      DateTime?
  
  // Timing
  queuedAt        DateTime?
  startedAt       DateTime?
  completedAt     DateTime?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  approvals       ConnectorApproval[]
  audits          ConnectorAudit[]

  @@index([status])
  @@index([approvalStatus])
  @@index([actionName])
  @@index([createdAt])
}

model ConnectorApproval {
  id              String   @id @default(cuid())
  executionId     String
  execution       ConnectorExecution @relation(fields: [executionId], references: [id], onDelete: Cascade)
  
  reviewer        String
  decision        String                        // "approved", "rejected", "requested_changes"
  reason          String?
  requestedChange String?
  
  createdAt       DateTime @default(now())

  @@index([executionId])
  @@index([reviewer])
  @@index([decision])
}

model ConnectorAudit {
  id              String   @id @default(cuid())
  
  connectorId     String
  connector       Connector @relation(fields: [connectorId], references: [id], onDelete: Cascade)
  
  connectionId    String
  connection      ConnectorConnection @relation(fields: [connectionId], references: [id], onDelete: Cascade)
  
  executionId     String
  execution       ConnectorExecution @relation(fields: [executionId], references: [id], onDelete: Cascade)
  
  operator        String
  action          String                        // "oauth_connect", "send_email", "read_messages"
  riskLevel       String   @default("medium")
  
  input           Json?                         // Sanitized, no secrets
  output          Json?                         // Sanitized, no secrets
  
  status          String                        // "success", "failed"
  errorMessage    String?
  
  approvalPath    String?                       // Approval gate summary
  
  timestamp       DateTime @default(now())      // Fixed UTC timestamp
  createdAt       DateTime @default(now())

  @@index([connectorId])
  @@index([action])
  @@index([operator])
  @@index([status])
  @@index([timestamp])
}

model ConnectorCredential {
  id              String   @id @default(cuid())
  key             String   @unique              // "GMAIL_CLIENT_ID", "GITHUB_APP_SECRET"
  value           String   @db.Text             // Encrypted
  environment     String   @default("dev")      // dev, staging, production
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([key])
  @@index([environment])
}
```

---

## Acceptance Criteria

### OAuth Flow
- [ ] Google OAuth consent screen configured
- [ ] `/api/connectors/gmail/oauth/authorize` endpoint returns Google auth URL
- [ ] OAuth callback (`/connectors/connect/gmail`) exchanges code for tokens
- [ ] Access token stored securely (encrypted in DB)
- [ ] Refresh token stored securely
- [ ] Token refresh logic works automatically
- [ ] User can disconnect (revoke tokens)

### Connection Management
- [ ] `ConnectorConnection` model persisted to DB
- [ ] Connection metadata stored (email, display name)
- [ ] Multiple accounts per user supported
- [ ] Connection status tracked (active, expired, revoked)
- [ ] Last used timestamp updated on each use

### SDK Foundation
- [ ] `BaseConnector` abstract class defined
- [ ] `BaseAuthenticator` handles OAuth flow
- [ ] `BaseExecutor` structure in place
- [ ] `ConnectorManifest` schema defined
- [ ] TypeScript types exported

### API Endpoints
- [ ] `POST /api/connectors/gmail/oauth/authorize` (returns auth URL)
- [ ] `GET /api/connectors/gmail/oauth/callback` (exchanges code)
- [ ] `GET /api/connectors/gmail/connections` (list user's connections)
- [ ] `DELETE /api/connectors/gmail/connections/[id]` (disconnect)
- [ ] `GET /api/connectors/gmail/status` (health check)

### Tests
- [ ] Unit tests: Mocked OAuth flow ✅
- [ ] Unit tests: Token refresh logic ✅
- [ ] Unit tests: Connection persistence ✅
- [ ] Integration tests: Real Gmail OAuth (dev account only) ✅
- [ ] Smoke tests pass ✅
- [ ] Zero hydration warnings ✅

### Quality Gates
- [ ] `npm run build` passes
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All smoke tests pass
- [ ] Zero hydration warnings
- [ ] TypeScript clean
- [ ] Prisma migration generated
- [ ] Build committed as atomic commit
- [ ] Metrics recorded
- [ ] No breaking changes

---

## Implementation Steps

### Step 1: Prisma Schema & Migration (Day 1)
- [ ] Add connector models to schema.prisma
- [ ] Generate migration: `npx prisma migrate dev --name add_connectors`
- [ ] Seed dev database with Connector records (Gmail, Calendar, etc.)
- [ ] Verify schema compiles

### Step 2: Base Connector SDK (Day 1)
- [ ] Create `lib/connectors/sdk/connector-types.ts`
- [ ] Create `lib/connectors/sdk/connector-manifest.ts`
- [ ] Create `lib/connectors/sdk/base-authenticator.ts` (abstract)
- [ ] Create `lib/connectors/sdk/base-connector.ts` (abstract)
- [ ] Write unit tests for base classes

### Step 3: Gmail OAuth Implementation (Day 2)
- [ ] Set up Google OAuth in Google Cloud Console
- [ ] Get Client ID and Client Secret
- [ ] Store in `.env.local` (dev) and Secrets Manager (prod)
- [ ] Create `lib/connectors/gmail/manifest.ts`
- [ ] Create `lib/connectors/gmail/authenticator.ts` (extends BaseAuthenticator)
- [ ] Implement token encryption/decryption

### Step 4: API Endpoints (Day 2)
- [ ] Create `app/api/connectors/gmail/oauth/authorize.ts`
- [ ] Create `app/api/connectors/gmail/oauth/callback.ts`
- [ ] Create `app/api/connectors/gmail/connections.ts` (GET, DELETE)
- [ ] Create `app/api/connectors/gmail/status.ts`
- [ ] Implement error handling
- [ ] Add rate limiting

### Step 5: UI Components (Day 3)
- [ ] Create `app/connectors/page.tsx` (list of available connectors)
- [ ] Create `app/connectors/connect/[provider]/page.tsx` (OAuth flow)
- [ ] Add "Connect Gmail" button
- [ ] Show connection status
- [ ] Add disconnect button

### Step 6: Testing (Day 3)
- [ ] Unit tests: OAuth flow (mocked)
- [ ] Unit tests: Token encryption
- [ ] Unit tests: Connection persistence
- [ ] Integration tests: Real OAuth (dev account)
- [ ] Manual QA: Full flow

### Step 7: Documentation & Cleanup (Day 4)
- [ ] Update API documentation
- [ ] Add code comments
- [ ] Create connector setup guide
- [ ] Commit build
- [ ] Record metrics

---

## Key Implementation Files

### lib/connectors/sdk/connector-types.ts
```typescript
export interface ConnectorManifest {
  key: string;              // "gmail"
  name: string;             // "Gmail"
  provider: string;         // "google"
  category: string;         // "email"
  authType: 'oauth2' | 'api_key' | 'bot_token';
  oauthConfig?: {
    clientId: string;
    clientSecret: string;
    scopes: string[];
    authUrl: string;
    tokenUrl: string;
  };
  actions: {
    [key: string]: {
      name: string;
      description: string;
      riskLevel: 'low' | 'medium' | 'high';
      requiresApproval: boolean;
      inputSchema: Record<string, any>;
      outputSchema: Record<string, any>;
    };
  };
}

export interface ConnectorConnection {
  id: string;
  connectorId: string;
  userId: string;
  displayName?: string;
  accountId: string;
  email?: string;
  status: 'active' | 'expired' | 'revoked';
  lastUsedAt?: Date;
}

export interface ConnectorExecution {
  id: string;
  connectionId: string;
  actionName: string;
  status: 'pending' | 'preview' | 'approved' | 'queued' | 'executing' | 'completed' | 'failed';
  result?: Record<string, any>;
  error?: string;
}
```

### lib/connectors/sdk/base-authenticator.ts
```typescript
export abstract class BaseAuthenticator {
  abstract getAuthorizationUrl(): string;
  abstract exchangeCodeForTokens(code: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn: number }>;
  abstract refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }>;
  abstract validateToken(token: string): Promise<boolean>;
  abstract revokeToken(token: string): Promise<void>;
}
```

### lib/connectors/gmail/manifest.ts
```typescript
export const gmailManifest: ConnectorManifest = {
  key: 'gmail',
  name: 'Gmail',
  provider: 'google',
  category: 'email',
  authType: 'oauth2',
  oauthConfig: {
    clientId: process.env.GMAIL_CLIENT_ID!,
    clientSecret: process.env.GMAIL_CLIENT_SECRET!,
    scopes: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.compose',
    ],
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
  },
  actions: {
    read_messages: {
      name: 'Read Messages',
      description: 'List and read messages from your Gmail mailbox',
      riskLevel: 'low',
      requiresApproval: false,
      inputSchema: { /* ... */ },
      outputSchema: { /* ... */ },
    },
    send_email: {
      name: 'Send Email',
      description: 'Send an email via Gmail',
      riskLevel: 'high',
      requiresApproval: true,
      inputSchema: { /* ... */ },
      outputSchema: { /* ... */ },
    },
  },
};
```

---

## Environment Variables

### .env.local (Development)
```
GMAIL_CLIENT_ID=<from Google Cloud Console>
GMAIL_CLIENT_SECRET=<from Google Cloud Console>
GMAIL_REDIRECT_URI=http://localhost:3000/connectors/connect/gmail
```

### Production (Secrets Manager)
- AWS Secrets Manager: `gamma/prod/gmail/client-id`, `gamma/prod/gmail/client-secret`
- Or: Azure Key Vault, Google Secret Manager

---

## Metrics to Record

After completing Build 131:

| Metric | Value |
|--------|-------|
| Build Time | ? seconds |
| Files Created | ? |
| Lines of Code | ? |
| Tests Added | ? |
| Test Pass Rate | 100% |
| Build Size Increase | ? KB |
| Hydration Warnings | 0 |
| TypeScript Errors | 0 |

---

## Known Limitations (Build 131)

- ❌ Cannot read emails yet (Build 132)
- ❌ Cannot draft emails yet (Build 133)
- ❌ No preview engine yet (Build 134)
- ❌ No approval workflow yet (Build 135+)
- ⚠️ Only one Gmail account per user in v1 (multi-account in Phase XVI)
- ⚠️ Token refresh rate-limited (5 min minimum interval)

---

## Verification Checklist

Before marking Build 131 complete:

- [ ] Git commit created: `build-131: Gmail OAuth foundation`
- [ ] All unit tests pass: `npm run test`
- [ ] All smoke tests pass: `npm run test:smoke`
- [ ] Build completes: `npm run build`
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] Zero hydration warnings in logs
- [ ] Manual test: OAuth flow works end-to-end
- [ ] Manual test: Connection persists in DB
- [ ] Prisma schema valid
- [ ] API docs updated
- [ ] Metrics recorded in this file
- [ ] No breaking changes to Phases I-XIV

---

## Next Build (132)

**Build 132: Gmail Mailbox Reader**

- List messages from mailbox
- Full-text search
- Pagination
- Message caching
- Attachment handling

---

**Created:** 2026-07-08  
**Last Updated:** [In Progress]  
**Owner:** Phase XV — Live Connector Framework
