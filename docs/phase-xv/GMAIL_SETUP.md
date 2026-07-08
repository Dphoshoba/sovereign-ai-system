# Gmail Connector Setup Guide (Build 131)

## Prerequisites

1. **Google Cloud Project** with Gmail API enabled
2. **Client ID and Client Secret** from Google OAuth 2.0
3. **Redirect URI** configured in Google Cloud Console

---

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (name: "Gamma - Gmail Connector")
3. Enable the following APIs:
   - Gmail API
   - Google+ API (for user profile)

---

## Step 2: Create OAuth 2.0 Credentials

1. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
2. Choose **Web application**
3. Configure redirect URIs:
   - Development: `http://localhost:3000/api/connectors/gmail/oauth/callback`
   - Staging: `https://staging.sovereign-ai.com/api/connectors/gmail/oauth/callback`
   - Production: `https://sovereign-ai-executive.vercel.app/api/connectors/gmail/oauth/callback`

4. Copy **Client ID** and **Client Secret**

---

## Step 3: Configure Environment Variables

### Development (.env.local)

```bash
# Gmail OAuth
GMAIL_CLIENT_ID=<your-client-id>
GMAIL_CLIENT_SECRET=<your-client-secret>
GMAIL_REDIRECT_URI=http://localhost:3000/api/connectors/gmail/oauth/callback

# Encryption key (change in production!)
ENCRYPTION_KEY=your-super-secret-encryption-key-change-in-production
```

### Production (Secrets Manager)

Use AWS Secrets Manager / Azure Key Vault / Google Secret Manager:

```json
{
  "GMAIL_CLIENT_ID": "...",
  "GMAIL_CLIENT_SECRET": "...",
  "ENCRYPTION_KEY": "..."
}
```

---

## Step 4: Set Up Test Gmail Account (Optional)

For integration testing, create a test Gmail account:

- Email: `gamma-test-[env]@gmail.com`
- Keep credentials in your secrets manager
- Use ONLY for integration tests

---

## Step 5: Verify Configuration

Run the status check endpoint:

```bash
curl http://localhost:3000/api/connectors/gmail/status
```

Expected response:

```json
{
  "success": true,
  "connector": {
    "key": "gmail",
    "name": "Gmail",
    "provider": "google",
    "status": "ready"
  },
  "configuration": {
    "valid": true,
    "errors": []
  },
  "actions": ["read_messages", "send_email", "draft_email"],
  "timestamp": "2026-07-08T..."
}
```

---

## Step 6: Test OAuth Flow

### Start Local Server

```bash
npm run dev
```

### Initiate OAuth

```bash
curl -X POST http://localhost:3000/api/connectors/gmail/oauth/authorize
```

Response:

```json
{
  "success": true,
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "redirect": true
}
```

### User Flow

1. Click the `authUrl` or visit `/connectors/connect/gmail`
2. User sees Google consent screen
3. User grants permissions
4. Google redirects to callback endpoint
5. Callback exchanges code for tokens
6. Connection stored in database
7. User redirected to success page

---

## Step 7: Verify Connection

```bash
curl "http://localhost:3000/api/connectors/gmail/connections?userId=user_placeholder"
```

Expected response:

```json
{
  "success": true,
  "connections": [
    {
      "id": "conn_...",
      "displayName": "Gmail Account: user@gmail.com",
      "email": "user@gmail.com",
      "status": "active",
      "lastUsedAt": null,
      "createdAt": "2026-07-08T..."
    }
  ]
}
```

---

## Troubleshooting

### Error: "GMAIL_CLIENT_ID environment variable not set"

- Check `.env.local` file exists
- Verify keys match exactly (case-sensitive)
- Restart dev server after adding variables

### Error: "OAuth error: invalid_grant"

- OAuth code has expired (valid for ~10 minutes)
- Redirect URI doesn't match Google Cloud configuration
- Client ID/Secret mismatch

### Error: "Failed to fetch user profile from Google"

- User hasn't granted email profile scope
- Access token revoked
- Google API temporarily unavailable

### Token Not Stored Encrypted

- Check `ENCRYPTION_KEY` is set (defaults to dev key if not)
- Tokens should NOT be readable in database (should be encrypted)
- Verify with: `SELECT encrypted, length(encrypted) FROM connector_connection`

---

## Security Checklist

- [ ] `ENCRYPTION_KEY` changed from default in production
- [ ] `GMAIL_CLIENT_SECRET` never committed to Git
- [ ] OAuth tokens stored encrypted in database
- [ ] Tokens never exposed in API responses (marked as `***REDACTED***`)
- [ ] Token refresh rate-limited (min 5 minutes)
- [ ] Expired tokens automatically refreshed on use
- [ ] User can disconnect (revoke) anytime

---

## Next Steps (Build 132+)

- [x] Build 131: OAuth foundation
- [ ] Build 132: Mailbox reader (read_messages)
- [ ] Build 133: Draft composer (draft_email)
- [ ] Build 134: Preview engine
- [ ] Build 135: Approval gates
- [ ] Build 136: Execution + audit
- [ ] Build 137-140: Polish, testing, edge cases

---

## Support

- GitHub Issues: [Gamma Issues](https://github.com/Dphoshoba/sovereign-ai-system/issues)
- Documentation: [docs/phase-xv/BUILD131.md](../BUILD131.md)
- Security: [docs/releases/SECURITY.md](../../releases/SECURITY.md)

---

**Build 131: Gmail Connector Foundation — Complete**
