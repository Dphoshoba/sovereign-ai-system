# Stage 3C Credential Model

**Status:** PLANNING (Stage 3C.0)
**Parent:** Stage 3C Architecture Specification

## Overview

The credential model defines how provider credentials are acquired, stored, scoped, refreshed, rotated, and redacted. It applies to all provider integrations, beginning with Google Calendar.

## Credential Lifecycle

```
ACQUIRE ──→ STORE (encrypted) ──→ RETRIEVE (decrypted in-memory) ──→ USE ──→ ROTATE ──→ REVOKE
                                                  │
                                                  └──→ REFRESH (OAuth token refresh)
```

## Credential Types

| Type | Source | Storage | Lifespan |
|---|---|---|---|
| OAuth 2.0 Client ID/Secret | Google Cloud Console | Environment variables at deployment time | Permanent (manual rotation) |
| OAuth 2.0 Access Token | OAuth authorization flow | Encrypted in credential store | 1 hour (Google default) |
| OAuth 2.0 Refresh Token | OAuth authorization flow | Encrypted in credential store | Permanent (revocable by user) |
| API Key (if applicable) | Google Cloud Console | Environment variable or encrypted store | Permanent (manual rotation) |

## Storage Model

### At Rest

| Component | Mechanism | Detail |
|---|---|---|
| Client secret | Environment variable (`GOOGLE_CLIENT_SECRET`) | Never written to disk or database |
| Access token | AES-256-GCM encrypted in credential store | Encryption key from `CREDENTIAL_ENCRYPTION_KEY` env var |
| Refresh token | AES-256-GCM encrypted in credential store | Same encryption key |
| Encryption key | Environment variable (`CREDENTIAL_ENCRYPTION_KEY`) | 32-byte hex, generated at deployment |

### In Transit

- All credential material uses TLS 1.3 to provider endpoints
- Access token is transmitted in `Authorization: Bearer <token>` header
- No credential material in request body, query parameters, or URL paths

### In Memory

- Decrypted tokens exist only in the `CredentialManager` instance for the duration of an execution
- Passed to adapter by reference, not by value copy
- Zeroed from memory after execution completes (best-effort via scope exit)

## CredentialManager Interface (Proposed)

```typescript
interface CredentialManager {
  /** Retrieve a decrypted access token for the given provider and scopes */
  getAccessToken(providerId: string, scopes: string[]): Promise<string>;

  /** Refresh an expired access token using the stored refresh token */
  refreshAccessToken(providerId: string): Promise<string>;

  /** Store a new credential set (used during OAuth setup) */
  storeCredential(
    providerId: string,
    credential: EncryptedCredential,
  ): Promise<void>;

  /** Revoke all credentials for a provider (used during deauthorization) */
  revokeCredentials(providerId: string): Promise<void>;

  /** Redact all credential material from a loggable object */
  redact<T>(obj: T): T;
}
```

## Scope Model

Each provider integration defines the minimum OAuth scopes required:

| Provider | Required Scopes | Granularity |
|---|---|---|
| Google Calendar (read) | `https://www.googleapis.com/auth/calendar.readonly` | Read-only events |
| Google Calendar (write) | `https://www.googleapis.com/auth/calendar.events` | Full event CRUD |

Scopes are requested at credential acquisition time. The runtime never requests scopes wider than the minimum required for the approved operation.

## Token Refresh Flow

```
1. Adapter calls CredentialManager.getAccessToken()
2. Token is expired or near-expiry (within 5 minutes)
3. CredentialManager decrypts refresh token
4. POST to /oauth2/v4/token with grant_type=refresh_token
5. New access token received
6. New access token encrypted and stored (replaces old)
7. Return decrypted access token
8. If refresh fails (invalid_grant): mark credentials as REVOKED, escalate
```

## Redaction Policy

- **All tokens** are redacted before any log output, audit record, or error message
- Redaction uses a fixed placeholder: `[REDACTED:nbytes]` where `nbytes` is the original length (for performance analysis without exposing content)
- The `CredentialManager.redact()` function recursively walks objects and replaces known credential fields
- Known credential field patterns: `access_token`, `refresh_token`, `client_secret`, `api_key`, `Authorization`, `Bearer`
- Adapter implementations must call `credentialManager.redact()` on all log-worthy objects

## Rotation Policy

| Credential | Rotation Trigger | Mechanism |
|---|---|---|
| Client secret | Manual (deployment) | Update environment variable, restart runtime |
| Encryption key | Manual (deployment) | Re-encrypt all stored credentials with new key |
| Refresh token | On security event or manual | Revoke old token, re-authorize OAuth flow |

## Audit for Credential Events

Every credential operation produces an audit event:

| Event | Fields (all non-sensitive) |
|---|---|
| `CREDENTIAL_ACQUIRED` | providerId, scopes, acquiredAt |
| `CREDENTIAL_REFRESHED` | providerId, oldExpiry, newExpiry |
| `CREDENTIAL_REVOKED` | providerId, reason |
| `CREDENTIAL_REDACTED` | providerId, context (log/audit/error) |
| `CREDENTIAL_FAILURE` | providerId, errorCode (no token material) |

## Rejected Approaches

| Approach | Reason |
|---|---|
| Plaintext storage | Violates fail-closed principle |
| Single shared key for all providers | Violates least-privilege; one breach exposes all |
| Credentials in adapter code | G-010 prohibits provider business logic in adapters |
| Client-side OAuth flow | Requires user interaction; incompatible with server-side orchestration |
